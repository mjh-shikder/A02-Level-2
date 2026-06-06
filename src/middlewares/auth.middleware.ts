import type { Request } from "express";



export interface IAuthRequest extends Request {
  user?: {
    id: number;
    name: string;
    role: "contributor" | "maintainer";
  };
}

