import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./config/connect.js";
import indexRouter from "./routes/user.routes.js";
import session from "express-session";
import ErrorHandler from "./middleware/ErrorHandler.js";
import companyRouter from "./routes/company.routes.js";
import jobRouter from "./routes/jobs.routes.js";
import adminRouter from "./routes/admin.routes.js";
import jobseeker from "./routes/job-seeker.routes.js";
import application from "./routes/application.routes.js";
import contact from "./routes/contact.routes.js";
import path from "path";

dotenv.config();

const app = express();


app.use(cors({
    credentials: true,
    origin: process.env.FRONTEND_URL
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("trust proxy", true);

app.use(session({
    name: 'session',
    secret: process.env.SESSION_SECRET || 'yourSecretKey',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.use(cookieParser());

const PORT = process.env.PORT || 8080;

app.get('/', (async (req, res) => {
    // throw new NotFoundException("this is a bad request")
    res.json({
        message: "server is running"
    });
}));


app.use(ErrorHandler);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));


app.use('/api', indexRouter);
app.use('/api', companyRouter);
app.use('/api', jobRouter);
app.use('/api', adminRouter);
app.use('/api', jobseeker);
app.use('/api', application);
app.use('/api', contact);

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log("🚀Server listening on port🚀", PORT);
    });
}).catch(err => {
    console.error("Failed to connect to database:", err);
    process.exit(1);
});