import type { Request, Response } from "express";
import { issuesService } from "./issues.service";
import type { IAuthRequest } from "../../middlewares/auth.middleware";
import sendResponse from "../../utility/sendResponse";

const createIssue = async (req: IAuthRequest, res: Response) => {
  try {
    const { title, description, type } = req.body;
    const reporter_id = req.user?.id;

    if (!reporter_id) {
      res.status(401).json({
        success: false,
        message: "Unauthorized: Missing user information",
      });
      return;
    }

    if (!title || typeof title !== "string" || title.trim() === "") {
      res.status(400).json({
        success: false,
        message: "Title is required and must be a string",
      });
      return;
    }

    if (title.length > 150) {
      res.status(400).json({
        success: false,
        message: "Title must not exceed 150 characters",
      });
      return;
    }

    if (
      !description ||
      typeof description !== "string" ||
      description.trim() === ""
    ) {
      res.status(400).json({
        success: false,
        message: "Description is required and must be a string",
      });
      return;
    }

    if (description.length < 20) {
      res.status(400).json({
        success: false,
        message: "Description must be at least 20 characters long",
      });
      return;
    }

    if (!type || (type !== "bug" && type !== "feature_request")) {
      res.status(400).json({
        success: false,
        message: "Type must be either 'bug' or 'feature_request'",
      });
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
      res.status(400).json({
        success: false,
        message: "Sort query parameter must be 'newest' or 'oldest'",
      });
      return;
    }

    if (type && type !== "bug" && type !== "feature_request") {
      res.status(400).json({
        success: false,
        message: "Type query parameter must be 'bug' or 'feature_request'",
      });
      return;
    }

    if (
      status &&
      status !== "open" &&
      status !== "in_progress" &&
      status !== "resolved"
    ) {
      res.status(400).json({
        success: false,
        message:
          "Status query parameter must be 'open', 'in_progress', or 'resolved'",
      });
      return;
    }

    const issues = await issuesService.getAllIssuesFromDB({
      sort: sort as "newest" | "oldest",
      type: type as string,
      status: status as string,
    });

    res.status(200).json({
      success: true,
      message: "Issues retrieved successfully",
      data: issues,
    });
  } catch (error) {
    console.error("Get all issues error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error retrieving issues",
    });
  }
};

// get single issu

const getSingleIssue = async (req: IAuthRequest, res: Response) => {
  try {
    const idParam = req.params.id;
    if (!idParam || Array.isArray(idParam)) {
      res.status(400).json({
        success: false,
        message: "Invalid issue ID",
      });
      return;
    }

    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid issue ID",
      });
      return;
    }

    const issue = await issuesService.getSingleIssueFromDB(id);

    if (!issue) {
      res.status(404).json({
        success: false,
        message: "Issue not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Issue retrieved successfully",
      data: issue,
    });
  } catch (error) {
    console.error("Get single issue error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error retrieving issue",
    });
  }
};

// Update issue
const updateIssue = async (req: IAuthRequest, res: Response) => {
  try {
    const idParam = req.params.id;
    if (!idParam || Array.isArray(idParam)) {
      res.status(400).json({
        success: false,
        message: "Invalid issue ID",
      });
      return;
    }

    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid issue ID",
      });
      return;
    }

    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    // Check if issue exists
    const issue = await issuesService.getRawIssueById(id);
    if (!issue) {
      res.status(404).json({
        success: false,
        message: "Issue not found",
      });
      return;
    }

    // Role-based authorization
    if (user.role === "contributor") {
      // Must be the owner
      if (issue.reporter_id !== user.id) {
        res.status(403).json({
          success: false,
          message: "Forbidden: You cannot modify other contributors' issues",
        });
        return;
      }

      //  check Issue status open
      if (issue.status !== "open") {
        res.status(409).json({
          success: false,
          message: `Conflict: Issue is currently ${issue.status}. Only open issues can be modified by contributors.`,
        });
        return;
      }

      if (req.body.status !== undefined) {
        res.status(403).json({
          success: false,
          message: "Forbidden: Contributors cannot change issue status",
        });
        return;
      }
    }

    const { title, description, type, status } = req.body;

    // Optional fields validation if provided
    const updateData: any = {};

    if (title !== undefined) {
      if (typeof title !== "string" || title.trim() === "") {
        res.status(400).json({
          success: false,
          message: "Title must be a non-empty string",
        });
        return;
      }
      if (title.length > 150) {
        res.status(400).json({
          success: false,
          message: "Title must not exceed 150 characters",
        });
        return;
      }
      updateData.title = title;
    }

    if (description !== undefined) {
      if (typeof description !== "string" || description.trim() === "") {
        res.status(400).json({
          success: false,
          message: "Description must be a non-empty string",
        });
        return;
      }
      if (description.length < 20) {
        res.status(400).json({
          success: false,
          message: "Description must be at least 20 characters long",
        });
        return;
      }
      updateData.description = description;
    }

    if (type !== undefined) {
      if (type !== "bug" && type !== "feature_request") {
        res.status(400).json({
          success: false,
          message: "Type must be either 'bug' or 'feature_request'",
        });
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
        res.status(400).json({
          success: false,
          message: "Status must be 'open', 'in_progress', or 'resolved'",
        });
        return;
      }
      updateData.status = status;
    }

    const updatedIssue = await issuesService.updateIssueInDB(id, updateData);

    res.status(200).json({
      success: true,
      message: "Issue updated successfully",
      data: updatedIssue,
    });
  } catch (error) {
    console.error("Update issue error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during issue update",
    });
  }
};

// delete issue
const deleteIssue = async (req: IAuthRequest, res: Response): Promise<void> => {
  try {
    const idParam = req.params.id;
    if (!idParam || Array.isArray(idParam)) {
      res.status(400).json({
        success: false,
        message: "Invalid issue ID",
      });
      return;
    }

    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid issue ID",
      });
      return;
    }

    const issue = await issuesService.getRawIssueById(id);
    if (!issue) {
      res.status(404).json({
        success: false,
        message: "Issue not found",
      });
      return;
    }

    await issuesService.deleteIssueFromDB(id);

    res.status(200).json({
      success: true,
      message: "Issue deleted successfully",
    });
  } catch (error) {
    console.error("Delete issue error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error deleting issue",
    });
  }
};

export const issuesController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue,
};
