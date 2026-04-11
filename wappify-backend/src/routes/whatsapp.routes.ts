import { Router } from "express";
import { receiveWhatsAppWebhook } from "../controllers/whatsappWebhook.controller";

const router = Router();

router.post("/", receiveWhatsAppWebhook);

export default router;
