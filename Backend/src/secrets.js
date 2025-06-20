import dotenv from 'dotenv';

dotenv.config({path:'.env'}) //initialize
export const JWT_SECRET = process.env.JWT_SECRET;
export const PORT = process.env.PORT;;
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;