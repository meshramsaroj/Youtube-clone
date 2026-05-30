import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.log("Error: ", error);
      throw error;
    });

    app.listen(PORT, () => {
      console.log("Server is listening on: ", PORT);
    });
  })
  .catch((error) => {
    console.log("MongoDB connection failed !!!", error);
  });

/*
approach 1:
const app = express();


;(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

    app.on("error", (error) => {
      console.log("Error: ", error);
      throw error;
    });

    app.listen(PORT, () => {
      console.log(`App is listening on port: ${PORT}`);
    });
  } catch (error) {
    console.log("Error: ", error);
    throw error;
  }
})();

*/
