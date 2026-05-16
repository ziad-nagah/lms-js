import dotenv from "dotenv";
import { connectDB } from "./config/db";
import User from "./models/user";

dotenv.config();

const accounts = [
  {
    name: "Ahmed Student",
    email: "ahmed.student@edunexus.com",
    password: "123456789",
    role: "student" as const,
  },
  {
    name: "Sara Teacher",
    email: "sara.teacher@edunexus.com",
    password: "123456789",
    role: "teacher" as const,
  },
];

const createAccounts = async () => {
  try {
    await connectDB();

    for (const account of accounts) {
      const existing = await User.findOne({ email: account.email });
      if (existing) {
        console.log(`⚠️  Account already exists: ${account.email}`);
        continue;
      }

      const user = await User.create({
        ...account,
        isActive: true,
      });

      console.log(`✅ ${account.role.charAt(0).toUpperCase() + account.role.slice(1)} account created!`);
      console.log(`   Email   : ${user.email}`);
      console.log(`   Password: ${account.password}`);
      console.log(`   Role    : ${user.role}`);
      console.log("");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating accounts:", error);
    process.exit(1);
  }
};

createAccounts();
