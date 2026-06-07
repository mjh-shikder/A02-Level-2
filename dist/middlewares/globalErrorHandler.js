const globalErrorHandler = (err, req, res, _next) => {
    console.error("Global Error Handler caught an error:", err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "An unexpected error occurred",
        errors: err.errors || undefined,
    });
};
export default globalErrorHandler;
//# sourceMappingURL=globalErrorHandler.js.map