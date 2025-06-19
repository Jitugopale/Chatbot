import express from "express";
import userRouter from "./userRoute.js";
import { PrismaClient } from "@prisma/client";

const rootRouter = express.Router();

export const prismaClient = new PrismaClient({
    log:['query']
})

rootRouter.use("/user", userRouter);

export default rootRouter;