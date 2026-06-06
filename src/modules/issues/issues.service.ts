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






export const issuesService = {
createIssueIntoDB
}