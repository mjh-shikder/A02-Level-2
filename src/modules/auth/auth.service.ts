import bcrypt from "bcrypt";
import { pool } from "../../db";
import type { ISignup } from "./auth.interface";

const createUserIntoDB = async (payload: ISignup) => {
  const { name, email, password, role } = payload

  
  
  const hashPassword = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `
    INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, COALESCE($4, 'contributor'))
     RETURNING id, name, email, role, created_at, updated_at `,

    [name, email, hashPassword, role],
  );
    return result
}; 



const findUserByEmail = async (email: string) => {
  const result = await pool.query(
    `
        SELECT * FROM users WHERE email = $1
        `,
    [email],
  );
  return result.rows[0] || null;
};

const findUserByID = async (id: number) => {
  const result = await pool.query(
    `
        SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = $1
        `,
    [id],
  );

  return result.rows[0] || null;
};


export const authService = {
  createUserIntoDB,
  findUserByEmail,
  findUserByID,
};
