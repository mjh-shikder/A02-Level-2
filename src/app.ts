import express from "express";
import { authRouter } from "./modules/auth/auth.route";

const app = express();

app.get("/", (req, res) => {
  res.send("Hello World!");
});


app.use("/api/auth", authRouter);


export default app
