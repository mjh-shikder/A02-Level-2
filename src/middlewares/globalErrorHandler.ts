import type { NextFunction, Request, Response } from "express";


const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  console.error("Global Error Handler caught an error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "An unexpected error occurred",
    errors: err.errors || undefined,
  });
};


export default globalErrorHandler