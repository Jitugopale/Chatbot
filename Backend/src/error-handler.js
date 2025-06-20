import express from 'express'
import { ErrorCode, HttpException } from './exceptions/root.js'
import {ZodError} from 'zod'
import { BadRequestException } from './exceptions/bad-request.js'
import { InternalException } from './exceptions/Internal-exception.js'

export const errorHandler = (method)=>{
    return async(req,res,next)=>{
        try {
            await method(req,res,next)
        } catch (error) {
            let exception
            if(error instanceof HttpException){
                exception = error;
            }else if(error instanceof ZodError){
                exception = new BadRequestException("Unprocessable Entity",ErrorCode.UNPROCESSABLE_ENTITY)
            }else{
                exception = new InternalException("Something went Wrong",ErrorCode.INTERNAL_EXCEPTION)
            }
            next(exception)

        }
    }
}