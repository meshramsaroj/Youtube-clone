import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

//Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
); // to access cross origin urls

app.use(express.json({ limit: "16kb" })); // to read json data upto 16kb limit
app.use(express.urlencoded({ limit: "16kb", extended: true })); // to read data from browser url
app.use(express.static("public")); // to store data in static folder
app.use(cookieParser()); // to perform browser cookie data

export { app };
