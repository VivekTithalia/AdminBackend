import express from "express";
import dotenv from "dotenv";
dotenv.config();
import Connectdb from "./config/db.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import { clerkMiddleware } from '@clerk/express'

const app = express();
app.use("/api/webhooks", webhookRoutes);
app.use(express.json());
app.use(clerkMiddleware())

app.get("/testing", (req, res) => {
  res.status(200).json({ message: "works fine" });
});

app.listen(process.env.PORT || 3000, () => {
  Connectdb();
  console.log(`server runing on the port number ${process.env.PORT}`);
});
