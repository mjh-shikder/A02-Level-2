import type { CreateIssuePayload, UpdateIssuePayload } from "../../types";
export declare const getSingleIssueFromDB: (id: number) => Promise<any>;
export declare const getRawIssueById: (id: number) => Promise<any>;
export declare const issuesService: {
    createIssueIntoDB: (payload: CreateIssuePayload) => Promise<any>;
    getAllIssuesFromDB: (filters: {
        sort?: "newest" | "oldest";
        type?: string;
        status?: string;
    }) => Promise<any[]>;
    getSingleIssueFromDB: (id: number) => Promise<any>;
    getRawIssueById: (id: number) => Promise<any>;
    updateIssueInDB: (id: number, fields: UpdateIssuePayload) => Promise<any>;
    deleteIssueFromDB: (id: number) => Promise<void>;
};
//# sourceMappingURL=issues.service.d.ts.map