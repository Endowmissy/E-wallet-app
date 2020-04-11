import dotenv from "dotenv";

dotenv.config();

export const {
    PORT,
    SESSION_SECRET,
    MONGODB_URL,
    PAYSTACK_SECRET_KEY
} = process.env;