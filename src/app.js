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
app.use(express.urlencoded({ limit: "16kb" }));
app.use(express.cookieParser());

export { app };
