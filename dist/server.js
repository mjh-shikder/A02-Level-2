import { createRequire } from "module";
        const require = createRequire(import.meta.url);

        

// src/app.ts
import express from "express";

// src/modules/auth/auth.route.ts
import { Router } from "express";

// src/modules/auth/auth.service.ts
import bcrypt from "bcrypt";

// src/db/index.ts
import { Pool } from "pg";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  connection_string: process.env.CONNECTIONSTRING,
  port: process.env.PORT,
  secret: process.env.SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN
};
var config_default = config;

// src/db/index.ts
var pool = new Pool({
  connectionString: config_default.connection_string
});
var initDB = async () => {
  try {
    await pool.query(`
            CREATE TABLE IF NOT EXISTS users(
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role VARCHAR(20) NOT NULL DEFAULT 'contributor' CHECK (role IN ('contributor', 'maintainer')),
            created_at TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP NOT NULL DEFAULT NOW()
            )
            `);
    await pool.query(`
            CREATE TABLE IF NOT EXISTS issues(
            id SERIAL PRIMARY KEY,
            title VARCHAR(150) NOT NULL,
            description TEXT NOT NULL CHECK(LENGTH(description) >= 20),
            type VARCHAR(20) NOT NULL CHECK (type IN ('bug', 'feature_request')),
            status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'resolved')),
            reporter_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
            )
            `);
    console.log("Database Connected Successfully");
  } catch (error) {
    console.log(error);
  }
};

// src/modules/auth/auth.service.ts
var createUserIntoDB = async (payload) => {
  const { name, email, password, role } = payload;
  const hashPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `
    INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, COALESCE($4, 'contributor'))
     RETURNING id, name, email, role, created_at, updated_at `,
    [name, email, hashPassword, role]
  );
  return result;
};
var findUserByEmail = async (email) => {
  const result = await pool.query(
    `
        SELECT * FROM users WHERE email = $1
        `,
    [email]
  );
  return result.rows[0] || null;
};
var findUserByID = async (id) => {
  const result = await pool.query(
    `
        SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = $1
        `,
    [id]
  );
  return result.rows[0] || null;
};
var authService = {
  createUserIntoDB,
  findUserByEmail,
  findUserByID
};

// src/modules/auth/auth.controller.ts
import bcrypt2 from "bcrypt";
import jwt from "jsonwebtoken";

// src/utility/sendResponse.ts
var sendResponse = (res, data) => {
  res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    data: data.data,
    error: data.error
  });
};
var sendResponse_default = sendResponse;

// src/modules/auth/auth.controller.ts
var signup = async (req, res) => {
  try {
    const result = await authService.createUserIntoDB(req.body);
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "User registered successfully",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("Signup error:", error);
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: "Internal server error during registration"
    });
  }
};
var login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      sendResponse_default(res, {
        statusCode: 400,
        success: false,
        message: "Email and Password are Required"
      });
      return;
    }
    const user = await authService.findUserByEmail(email);
    if (!user) {
      sendResponse_default(res, {
        statusCode: 404,
        success: false,
        message: "User not found"
      });
      return;
    }
    const isPasswordMatch = await bcrypt2.compare(password, user.password);
    if (!isPasswordMatch) {
      sendResponse_default(res, {
        statusCode: 401,
        success: false,
        message: "Invalid Password"
      });
      return;
    }
    const jwtPayload = {
      id: user.id,
      name: user.name,
      role: user.role
    };
    const token = jwt.sign(jwtPayload, config_default.secret, { expiresIn: config_default.jwtExpiresIn });
    const { password: _, ...userWithoutPassword } = user;
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Login Successful",
      data: {
        token,
        user: userWithoutPassword
      }
    });
  } catch (error) {
    console.log("Login error:", error);
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: "Internal server error during login"
    });
  }
};
var authController = {
  signup,
  login
};

// src/modules/auth/auth.route.ts
var router = Router();
var authRouter = router;
router.post("/signup", authController.signup);
router.post("/login", authController.login);

// src/modules/issues/issues.route.ts
import { Router as Router2 } from "express";

// src/modules/issues/issues.service.ts
var createIssueIntoDB = async (payload) => {
  const { title, description, type, reporter_id } = payload;
  const result = await pool.query(
    `
        INSERT INTO issues (title, description, type, reporter_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id, title, description, type, status, reporter_id, created_at, updated_at
        `,
    [title, description, type, reporter_id]
  );
  return result.rows[0];
};
var getAllIssuesFromDB = async (filters) => {
  let queryText = "SELECT * FROM issues";
  const queryParams = [];
  const whereClauses = [];
  if (filters.type) {
    queryParams.push(filters.type);
    whereClauses.push(`type = $${queryParams.length}`);
  }
  if (filters.status) {
    queryParams.push(filters.status);
    whereClauses.push(`status = $${queryParams.length}`);
  }
  if (whereClauses.length > 0) {
    queryText += " WHERE " + whereClauses.join(" AND ");
  }
  const sortOrder = filters.sort === "oldest" ? "ASC" : "DESC";
  queryText += ` ORDER BY created_at ${sortOrder}`;
  const result = await pool.query(queryText, queryParams);
  const issues = result.rows;
  if (issues.length === 0) {
    return [];
  }
  const reporterIds = Array.from(new Set(issues.map((i) => i.reporter_id)));
  const placeholders = reporterIds.map((_, index) => `$${index + 1}`).join(", ");
  const usersResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id IN (${placeholders})`,
    reporterIds
  );
  const usersMap = new Map(usersResult.rows.map((u) => [u.id, u]));
  return issues.map((issue) => {
    const { reporter_id, ...issueData } = issue;
    const reporter = usersMap.get(reporter_id) || null;
    return {
      ...issueData,
      reporter
    };
  });
};
var getSingleIssueFromDB = async (id) => {
  const result = await pool.query("SELECT * FROM issues WHERE id = $1", [id]);
  const issue = result.rows[0];
  if (!issue) {
    return null;
  }
  const userResult = await pool.query(
    "SELECT id, name, role FROM users WHERE id = $1",
    [issue.reporter_id]
  );
  const reporter = userResult.rows[0] || null;
  const { reporter_id, ...issueData } = issue;
  return {
    ...issueData,
    reporter
  };
};
var getRawIssueById = async (id) => {
  const result = await pool.query("SELECT * FROM issues WHERE id = $1", [id]);
  return result.rows[0] || null;
};
var updateIssueInDB = async (id, fields) => {
  const updates = [];
  const queryParams = [];
  for (const [key, value] of Object.entries(fields)) {
    if (value !== void 0) {
      queryParams.push(value);
      updates.push(`${key} = $${queryParams.length}`);
    }
  }
  if (updates.length === 0) {
    const result2 = await pool.query("SELECT * FROM issues WHERE id = $1", [id]);
    return result2.rows[0];
  }
  queryParams.push(id);
  const queryText = `
    UPDATE issues
    SET ${updates.join(", ")}, updated_at = NOW()
    WHERE id = $${queryParams.length}
    RETURNING id, title, description, type, status, reporter_id, created_at, updated_at
  `;
  const result = await pool.query(queryText, queryParams);
  return result.rows[0];
};
var deleteIssueFromDB = async (id) => {
  await pool.query("DELETE FROM issues WHERE id = $1", [id]);
};
var issuesService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  getRawIssueById,
  updateIssueInDB,
  deleteIssueFromDB
};

// src/modules/issues/issues.controller.ts
var createIssue = async (req, res) => {
  try {
    const { title, description, type } = req.body;
    const reporter_id = req.user?.id;
    if (!reporter_id) {
      sendResponse_default(res, {
        statusCode: 401,
        success: false,
        message: "Unauthorized: Missing user information"
      });
      return;
    }
    if (!title || typeof title !== "string" || title.trim() === "") {
      sendResponse_default(res, {
        statusCode: 400,
        success: false,
        message: "Title is required and must be a string"
      });
      return;
    }
    if (title.length > 150) {
      sendResponse_default(res, {
        statusCode: 400,
        success: false,
        message: "Title must not exceed 150 characters"
      });
      return;
    }
    if (!description || typeof description !== "string" || description.trim() === "") {
      sendResponse_default(res, {
        statusCode: 400,
        success: false,
        message: "Description is required and must be a string"
      });
      return;
    }
    if (description.length < 20) {
      sendResponse_default(res, {
        statusCode: 400,
        success: false,
        message: "Description must be at least 20 characters long"
      });
      return;
    }
    if (!type || type !== "bug" && type !== "feature_request") {
      sendResponse_default(res, {
        statusCode: 400,
        success: false,
        message: "Type must be either 'bug' or 'feature_request'"
      });
      return;
    }
    const newIssue = await issuesService.createIssueIntoDB({
      title,
      description,
      type,
      reporter_id
    });
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Issue created successfully",
      data: newIssue
    });
  } catch (error) {
    console.error("Create issue error:", error);
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: "Internal server error during issue creation"
    });
  }
};
var getAllIssues = async (req, res) => {
  try {
    const { sort = "newest", type, status } = req.query;
    if (sort !== "newest" && sort !== "oldest") {
      sendResponse_default(res, {
        statusCode: 400,
        success: false,
        message: "Sort query parameter must be 'newest' or 'oldest'"
      });
      return;
    }
    if (type && type !== "bug" && type !== "feature_request") {
      sendResponse_default(res, {
        statusCode: 400,
        success: false,
        message: "Type query parameter must be 'bug' or 'feature_request'"
      });
      return;
    }
    if (status && status !== "open" && status !== "in_progress" && status !== "resolved") {
      sendResponse_default(res, {
        statusCode: 400,
        success: false,
        message: "Status query parameter must be 'open', 'in_progress', or 'resolved'"
      });
      return;
    }
    const issues = await issuesService.getAllIssuesFromDB({
      sort,
      type,
      status
    });
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issues retrieved successfully",
      data: issues
    });
  } catch (error) {
    console.error("Get all issues error:", error);
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: "Internal server error retrieving issues"
    });
  }
};
var getSingleIssue = async (req, res) => {
  try {
    const idParam = req.params.id;
    if (!idParam || Array.isArray(idParam)) {
      sendResponse_default(res, {
        statusCode: 400,
        success: false,
        message: "Invalid issue ID"
      });
      return;
    }
    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      sendResponse_default(res, {
        statusCode: 400,
        success: false,
        message: "Invalid issue ID"
      });
      return;
    }
    const issue = await issuesService.getSingleIssueFromDB(id);
    if (!issue) {
      sendResponse_default(res, {
        statusCode: 404,
        success: false,
        message: "Issue not found"
      });
      return;
    }
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue retrieved successfully",
      data: issue
    });
  } catch (error) {
    console.error("Get single issue error:", error);
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: "Internal server error retrieving issue"
    });
  }
};
var updateIssue = async (req, res) => {
  try {
    const idParam = req.params.id;
    if (!idParam || Array.isArray(idParam)) {
      sendResponse_default(res, {
        statusCode: 400,
        success: false,
        message: "Invalid issue ID"
      });
      return;
    }
    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      sendResponse_default(res, {
        statusCode: 400,
        success: false,
        message: "Invalid issue ID"
      });
      return;
    }
    const user = req.user;
    if (!user) {
      sendResponse_default(res, {
        statusCode: 401,
        success: false,
        message: "Unauthorized"
      });
      return;
    }
    const issue = await issuesService.getRawIssueById(id);
    if (!issue) {
      sendResponse_default(res, {
        statusCode: 404,
        success: false,
        message: "Issue not found"
      });
      return;
    }
    if (user.role === "contributor") {
      if (issue.reporter_id !== user.id) {
        sendResponse_default(res, {
          statusCode: 403,
          success: false,
          message: "Forbidden: You cannot modify other contributors' issues"
        });
        return;
      }
      if (issue.status !== "open") {
        sendResponse_default(res, {
          statusCode: 409,
          success: false,
          message: `Conflict: Issue is currently ${issue.status}. Only open issues can be modified by contributors.`
        });
        return;
      }
      if (req.body.status !== void 0) {
        sendResponse_default(res, {
          statusCode: 403,
          success: false,
          message: "Forbidden: Contributors cannot change issue status"
        });
        return;
      }
    }
    const { title, description, type, status } = req.body;
    const updateData = {};
    if (title !== void 0) {
      if (typeof title !== "string" || title.trim() === "") {
        sendResponse_default(res, {
          statusCode: 400,
          success: false,
          message: "Title must be a non-empty string"
        });
        return;
      }
      if (title.length > 150) {
        sendResponse_default(res, {
          statusCode: 400,
          success: false,
          message: "Title must not exceed 150 characters"
        });
        return;
      }
      updateData.title = title;
    }
    if (description !== void 0) {
      if (typeof description !== "string" || description.trim() === "") {
        sendResponse_default(res, {
          statusCode: 400,
          success: false,
          message: "Description must be a non-empty string"
        });
        return;
      }
      if (description.length < 20) {
        sendResponse_default(res, {
          statusCode: 400,
          success: false,
          message: "Description must be at least 20 characters long"
        });
        return;
      }
      updateData.description = description;
    }
    if (type !== void 0) {
      if (type !== "bug" && type !== "feature_request") {
        sendResponse_default(res, {
          statusCode: 400,
          success: false,
          message: "Type must be either 'bug' or 'feature_request'"
        });
        return;
      }
      updateData.type = type;
    }
    if (status !== void 0) {
      if (status !== "open" && status !== "in_progress" && status !== "resolved") {
        sendResponse_default(res, {
          statusCode: 400,
          success: false,
          message: "Status must be 'open', 'in_progress', or 'resolved'"
        });
        return;
      }
      updateData.status = status;
    }
    const updatedIssue = await issuesService.updateIssueInDB(id, updateData);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue updated successfully",
      data: updatedIssue
    });
  } catch (error) {
    console.error("Update issue error:", error);
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: "Internal server error during issue update"
    });
  }
};
var deleteIssue = async (req, res) => {
  try {
    const idParam = req.params.id;
    if (!idParam || Array.isArray(idParam)) {
      sendResponse_default(res, {
        statusCode: 400,
        success: false,
        message: "Invalid issue ID"
      });
      return;
    }
    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      sendResponse_default(res, {
        statusCode: 400,
        success: false,
        message: "Invalid issue ID"
      });
      return;
    }
    const issue = await issuesService.getRawIssueById(id);
    if (!issue) {
      sendResponse_default(res, {
        statusCode: 404,
        success: false,
        message: "Issue Not Found"
      });
      return;
    }
    await issuesService.deleteIssueFromDB(id);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue deleted successfully"
    });
  } catch (error) {
    console.error("Delete issue error:", error);
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: "Internal server error deleting issue"
    });
  }
};
var issuesController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue
};

// src/middlewares/auth.middleware.ts
import jwt2 from "jsonwebtoken";
var authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({
      success: false,
      message: "Authorization token is missing"
    });
    return;
  }
  const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
  try {
    const decoded = jwt2.verify(token, config_default.secret);
    req.user = decoded;
    console.log(decoded);
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Missing, expired, or invalid JWT token"
    });
  }
};
var authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "Forbidden: Insufficient permissions"
      });
      return;
    }
    next();
  };
};

// src/modules/issues/issues.route.ts
var router2 = Router2();
var issueRouter = router2;
router2.post("/", authenticateJWT, issuesController.createIssue);
router2.get("/", issuesController.getAllIssues);
router2.get("/:id", issuesController.getSingleIssue);
router2.patch("/:id", authenticateJWT, issuesController.updateIssue);
router2.delete("/:id", authenticateJWT, authorizeRoles("maintainer"), issuesController.deleteIssue);

// src/middlewares/globalErrorHandler.ts
var globalErrorHandler = (err, req, res, _next) => {
  console.error("Global Error Handler caught an error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "An unexpected error occurred",
    errors: err.errors || void 0
  });
};
var globalErrorHandler_default = globalErrorHandler;

// src/app.ts
var app = express();
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));
app.use("/api/auth", authRouter);
app.use("/api/issues", issueRouter);
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Wlecome to Root Route"
  });
});
app.use(globalErrorHandler_default);
var app_default = app;

// src/server.ts
var port = config_default.port;
var main = async () => {
  try {
    await initDB();
    app_default.listen(port, () => {
      initDB();
      console.log(`Example app listening on port ${port}`);
    });
  } catch (error) {
    console.log(error);
  }
};
main();
//# sourceMappingURL=server.js.map