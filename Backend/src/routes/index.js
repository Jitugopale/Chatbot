import express from "express";
import userRouter from "./userRoute.js";
import { PrismaClient } from "@prisma/client";
import chatRouter from "./chatRoute.js";

const rootRouter = express.Router();

export const prismaClient = new PrismaClient({
    log:['query']
})

rootRouter.use("/user", userRouter);
rootRouter.use("/chat", chatRouter);

export default rootRouter;




