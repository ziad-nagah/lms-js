import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/user";
import { connectDB } from "./config/db";

dotenv.config();

const addTeacher = async () => {
  try {
    await connectDB();

    console.log("Adding teacher tarek@edunexus.com...");

    const existingUser = await User.findOne({ email: "tarek@edunexus.com" });
    if (existingUser) {
      console.log("Teacher already exists!");
      process.exit(0);
    }

    await User.create({
      name: "Tarek",
      email: "tarek@edunexus.com",
      password: "123456789",
      role: "teacher",
      isActive: true,
    });

    console.log("✅ Teacher Tarek added successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error adding teacher:", error);
    process.exit(1);
  }
};

addTeacher();
