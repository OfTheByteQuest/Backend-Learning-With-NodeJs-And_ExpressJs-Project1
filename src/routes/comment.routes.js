import { Router } from "express";
import {
  getVideoComments,
  addComments,
  updateComment,
  deleteComment,
} from "../controllers/comment.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyToken);

//Secured routes
router.route("/:videoId").get(getVideoComments).post(addComments);
router.route("/c/:commentId").delete(deleteComment).patch(updateComment);

export default router;
