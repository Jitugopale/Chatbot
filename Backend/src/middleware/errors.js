

export const errorMiddleware = (error,req,res,next)=>{
      const status = error.statusCode || 500;

    res.status(status).json({
        message : error.message,
        errorCode : error.errorCode,
        errors : error.errors
    })
}