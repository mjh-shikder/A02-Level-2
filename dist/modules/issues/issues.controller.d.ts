import type { Response } from "express";
import type { IAuthRequest } from "../../middlewares/auth.middleware";
export declare const issuesController: {
    createIssue: (req: IAuthRequest, res: Response) => Promise<void>;
    getAllIssues: (req: IAuthRequest, res: Response) => Promise<void>;
    getSingleIssue: (req: IAuthRequest, res: Response) => Promise<void>;
    updateIssue: (req: IAuthRequest, res: Response) => Promise<void>;
    deleteIssue: (req: IAuthRequest, res: Response) => Promise<void>;
};
//# sourceMappingURL=issues.controller.d.ts.map