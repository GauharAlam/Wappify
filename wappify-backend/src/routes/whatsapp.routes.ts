import { Router } from "express";
import {
  receiveWhatsAppWebhook,
  verifyWhatsAppWebhook,
} from "../controllers/whatsappWebhook.controller";

const router = Router();

router.get("/", verifyWhatsAppWebhook);
router.post("/", receiveWhatsAppWebhook);

export default router;
