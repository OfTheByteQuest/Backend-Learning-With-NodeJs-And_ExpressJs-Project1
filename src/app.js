import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// Setting up cors middleware

const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  credentials: true,
};

app.use(cors(corsOptions));

// Configuring other middlewares

app.use(express.static("public"));
app.use(express.json({ extended: true, limit: "16kb" }));
app.use(express.urlencoded({ extended: false, limit: "16kb" }));
app.use(cookieParser());

//setting up routes for "./users"

import usersRouter from "./routes/user.routes.js";

app.use("/api/v1/users", usersRouter);

//setting up routes for "./comments"

import commentsRouter from "./routes/comment.routes.js"

app.use("/api/v1/comments", commentsRouter);


export { app };
