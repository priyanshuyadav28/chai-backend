import dotenv from "dotenv";
import connectDB from "./db/database.js";

dotenv.config({
  path: "./env",
});

connectDB();

/*
import express from "express";
const app = express()

(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", error => {
            console.log("ERRR: ", error);
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is Listening on port ${process.env.PORT}`);
        })

    } catch (error) {
        console.log("ERROR: ", error)
        throw err
    }
}) ()

*/