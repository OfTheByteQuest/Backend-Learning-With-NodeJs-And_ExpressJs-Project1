import connectToDb from "./db/index.js";
import dotenv from "dotenv";
import { app } from "./app.js";

dotenv.config({ path: "./env" });

connectToDb()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(
        "lsSuccess: Successfully listening on port " +
          process.env.PORT +
          "through FILE index.js"
      );
    });
  })
  .catch((error) => {
    console.log("dbError: Failed to connect to DB- MONGODB- at FILE index.js");
  });
