import express from "express";
import { getUserProfileController, LoginController, RegisterController } from "../controllers/userController.js";
import { errorHandler } from "../error-handler.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const userRouter = express.Router();

userRouter.post('/register', errorHandler(RegisterController));
userRouter.post('/login', errorHandler(LoginController));
userRouter.get('/getuserprofile',authMiddleware, errorHandler(getUserProfileController));


export default userRouter;