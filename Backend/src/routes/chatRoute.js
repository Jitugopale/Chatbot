import express from "express";
import { chatController } from "../controllers/chatController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { errorHandler } from "../error-handler.js";

const chatRouter = express.Router();

chatRouter.post('/userChat',authMiddleware, errorHandler(chatController));

export default chatRouter;