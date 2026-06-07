import type { ISignup } from "../../types";
export declare const authService: {
    createUserIntoDB: (payload: ISignup) => Promise<import("pg").QueryResult<any>>;
    findUserByEmail: (email: string) => Promise<any>;
    findUserByID: (id: number) => Promise<any>;
};
//# sourceMappingURL=auth.service.d.ts.map