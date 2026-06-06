import type { Request, Response } from "express";
import { issuesService } from "./issues.service";
import type { IAuthRequest } from "../../middlewares/auth.middleware";


const createIssue = async (req: IAuthRequest, res: Response) => {
    try {
        
        const { title, description, type } = req.body
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

        res.status(201).json({
          success: true,
          message: "Issue created successfully",
          data: newIssue,
        });

    } catch (error) {
        
    }
}



export const issuesController = {
    createIssue,

}