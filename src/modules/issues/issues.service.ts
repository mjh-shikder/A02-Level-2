import { pool } from "../../db";
import type { CreateIssuePayload } from "../../types"


const createIssueIntoDB = async (payload: CreateIssuePayload) => {
    const { title, description, type, reporter_id } = payload;

    const result = await pool.query(
      `
        INSERT INTO issues (title, description, type, reporter_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id, title, description, type, status, reporter_id, created_at, updated_at
        `,
      [title, description, type, reporter_id],
    );
    
    return result.rows[0];
}



const getAllIssuesFromDB = async (filters: {
  sort?: "newest" | "oldest";
  type?: string;
  status?: string;
}) => {
  let queryText = "SELECT * FROM issues";
  const queryParams: any[] = [];
  const whereClauses: string[] = [];

  if (filters.type) {
    queryParams.push(filters.type);
    whereClauses.push(`type = $${queryParams.length}`);
  }

  if (filters.status) {
    queryParams.push(filters.status);
    whereClauses.push(`status = $${queryParams.length}`);
  }

  if (whereClauses.length > 0) {
    queryText += " WHERE " + whereClauses.join(" AND ");
  }

  const sortOrder = filters.sort === "oldest" ? "ASC" : "DESC";
  queryText += ` ORDER BY created_at ${sortOrder}`;

  const result = await pool.query(queryText, queryParams);
  const issues = result.rows;

  if (issues.length === 0) {
    return [];
  }

  // Fetch reporter details without JOINs by batching
  const reporterIds = Array.from(new Set(issues.map((i) => i.reporter_id)));

  const placeholders = reporterIds
    .map((_, index) => `$${index + 1}`)
    .join(", ");
  const usersResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id IN (${placeholders})`,
    reporterIds,
  );

  const usersMap = new Map(usersResult.rows.map((u) => [u.id, u]));

  return issues.map((issue) => {
    const { reporter_id, ...issueData } = issue;
    const reporter = usersMap.get(reporter_id) || null;
    return {
      ...issueData,
      reporter,
    };
  });
};



export const issuesService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  
}