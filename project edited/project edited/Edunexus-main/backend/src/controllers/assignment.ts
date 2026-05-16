import { type Request, type Response } from "express";
import Assignment from "../models/assignment.ts";
import AssignmentSubmission from "../models/assignmentSubmission.ts";
import { logActivity } from "../utils/activitieslog.ts";

// @desc    Create a new Assignment
// @route   POST /api/assignments/create
// @access  Private/Teacher/Admin
export const createAssignment = async (req: Request, res: Response) => {
  try {
    const { title, description, dueDate, class: classId, subject, attachmentUrl } = req.body;
    const teacherId = (req as any).user._id;

    const assignment = await Assignment.create({
      title,
      description,
      dueDate,
      class: classId,
      subject,
      teacher: teacherId,
      attachmentUrl,
    });

    await logActivity({
      userId: teacherId,
      action: `Created assignment: ${title}`,
    });

    res.status(201).json(assignment);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get All Assignments (Filtered by role)
// @route   GET /api/assignments
// @access  Private
export const getAssignments = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    let query = {};

    if (user.role === "student") {
      query = { class: user.studentClass };
    } else if (user.role === "teacher") {
      query = { teacher: user._id };
    }

    const assignments = await Assignment.find(query)
      .populate("subject", "name")
      .populate("class", "name")
      .populate("teacher", "name")
      .sort({ createdAt: -1 });

    res.json(assignments);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit Assignment
// @route   POST /api/assignments/:id/submit
// @access  Private/Student
export const submitAssignment = async (req: Request, res: Response) => {
  try {
    const { content, submissionUrl } = req.body;
    const studentId = (req as any).user._id;
    const assignmentId = req.params.id;

    const submission = await AssignmentSubmission.create({
      assignment: assignmentId,
      student: studentId,
      content,
      submissionUrl,
    });

    await logActivity({
      userId: studentId,
      action: `Submitted assignment: ${assignmentId}`,
    });

    res.status(201).json(submission);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "You have already submitted this assignment." });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Submissions for an Assignment
// @route   GET /api/assignments/:id/submissions
// @access  Private/Teacher/Admin
export const getSubmissions = async (req: Request, res: Response) => {
  try {
    const assignmentId = req.params.id;
    const submissions = await AssignmentSubmission.find({ assignment: assignmentId })
      .populate("student", "name email")
      .sort({ submittedAt: -1 });

    res.json(submissions);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Grade Submission
// @route   PATCH /api/assignments/submissions/:id/grade
// @access  Private/Teacher/Admin
export const gradeSubmission = async (req: Request, res: Response) => {
  try {
    const { grade, feedback } = req.body;
    const submissionId = req.params.id;

    const submission = await AssignmentSubmission.findByIdAndUpdate(
      submissionId,
      { grade, feedback, status: "graded" },
      { new: true }
    );

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    await logActivity({
      userId: (req as any).user._id,
      action: `Graded submission: ${submissionId}`,
    });

    res.json(submission);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
