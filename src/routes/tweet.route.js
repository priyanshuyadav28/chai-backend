
import { Router } from "express";
import { createTweet, updateTweet } from "../controllers/tweet.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/create-tweet").post(verifyJWT, createTweet)
router.route("/update-tweet").post(verifyJWT, updateTweet)

export default router