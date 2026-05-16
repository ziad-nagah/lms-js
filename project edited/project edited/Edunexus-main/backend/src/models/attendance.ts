import mongoose, { Schema, Document } from "mongoose";

export interface IAttendance extends Document {
  date: Date;
  class: mongoose.Types.ObjectId;
  subject: mongoose.Types.ObjectId;
  records: {
    student: mongoose.Types.ObjectId;
    status: "present" | "absent" | "late";
  }[];
  takenBy: mongoose.Types.ObjectId;
}

const attendanceSchema = new Schema(
  {
    date: { type: Date, required: true },
    class: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    records: [
      {
        student: { type: Schema.Types.ObjectId, ref: "User", required: true },
        status: { type: String, enum: ["present", "absent", "late"], required: true },
      },
    ],
    takenBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Unique index to prevent duplicate attendance for the same class, subject, and date
attendanceSchema.index({ date: 1, class: 1, subject: 1 }, { unique: true });

export default mongoose.model<IAttendance>("Attendance", attendanceSchema);
