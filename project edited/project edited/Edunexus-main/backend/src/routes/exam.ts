import express from "express";
import {
  triggerExamGeneration,
  getExams,
  submitExam,
  getExamById,
  toggleExamStatus,
  getExamResult,
} from "../controllers/exam.ts";
import { protect, authorize } from "../middleware/auth.ts";

const examRouter = express.Router();

// AI Generation: Teacher/Admin
examRouter.post(
  "/generate",
  protect,
  authorize(["teacher", "admin"]),
  triggerExamGeneration
);

// List exams
examRouter.get(
  "/",
  protect,
  authorize(["teacher", "student", "admin"]),
  getExams
);

// Student submit exam
examRouter.post(
  "/:id/submit",
  protect,
  authorize(["student", "admin"]),
  submitExam
);

// Toggle exam status (teacher/admin)
examRouter.patch(
  "/:id/status",
  protect,
  authorize(["teacher", "admin"]),
  toggleExamStatus
);

// Get exam result (student/teacher/admin) — authorize BEFORE controller
examRouter.get(
  "/:id/result",
  protect,
  authorize(["student", "admin", "teacher"]),
  getExamResult
);

// Get exam by ID (all authenticated roles) — authorize BEFORE controller
examRouter.get(
  "/:id",
  protect,
  authorize(["teacher", "student", "admin"]),
  getExamById
);

export default examRouter;
