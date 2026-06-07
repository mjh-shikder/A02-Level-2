import type { NextFunction, Request, Response } from "express";
export interface IAuthRequest extends Request {
    user?: {
        id: number;
        name: string;
        role: "contributor" | "maintainer";
    };
}
export declare const authenticateJWT: (req: IAuthRequest, res: Response, next: NextFunction) => void;
export declare const authorizeRoles: (...roles: ("contributor" | "maintainer")[]) => (req: IAuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.middleware.d.ts.map