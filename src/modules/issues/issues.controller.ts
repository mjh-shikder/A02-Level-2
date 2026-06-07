import type { Request, Response } from "express";
import { issuesService } from "./issues.service";
import type { IAuthRequest } from "../../middlewares/auth.middleware";
import sendResponse from "../../utility/sendResponse";

const createIssue = async (req: IAuthRequest, res: Response) => {
  try {
    const { title, description, type } = req.body;
    const reporter_id = req.user?.id;

    if (!reporter_id) {
      sendResponse(res, {
        statusCode: 401,
        success: false,
        message: "Unauthorized: Missing user information",
      });
      //
      // res.status(401).json({
      //   success: false,
      //   message: "Unauthorized: Missing user information",
      // });
      return;
    }

    if (!title || typeof title !== "string" || title.trim() === "") {
      sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "Title is required and must be a string",
      });
      //
      // res.status(400).json({
      //   success: false,
      //   message: "Title is required and must be a string",
      // });
      return;
    }

    if (title.length > 150) {
      sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "Title must not exceed 150 characters",
      });
      //
      // res.status(400).json({
      //   success: false,
      //   message: "Title must not exceed 150 characters",
      // });
      return;
    }

    if (
      !description ||
      typeof description !== "string" ||
      description.trim() === ""
    ) {
      sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "Description is required and must be a string",
      });
      //
      // res.status(400).json({
      //   success: false,
      //   message: "Description is required and must be a string",
      // });
      return;
    }

    if (description.length < 20) {
      sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "Description must be at least 20 characters long",
      });
      //
      // res.status(400).json({
      //   success: false,
      //   message: "Description must be at least 20 characters long",
      // });
      return;
    }

    if (!type || (type !== "bug" && type !== "feature_request")) {
      sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "Type must be either 'bug' or 'feature_request'",
      });
      //
      // res.status(400).json({
      //   success: false,
      //   message: "Type must be either 'bug' or 'feature_request'",
      // });
      return;
    }

    const newIssue = await issuesService.createIssueIntoDB({
      title,
      description,
      type,
      reporter_id,
    });

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Issue created successfully",
      data: newIssue,
    });

    // res.status(201).json({
    //   success: true,
    //   message: "Issue created successfully",
    //   data: newIssue,

    // });
  } catch (error) {
    console.error("Create issue error:", error);
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: "Internal server error during issue creation",
    });

    // res.status(500).json({
    //   success: false,
    //   message: "Internal server error during issue creation",
    // });
  }
};

// Get all issues
const getAllIssues = async (req: IAuthRequest, res: Response) => {
  try {
    const { sort = "newest", type, status } = req.query;

    if (sort !== "newest" && sort !== "oldest") {
      sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "Sort query parameter must be 'newest' or 'oldest'",
      });
      ///
      // res.status(400).json({
      //   success: false,
      //   message: "Sort query parameter must be 'newest' or 'oldest'",
      // });
      return;
    }

    if (type && type !== "bug" && type !== "feature_request") {
      sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "Type query parameter must be 'bug' or 'feature_request'",
      });
      ///
      // res.status(400).json({
      //   success: false,
      //   message: "Type query parameter must be 'bug' or 'feature_request'",
      // });
      return;
    }

    if (
      status &&
      status !== "open" &&
      status !== "in_progress" &&
      status !== "resolved"
    ) {
      sendResponse(res, {
        statusCode: 400,
        success: false,
        message:
          "Status query parameter must be 'open', 'in_progress', or 'resolved'",
      });
      ///
      // res.status(400).json({
      //   success: false,
      //   message:
      //     "Status query parameter must be 'open', 'in_progress', or 'resolved'",
      // });
      return;
    }

    const issues = await issuesService.getAllIssuesFromDB({
      sort: sort as "newest" | "oldest",
      type: type as string,
      status: status as string,
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issues retrieved successfully",
      data: issues,
    });
    //
    // res.status(200).json({
    //   success: true,
    //   message: "Issues retrieved successfully",
    //   data: issues,
    // });
  } catch (error) {
    console.error("Get all issues error:", error);
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: "Internal server error retrieving issues",
    });
    //
    // res.status(500).json({
    //   success: false,
    //   message: "Internal server error retrieving issues",
    // });
  }
};

// get single issu

const getSingleIssue = async (req: IAuthRequest, res: Response) => {
  try {
    const idParam = req.params.id;
    if (!idParam || Array.isArray(idParam)) {
      sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "Invalid issue ID",
      });

      //
      // res.status(400).json({
      //   success: false,
      //   message: "Invalid issue ID",
      // });
      return;
    }

    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "Invalid issue ID",
      });
      //
      // res.status(400).json({
      //   success: false,
      //   message: "Invalid issue ID",
      // });
      return;
    }

    const issue = await issuesService.getSingleIssueFromDB(id);

    if (!issue) {
      sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Issue not found",
      });
      //
      // res.status(404).json({
      //   success: false,
      //   message: "Issue not found",
      // });
      return;
    }

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue retrieved successfully",
      data: issue,
    });
    //
    // res.status(200).json({
    //   success: true,
    //   message: "Issue retrieved successfully",
    //   data: issue,
    // });
  } catch (error) {
    console.error("Get single issue error:", error);
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: "Internal server error retrieving issue",
    });
    //
    // res.status(500).json({
    //   success: false,
    //   message: "Internal server error retrieving issue",
    // });
  }
};

// Update issue
const updateIssue = async (req: IAuthRequest, res: Response) => {
  try {
    const idParam = req.params.id;
    if (!idParam || Array.isArray(idParam)) {
      sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "Invalid issue ID",
      });
      //
      // res.status(400).json({
      //   success: false,
      //   message: "Invalid issue ID",
      // });
      return;
    }

    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "Invalid issue ID",
      });
      //
      // res.status(400).json({
      //   success: false,
      //   message: "Invalid issue ID",
      // });
      return;
    }

    const user = req.user;
    if (!user) {
      sendResponse(res, {
        statusCode: 401,
        success: false,
        message: "Unauthorized",
      });
      //
      // res.status(401).json({
      //   success: false,
      //   message: "Unauthorized",
      // });
      return;
    }

    // Check if issue exists
    const issue = await issuesService.getRawIssueById(id);
    if (!issue) {
      sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Issue not found",
      });
      //
      // res.status(404).json({
      //   success: false,
      //   message: "Issue not found",
      // });
      return;
    }

    // Role-based authorization
    if (user.role === "contributor") {
      // Must be the owner
      if (issue.reporter_id !== user.id) {
        sendResponse(res, {
          statusCode: 403,
          success: false,
          message: "Forbidden: You cannot modify other contributors' issues",
        });
        //
        // res.status(403).json({
        //   success: false,
        //   message: "Forbidden: You cannot modify other contributors' issues",
        // });
        return;
      }

      //  check Issue status open
      if (issue.status !== "open") {
        sendResponse(res, {
          statusCode: 409,
          success: false,
          message: `Conflict: Issue is currently ${issue.status}. Only open issues can be modified by contributors.`,
        });
        //
        // res.status(409).json({
        //   success: false,
        //   message: `Conflict: Issue is currently ${issue.status}. Only open issues can be modified by contributors.`,
        // });
        return;
      }

      if (req.body.status !== undefined) {
        sendResponse(res, {
          statusCode: 403,
          success: false,
          message: "Forbidden: Contributors cannot change issue status",
        });
        //
        // res.status(403).json({
        //   success: false,
        //   message: "Forbidden: Contributors cannot change issue status",
        // });
        return;
      }
    }

    const { title, description, type, status } = req.body;

    // Optional fields validation if provided
    const updateData: any = {};

    if (title !== undefined) {
      if (typeof title !== "string" || title.trim() === "") {
        sendResponse(res, {
          statusCode: 400,
          success: false,
          message: "Title must be a non-empty string",
        });
        //
        // res.status(400).json({
        //   success: false,
        //   message: "Title must be a non-empty string",
        // });
        return;
      }
      if (title.length > 150) {
        sendResponse(res, {
          statusCode: 400,
          success: false,
          message: "Title must not exceed 150 characters",
        });
        //
        // res.status(400).json({
        //   success: false,
        //   message: "Title must not exceed 150 characters",
        // });
        return;
      }
      updateData.title = title;
    }

    if (description !== undefined) {
      if (typeof description !== "string" || description.trim() === "") {
        sendResponse(res, {
          statusCode: 400,
          success: false,
          message: "Description must be a non-empty string",
        });
        //
        // res.status(400).json({
        //   success: false,
        //   message: "Description must be a non-empty string",
        // });
        return;
      }
      if (description.length < 20) {
        sendResponse(res, {
          statusCode: 400,
          success: false,
          message: "Description must be at least 20 characters long",
        });
        //
        // res.status(400).json({
        //   success: false,
        //   message: "Description must be at least 20 characters long",
        // });
        return;
      }
      updateData.description = description;
    }

    if (type !== undefined) {
      if (type !== "bug" && type !== "feature_request") {
        sendResponse(res, {
          statusCode: 400,
          success: false,
          message: "Type must be either 'bug' or 'feature_request'",
        });
        //
        // res.status(400).json({
        //   success: false,
        //   message: "Type must be either 'bug' or 'feature_request'",
        // });
        return;
      }
      updateData.type = type;
    }

    if (status !== undefined) {
      if (
        status !== "open" &&
        status !== "in_progress" &&
        status !== "resolved"
      ) {
        sendResponse(res, {
          statusCode: 400,
          success: false,
          message: "Status must be 'open', 'in_progress', or 'resolved'",
        });
        //
        // res.status(400).json({
        //   success: false,
        //   message: "Status must be 'open', 'in_progress', or 'resolved'",
        // });
        return;
      }
      updateData.status = status;
    }

    const updatedIssue = await issuesService.updateIssueInDB(id, updateData);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue updated successfully",
      data: updatedIssue,
    });
    //
    // res.status(200).json({
    //   success: true,
    //   message: "Issue updated successfully",
    //   data: updatedIssue,
    // });
  } catch (error) {
    console.error("Update issue error:", error);
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: "Internal server error during issue update",
    });
    //
    // res.status(500).json({
    //   success: false,
    //   message: "Internal server error during issue update",
    // });
  }
};

// delete issue
const deleteIssue = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    const idParam = req.params.id;
    if (!idParam || Array.isArray(idParam)) {
      sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "Invalid issue ID",
      });
      //
      // res.status(400).json({
      //   success: false,
      //   message: "Invalid issue ID",
      // });
      return;
    }

    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "Invalid issue ID",
      });
      ///
      // res.status(400).json({
      //   success: false,
      //   message: "Invalid issue ID",
      // });
      return;
    }

    const issue = await issuesService.getRawIssueById(id);
    if (!issue) {
      sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Issue Not Found",
      });
      ///
      // res.status(404).json({
      //   success: false,
      //   message: "Issue not found",
      // });
      return;
    }

    await issuesService.deleteIssueFromDB(id);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue deleted successfully",
    });
    //
    // res.status(200).json({
    //   success: true,
    //   message: "Issue deleted successfully",
    // });
  } catch (error) {
    console.error("Delete issue error:", error);
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: "Internal server error deleting issue",
    });
    //
    // res.status(500).json({
    //   success: false,
    //   message: "Internal server error deleting issue",
    // });
  }
};

export const issuesController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue,
};
