import type { Request, Response } from "express";
import { authService } from "./auth.service";

const signup = async (req: Request, res: Response) => {
    try {
        const result = await authService.createUserIntoDB(req.body)
        
       // console.log(result);
        
        res.status(201).json({
          success: true,
          message: "User registered successfully",
          data: result.rows[0]
        });


    } catch (error) {
         console.error("Signup error:", error);
         res.status(500).json({
         success: false,
         message: "Internal server error during registration",
         });
    }
}


export const authController = {
    signup,

}