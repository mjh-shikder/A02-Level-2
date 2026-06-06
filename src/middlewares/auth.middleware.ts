import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken"
import config from "../config";


export interface IAuthRequest extends Request {
  user?: {
     id: number;
    name: string;
    role: "contributor" | "maintainer";
  };
}

export const authenticateJWT = (req: IAuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({
            success: false,
            message: "Authorization token is missing",
        })
        return;
    }

    const token = authHeader.startsWith("Bearer ")
        ? authHeader.substring(7)
        : authHeader;

    try {

        const decoded = jwt.verify(token, config.secret as string) as {
            id: number;
            name: string;
            role: "contributor" | "maintainer";
        };

        req.user = decoded

        console.log(decoded);
        
        next()

        
        
    } catch (error) {
        res.status(401).json({
            success: false,
            message: "Missing, expired, or invalid JWT token",
        });
    }

};

export const authorizeRoles = (...roles: ("contributor" | "maintainer")[]) => {
  return (req: IAuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "Forbidden: Insufficient permissions",
      });
      return;
    }

    next();
  };
};
