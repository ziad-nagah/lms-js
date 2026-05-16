import { type Request, type Response } from "express";
import Attendance from "../models/attendance.ts";
import Class from "../models/class.ts";
import { logActivity } from "../utils/activitieslog.ts";

// @desc    Mark Attendance
// @route   POST /api/attendance/mark
// @access  Private/Teacher/Admin
export const markAttendance = async (req: Request, res: Response) => {
  try {
    const { date, class: classId, subject, records } = req.body;
    const teacherId = (req as any).user._id;

    const attendance = await Attendance.findOneAndUpdate(
      { date: new Date(date), class: classId, subject },
      { records, takenBy: teacherId },
      { upsert: true, new: true, runValidators: true }
    );

    await logActivity({
      userId: teacherId,
      action: `Marked attendance for class: ${classId} on ${date}`,
    });

    res.status(201).json(attendance);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Attendance for a Class/Subject/Date
// @route   GET /api/attendance
// @access  Private
export const getAttendance = async (req: Request, res: Response) => {
  try {
    const { date, classId, subjectId } = req.query;
    
    const query: any = {};
    if (date) query.date = new Date(date as string);
    if (classId) query.class = classId;
    if (subjectId) query.subject = subjectId;

    const attendance = await Attendance.findOne(query)
      .populate("records.student", "name email")
      .populate("takenBy", "name");

    res.json(attendance);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Students for a Class (To mark attendance)
// @route   GET /api/attendance/students/:classId
// @access  Private/Teacher/Admin
export const getStudentsForAttendance = async (req: Request, res: Response) => {
  try {
    const classId = req.params.classId;
    const classDoc = await Class.findById(classId).populate("students", "name email");

    if (!classDoc) {
      return res.status(404).json({ message: "Class not found" });
    }

    res.json(classDoc.students);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
