import jwt, {} from "jsonwebtoken";
import config from "../config";
export const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({
            success: false,
            message: "Authorization token is missing",
        });
        return;
    }
    const token = authHeader.startsWith("Bearer ")
        ? authHeader.substring(7)
        : authHeader;
    try {
        const decoded = jwt.verify(token, config.secret);
        req.user = decoded;
        console.log(decoded);
        next();
    }
    catch (error) {
        res.status(401).json({
            success: false,
            message: "Missing, expired, or invalid JWT token",
        });
    }
};
export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
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
//# sourceMappingURL=auth.middleware.js.map