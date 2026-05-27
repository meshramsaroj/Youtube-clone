import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config();

connectDB();




/*
approach 1:
const app = express();

const PORT = process.env.PORT || 5000;

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
