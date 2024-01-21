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

import commentsRouter from "./routes/comment.routes.js";
app.use("/api/v1/comments", commentsRouter);

//setting up routes for "./video"

import videoRouter from "./routes/video.routes.js";
app.use("/api/v1/videos", videoRouter);

//setting up routes for "./healthcheck"

import healthcheckRouter from "./routes/healthcheck.routes.js";
app.use("/api/v1/healthcheck", healthcheckRouter);

//setting up routes for "./dashboard"
import dashboardRouter from "./routes/dashboard.routes.js"
app.use("/api/v1/dashboard", dashboardRouter);

//setting up routes for "./tweet"
import tweetRouter from "./routes/tweet.routes.js"
app.use("/api/v1/tweet", tweetRouter);

//setting up routes for "./like"
import likeRouter from "./routes/like.routes.js"
app.use("/api/v1/like", likeRouter);

//setting up routes for "./playlist"
import playlistRouter from "./routes/playlist.routes.js"
app.use("/api/v1/playlists", playlistRouter);

//setting up routes for "./subscription"
import subscriptionRouter from "./routes/subscription.routes.js"
app.use("/api/v1/subscription", subscriptionRouter);

export { app };
