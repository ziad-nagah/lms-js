import mongoose, { Schema, Document } from "mongoose";

export interface IAssignmentSubmission extends Document {
  assignment: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  content?: string;
  submissionUrl?: string;
  grade?: number;
  feedback?: string;
  status: "pending" | "graded";
  submittedAt: Date;
}

const assignmentSubmissionSchema = new Schema(
  {
    assignment: { type: Schema.Types.ObjectId, ref: "Assignment", required: true },
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String },
    submissionUrl: { type: String },
    grade: { type: Number },
    feedback: { type: String },
    status: { type: String, enum: ["pending", "graded"], default: "pending" },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Prevent duplicate submissions by the same student for the same assignment
assignmentSubmissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

export default mongoose.model<IAssignmentSubmission>(
  "AssignmentSubmission",
  assignmentSubmissionSchema
);
