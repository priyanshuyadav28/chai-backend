import { Router } from "express";
import { tweetUser } from "../controllers/tweet.controller.js";


const router = Router()

import {verifyJWT} from "../middlewares/auth.middleware.js"


router.route("/tweet").post(verifyJWT, tweetUser);


export default router