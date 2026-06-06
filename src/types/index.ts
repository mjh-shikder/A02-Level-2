export interface ISignup {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export interface CreateIssuePayload {
  title: string;
  description: string;
  type: "bug" | "feature_request";
  reporter_id: number;
}

export interface UpdateIssuePayload {
  title?: string;
  description?: string;
  type?: "bug" | "feature_request";
  status?: "open" | "in_progress" | "resolved";
}