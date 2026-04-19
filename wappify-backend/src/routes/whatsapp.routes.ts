import { Router } from "express";
import {
  receiveWhatsAppWebhook,
  verifyWhatsAppWebhook,
} from "../controllers/whatsappWebhook.controller";

const router = Router();

// Meta Cloud API webhook verification (GET)
router.get("/", verifyWhatsAppWebhook);

// Incoming WhatsApp messages (POST)
router.post("/", receiveWhatsAppWebhook);

export default router;
