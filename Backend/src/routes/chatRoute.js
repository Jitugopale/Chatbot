import express from "express";
import { chatController, chatHistoryController } from "../controllers/chatController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { errorHandler } from "../error-handler.js";

const chatRouter = express.Router();

chatRouter.post('/userChat',authMiddleware, errorHandler(chatController));
chatRouter.get('/history/:sessionId', authMiddleware, errorHandler(chatHistoryController));

// Get all chat sessions for the user
// chatRouter.get('/sessions', authMiddleware, errorHandler(getUserChatSessionsController));

// Delete a chat session
// chatRouter.delete('/session/:sessionId', authMiddleware, errorHandler(deleteChatSessionController));


export default chatRouter;