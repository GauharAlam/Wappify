import { Request, Response } from "express";
import { sendTextMessage } from "../services/whatsapp.service";

export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  const expectedToken = process.env.BACKEND_INTERNAL_API_TOKEN;
  if (!expectedToken || req.header("x-wappify-internal-token") !== expectedToken) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { orgId, to, message } = req.body as { orgId?: string; to?: string; message?: string };
  if (!orgId || !to || !message || typeof message !== "string") {
    res.status(400).json({ error: "orgId, to, and message are required" });
    return;
  }

  await sendTextMessage(orgId, to, message);
  res.status(202).json({ success: true });
};
