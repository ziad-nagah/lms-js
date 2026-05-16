import express from "express";
import {
  markAttendance,
  getAttendance,
  getStudentsForAttendance,
} from "../controllers/attendance.ts";
import { protect, authorize } from "../middleware/auth.ts";

const attendanceRouter = express.Router();

attendanceRouter.get("/", protect, getAttendance);
attendanceRouter.post("/mark", protect, authorize(["teacher", "admin"]), markAttendance);
attendanceRouter.get("/students/:classId", protect, authorize(["teacher", "admin"]), getStudentsForAttendance);

export default attendanceRouter;
