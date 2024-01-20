import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  updatePassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
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
router.route("/updatePassword").patch(verifyToken, updatePassword);
router.route("/getCurrentUser").get(verifyToken, getCurrentUser);
router
  .route("/updateAccountDetails")
  .patch(upload.none(), verifyToken, updateAccountDetails);
router
  .route("/updateUserAvatar")
  .patch(verifyToken, upload.single("avatar"), updateUserAvatar);
router
  .route("/updateUserCoverImage")
  .patch(verifyToken, upload.single("coverImage"), updateUserCoverImage);
router
  .route("/getUserChannelDetails/:userName")
  .get(verifyToken, getUserChannelDetails);

  //TODO: Check this route
router.route("/getUserWatchHistory").post(verifyToken, getUserWatchHistory);


export default router;
