import express from "express";
import rootRouter from "./routes/index.js";
import { HttpException } from "./exceptions/root.js";
import cors from "cors";

const app = express();

const port = 5000;

app.use(express.json());

app.get('/',(req,res)=>{
    res.send("Running");
})
app.use(
  cors({
    origin: "*",
    headers: ["auth-token", "Content-Type"],
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);
app.use('/api/auth',rootRouter)
app.use('/api',rootRouter)

// keep this global error handler at the end of your code to ensure it runs last
app.use((err, req, res, next) => {
  console.error("Handled error:", err); // Optional logging

  // Handle known HttpExceptions
  if (err instanceof HttpException) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errorCode: err.errorCode,
    });
  }

  // Fallback for any unhandled errors
  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});