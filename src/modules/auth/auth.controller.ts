import type { Request, Response } from "express";
import { authService } from "./auth.service";
import { pool } from "../../db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../../config";


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



// Login
const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;


       // console.log(email, password);


        if (!email || typeof email !== "string" || !password || typeof password !== "string") {
            res.status(400).json({
                success: false,
                message: "Email and Password are Required"
            })
            return
        }


        const user = await authService.findUserByEmail(email);
        if (!user) {
            res.status(401).json({
                success: false, 
                massage: "User not found"
            })
            return;
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            res.status(401).json({
                success: false,
                message: "Invalid password"
            })
            return;
        }

        const jwtPayload ={
            id: user.id,
            name: user.name,
            role: user.role
        }

        const token = jwt.sign(jwtPayload, config.secret as string, { expiresIn: config.jwtExpiresIn });

        const { password: _, ...userWithoutPassword } = user
        
        res.status(200).json({
            success: true,
            message: "Login Successful",
            data: {
                token,
                user: userWithoutPassword
            }
        })

    } catch (error) {
        console.log("Login error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error during login"
        })
        
    }
}



export const authController = {
    signup,
    login

}