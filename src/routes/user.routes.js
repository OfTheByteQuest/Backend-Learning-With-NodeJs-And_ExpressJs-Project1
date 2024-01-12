import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  updatePassword,
  getCurrentUser,
  updateAccountDetails,
  getUserChannelDetails,
  getUserWatchHistory,
} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);
router.route("/login").post(upload.none(), loginUser);

//Secured routes
router.route("/logout").post(verifyToken, logoutUser);
router.route("/refreshAccessToken").post(refreshAccessToken);

//TODO: CHECK THESE ROUTES

router.route("/updatePassword").post(verifyToken, updatePassword);
router.route("/getCurrentUser").post(verifyToken, getCurrentUser);
router.route("/updateAccountDetails").patch(verifyToken, updateAccountDetails);
router
  .route("/updateUserAvatar")
  .patch(verifyToken, upload.single("updateAvatar"), updateUserAvatar);
router
  .route("/updateUserCoverImage")
  .patch(verifyToken, upload.single("updateCoverImage"), updateUserCoverImage);
router
  .route("/getUserChannelDetails/:userName")
  .get(verifyToken, getUserChannelDetails);
router.route("/getUserWatchHistory").post(verifyToken, getUserWatchHistory);


export default router;
