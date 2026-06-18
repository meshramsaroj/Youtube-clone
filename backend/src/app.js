import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

//  this is how we can set which are the origin urls we want to allow to access our backend server, we can set multiple urls in origin array and also we can set credentials true if we want to send cookie data to frontend server
// app.use(
//   cors({
//     origin: [
//       "http://localhost:3000",
//       "http://localhost:5173", 
//       "https://myapp.com"
//     ],
//     credentials: true
//   })
// );

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

// route import 
import userRoute from "./routes/user.route.js"

// route declaration
app.use('/api/v1/users', userRoute)

export { app };
