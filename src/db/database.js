import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  // async because DB is in another continent
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}` 
    );
    console.log(`\nMongoDB connected !! DB HOST: 
        ${connectionInstance.connection.host}`);
    // console.log(connectionInstance);
  } catch (error) {
    console.log("MONGODB connection error: ", error);
    process.exit(1);
  }
};

export default connectDB;
