import { Router } from "express";
import {
  getLikedVideos,
  toggleCommentLike,
  toggleVideoLike,
  toggleTweetLike,
} from "../controllers/like.controllers.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyToken); // Apply verifyJWT middleware to all routes in this file

router.route("/toggle/v/:videoId").post(toggleVideoLike);
router.route("/toggle/c/:videoId/:commentId").post(toggleCommentLike);
router.route("/toggle/t/:videoId/:tweetId").post(toggleTweetLike);
router.route("/videos").get(getLikedVideos);

export default router;
