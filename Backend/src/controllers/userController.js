import { BadRequestException } from "../exceptions/bad-request.js";
import { ErrorCode } from "../exceptions/root.js";
import { prismaClient } from "../routes/index.js";
import { loginSchema, userSchema } from "../schema/userSchema.js"
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../secrets.js";


export const RegisterController = async(req,res,next) =>{
   const userData = userSchema.parse(req.body);

   let user = await prismaClient.user.findFirst({
     where: {
       email: userData.email,
       mobileNo: userData.mobileNo,
     }
   });

   if(user){
    return next(new BadRequestException("User already exists",ErrorCode.USER_ALREADY_EXISTS));
   }

   const userRegister = await prismaClient.user.create({
    data:{
     name: userData.name,
     mobileNo: userData.mobileNo,
     email: userData.email,
     password: userData.password
    }
   });

   return res.json({ success:true,message: "User Registered successfully", userRegister });
}

export const LoginController = async(req,res,next) =>{
   const loginData = loginSchema.parse(req.body);

   let user = await prismaClient.user.findFirst({
     where: {
       email: loginData.email,
     }
   });

   if(!user){
    return next(new BadRequestException("User not found",ErrorCode.USER_NOT_FOUND));
   }

   if(user.password !== loginData.password){
    return next(new BadRequestException("Password not matched",ErrorCode.INCORRECT_PASSWORD));
   }

    // ✅ Create new ChatSession for this login
   const newSession = await prismaClient.chatSession.create({
     data: {
       userId: user.id
     }
   });

   const token = jwt.sign({id:user.id},JWT_SECRET,{expiresIn:"1h"});
      

   return res.json({
     success: true,
     message: "User LoggedIn successfully",
     token,
     user,
    sessionId: newSession.sessionId,
   });
}

export const getUserProfileController = async(req,res,next) =>{
   const user = await prismaClient.user.findFirst({
     where: {
       id: req.user.id,
     }

   });
   return res.json({ success:true, message:"User Profile fetched successfully", user })
}