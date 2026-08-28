import { Router } from "express";
import { sendMessage } from "../controllers/messages.controller";

const router = Router();
router.post("/", (req, res, next) => void sendMessage(req, res).catch(next));
export default router;
