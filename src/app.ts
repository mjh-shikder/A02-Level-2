import express, { type Request, type Response } from "express";
import { authRouter } from "./modules/auth/auth.route";
import { issueRouter } from "./modules/issues/issues.route";

const app = express();

app.use(express.json())
app.use(express.text())
app.use(express.urlencoded({ extended: true }));

// modules--
app.use("/api/auth", authRouter);
app.use("/api/issues", issueRouter )


// Root Route
app.get("/", (req : Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Wlecome to Root Route"
  })
});





export default app
