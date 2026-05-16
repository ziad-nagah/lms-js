import { type Request, type Response } from "express";
import User from "../models/user.ts";
import Class from "../models/class.ts";
import Exam from "../models/exam.ts";
import Submission from "../models/submission.ts";
import ActivityLog from "../models/activitieslog.ts";
import Timetable from "../models/timetable.ts";
import Assignment from "../models/assignment.ts";
import Attendance from "../models/attendance.ts";

// Helper to get day name (e.g., "Monday")
const getTodayName = () =>
  new Date().toLocaleDateString("en-US", { weekday: "long" });

// @desc    Get Dashboard Statistics (Role Based)
// @route   GET /api/dashboard/stats
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    let stats = {};
    // Get last 5 activities system-wide (Admin) or personal (Others)
    const activityQuery = user.role === "admin" ? {} : { user: user._id };
    const recentActivities = await ActivityLog.find(activityQuery)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "name");

    const formattedActivity = recentActivities.map(
      (log) =>
        `${(log.user as any).name}: ${log.action} (${new Date(
          log.createdAt as any
        ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`
    );

    if (user.role === "admin") {
      const totalStudents = await User.countDocuments({ role: "student" });
      const totalTeachers = await User.countDocuments({ role: "teacher" });
      const activeExams = await Exam.countDocuments({ isActive: true });

      // Mocking Attendance (You'd need an Attendance model for real data)
      const avgAttendance = "94.5%";

      stats = {
        totalStudents,
        totalTeachers,
        activeExams,
        avgAttendance,
        recentActivity: formattedActivity,
      };
    } else if (user.role === "teacher") {
      // 1. Count classes assigned to teacher
      const myClassesCount = await Class.countDocuments({
        classTeacher: user._id,
      });

      // 2. Pending Grading: Submissions for my exams that have no score yet
      // First find exams created by this teacher
      const myExams = await Exam.find({ teacher: user._id }).select("_id");
      const myExamIds = myExams.map((exam) => exam._id);
      const pendingGrading = await Submission.countDocuments({
        exam: { $in: myExamIds },
        score: 0, // Assuming 0 or null means ungraded
      });

      // 3. Next Class (Simplified Logic)
      // Find timetables where teacher is teaching today
      const today = getTodayName();
      // Complex aggregation could go here, but let's do a simple find for now
      // This is a placeholder for the logic to find the specific period based on current time
      const nextClass = "Mathematics - Grade 10";
      const nextClassTime = "10:00 AM";

      stats = {
        myClassesCount,
        pendingGrading,
        nextClass,
        nextClassTime,
        recentActivity: formattedActivity,
      };
    } else if (user.role === "student") {
      // 1. Next Exam
      const nextExam = await Exam.findOne({
        class: user.studentClass,
        dueDate: { $gte: new Date() },
        isActive: true,
      }).sort({ dueDate: 1 });

      // 2. Pending Assignments (Count assignments in my class where I haven't submitted)
      // This is a bit complex, let's just count total active assignments for now
      const pendingAssignments = await Assignment.countDocuments({
        class: user.studentClass,
        dueDate: { $gte: new Date() },
      });

      // 3. Real Attendance Calculation
      const attendanceRecords = await Attendance.find({
        class: user.studentClass,
      });
      
      let presentCount = 0;
      let totalCount = 0;
      
      attendanceRecords.forEach(att => {
        const record = att.records.find(r => r.student.toString() === user._id.toString());
        if (record) {
          totalCount++;
          if (record.status === "present" || record.status === "late") {
            presentCount++;
          }
        }
      });

      const myAttendance = totalCount > 0 ? `${Math.round((presentCount / totalCount) * 100)}%` : "N/A";

      stats = {
        myAttendance,
        pendingAssignments,
        nextExam: nextExam?.title || "No upcoming exams",
        nextExamDate: nextExam
          ? new Date(nextExam.dueDate).toLocaleDateString()
          : "",
        recentActivity: formattedActivity,
      };
    }
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};
