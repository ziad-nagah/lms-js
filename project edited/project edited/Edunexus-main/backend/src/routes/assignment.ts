import express from "express";
import {
  createAssignment,
  getAssignments,
  submitAssignment,
  getSubmissions,
  gradeSubmission,
} from "../controllers/assignment.ts";
import { protect, authorize } from "../middleware/auth.ts";

const assignmentRouter = express.Router();

assignmentRouter.get("/", protect, getAssignments);
assignmentRouter.post("/create", protect, authorize(["teacher", "admin"]), createAssignment);
assignmentRouter.post("/:id/submit", protect, authorize(["student"]), submitAssignment);
assignmentRouter.get("/:id/submissions", protect, authorize(["teacher", "admin"]), getSubmissions);
assignmentRouter.patch("/submissions/:id/grade", protect, authorize(["teacher", "admin"]), gradeSubmission);

export default assignmentRouter;
