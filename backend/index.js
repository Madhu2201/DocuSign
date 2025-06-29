import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from 'cookie-parser';
import connectionDB from "./Database/db.config.js";
import userRoutes from "./Routers/UserRouter.js";
import authRoutes from "./Routers/AuthRouter.js";
import path from 'path';
import { fileURLToPath } from 'url';
import { verifyToken } from "./Middlewares/AuthMiddleware.js";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

connectionDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api', userRoutes);
app.use('/api/auth', authRoutes);

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
