import { Router } from "express";
import {
  getSubscribedChannels,
  getUserChannelSubscribers,
  toggleSubscription,
} from "../controllers/subscription.controllers.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyToken); // Apply verifyJWT middleware to all routes in this file

router.route("/c/:channelId").post(toggleSubscription);

router.route("/c/:subscriberId").get(getSubscribedChannels);

router.route("/u/:channelId").get(getUserChannelSubscribers);

export default router;
