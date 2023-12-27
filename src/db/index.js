import mongoose from "mongoose";
import express from "express";
import { DB_NAME } from "../constants.js";

export default async function connectToDb() {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );

    console.log(
      `dbSuccess: Connected to database -MONGODB- successfully through connectToDb FUNCTION at port ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.error(
      "dbError: Failed to connect to database- MONGODB- at connectToDb FUNCTION",
      error
    );
    process.exit(1);
  }
}
