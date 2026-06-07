import type { Request, Response } from "express";
import { authService } from "./auth.service";
import { pool } from "../../db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../../config";
import sendResponse from "../../utility/sendResponse";


const signup = async (req: Request, res: Response) => {
    try {
        const result = await authService.createUserIntoDB(req.body)
        
        // console.log(result);
        
        sendResponse(res, {
          statusCode: 201,
          success: true,
          message: "User registered successfully",
          data: result.rows[0],
        });
        //
        // res.status(201).json({
        //   success: true,
        //   message: "User registered successfully",
        //   data: result.rows[0]
        // });


    } catch (error) {
        console.error("Signup error:", error);
        
        sendResponse(res, {
          statusCode: 500,
          success: false,
          message: "Internal server error during registration",
        });
        //
        //  res.status(500).json({
        //  success: false,
        //  message: "Internal server error during registration",
        //  });
    }
}



// Login
const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;


       // console.log(email, password);


        if (!email || typeof email !== "string" || !password || typeof password !== "string") {
                sendResponse(res, {
                  statusCode: 400,
                  success: false,
                  message: "Email and Password are Required",
                });
            //
            // res.status(400).json({
            //     success: false,
            //     message: "Email and Password are Required"
            // })
            return
        }


        const user = await authService.findUserByEmail(email);
        if (!user) {

            sendResponse(res, {
              statusCode: 404,
              success: false,
              message: "User not found",
            });
            //
            // res.status(404).json({
            //     success: false, 
            //     massage: "User not found"
            // })
            return;
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {

            sendResponse(res, {
              statusCode: 401,
              success: false,
              message: "Invalid Password",
            });
            //
            // res.status(401).json({
            //     success: false,
            //     message: "Invalid password"
            // })
            return;
        }

        const jwtPayload ={
            id: user.id,
            name: user.name,
            role: user.role
        }

        const token = jwt.sign(jwtPayload, config.secret as string, { expiresIn: config.jwtExpiresIn });

        const { password: _, ...userWithoutPassword } = user
        
        sendResponse(res, {
          statusCode: 200,
          success: true,
          message: "Login Successful",
          data: {
            token,
            user: userWithoutPassword,
          },
        });
        //
        // res.status(200).json({
        //     success: true,
        //     message: "Login Successful",
        //     data: {
        //         token,
        //         user: userWithoutPassword
        //     }
        // })

    } catch (error) {
        console.log("Login error:", error);
        sendResponse(res, {
          statusCode: 500,
          success: false,
          message: "Internal server error during login",
        });
        //
        // res.status(500).json({
        //     success: false,
        //     message: "Internal server error during login"
        // })
        
    }
}



export const authController = {
    signup,
    login

}