import mongoose from "mongoose";
import dotenv from "dotenv";
import AcademicYear from "./models/AcademicYear";
import Class from "./models/class";
import Subject from "./models/subject";
import { connectDB } from "./config/db";

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    console.log("Seeding data...");

    // Create Academic Year
    const year = await AcademicYear.create({
      name: "2025-2026",
      fromYear: new Date("2025-09-01"),
      toYear: new Date("2026-06-30"),
      isCurrent: true,
    });
    console.log("✅ Academic Year created");

    // Create Subjects
    const math = await Subject.create({
      name: "Mathematics",
      code: "MATH101",
      department: "Science",
    });
    const english = await Subject.create({
      name: "English",
      code: "ENG101",
      department: "Languages",
    });
    console.log("✅ Subjects created");

    // Create Classes
    await Class.create({
      name: "Grade 10",
      academicYear: year._id,
      subjects: [math._id, english._id],
      capacity: 40,
    });
    await Class.create({
      name: "Grade 11",
      academicYear: year._id,
      subjects: [math._id, english._id],
      capacity: 40,
    });
    console.log("✅ Classes created");

    console.log("Data seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    process.exit(1);
  }
};

seedData();
