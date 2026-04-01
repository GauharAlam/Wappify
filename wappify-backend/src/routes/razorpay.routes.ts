import { Router } from "express";
import { receiveRazorpayWebhook } from "../controllers/razorpayWebhook.controller";

const router = Router();

router.post("/", receiveRazorpayWebhook);

export default router;
