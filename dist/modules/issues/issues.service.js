import { pool } from "../../db";
const createIssueIntoDB = async (payload) => {
    const { title, description, type, reporter_id } = payload;
    const result = await pool.query(`
        INSERT INTO issues (title, description, type, reporter_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id, title, description, type, status, reporter_id, created_at, updated_at
        `, [title, description, type, reporter_id]);
    return result.rows[0];
};
const getAllIssuesFromDB = async (filters) => {
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
    // Fetch reporter details without JOINs by batching
    const reporterIds = Array.from(new Set(issues.map((i) => i.reporter_id)));
    const placeholders = reporterIds
        .map((_, index) => `$${index + 1}`)
        .join(", ");
    const usersResult = await pool.query(`SELECT id, name, role FROM users WHERE id IN (${placeholders})`, reporterIds);
    const usersMap = new Map(usersResult.rows.map((u) => [u.id, u]));
    return issues.map((issue) => {
        const { reporter_id, ...issueData } = issue;
        const reporter = usersMap.get(reporter_id) || null;
        return {
            ...issueData,
            reporter,
        };
    });
};
export const getSingleIssueFromDB = async (id) => {
    const result = await pool.query("SELECT * FROM issues WHERE id = $1", [id]);
    const issue = result.rows[0];
    if (!issue) {
        return null;
    }
    // Fetch reporter details in a separate query
    const userResult = await pool.query("SELECT id, name, role FROM users WHERE id = $1", [issue.reporter_id]);
    const reporter = userResult.rows[0] || null;
    const { reporter_id, ...issueData } = issue;
    return {
        ...issueData,
        reporter,
    };
};
export const getRawIssueById = async (id) => {
    const result = await pool.query("SELECT * FROM issues WHERE id = $1", [id]);
    return result.rows[0] || null;
};
// update issue
const updateIssueInDB = async (id, fields) => {
    const updates = [];
    const queryParams = [];
    for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined) {
            queryParams.push(value);
            updates.push(`${key} = $${queryParams.length}`);
        }
    }
    if (updates.length === 0) {
        const result = await pool.query("SELECT * FROM issues WHERE id = $1", [id]);
        return result.rows[0];
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
const deleteIssueFromDB = async (id) => {
    await pool.query("DELETE FROM issues WHERE id = $1", [id]);
};
export const issuesService = {
    createIssueIntoDB,
    getAllIssuesFromDB,
    getSingleIssueFromDB,
    getRawIssueById,
    updateIssueInDB,
    deleteIssueFromDB,
};
//# sourceMappingURL=issues.service.js.map