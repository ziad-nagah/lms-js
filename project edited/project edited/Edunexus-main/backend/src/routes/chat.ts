import express from "express";
import { chatWithAI } from "../controllers/chat.ts";
import { protect } from "../middleware/auth.ts";

const chatRouter = express.Router();

// Chat with AI Assistant — All authenticated users
chatRouter.post("/", protect, chatWithAI);

export default chatRouter;
