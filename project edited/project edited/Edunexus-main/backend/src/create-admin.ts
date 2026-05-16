import dotenv from "dotenv";
import { connectDB } from "./config/db";
import User from "./models/user";

dotenv.config();

const createAdmin = async () => {
  try {
    await connectDB();

    const existingAdmin = await User.findOne({ email: "ziadad@edunexus.com" });
    if (existingAdmin) {
      console.log("⚠️  Admin account already exists for ziadad@edunexus.com");
      process.exit(0);
    }

    const admin = await User.create({
      name: "Ziad Admin",
      email: "ziadad@edunexus.com",
      password: "123456789",
      role: "admin",
      isActive: true,
    });

    console.log("✅ Admin account created successfully!");
    console.log(`   Email : ${admin.email}`);
    console.log(`   Role  : ${admin.role}`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin:", error);
    process.exit(1);
  }
};

createAdmin();
