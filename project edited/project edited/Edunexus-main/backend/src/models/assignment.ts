import mongoose, { Schema, Document } from "mongoose";

export interface IAssignment extends Document {
  title: string;
  description: string;
  dueDate: Date;
  class: mongoose.Types.ObjectId;
  subject: mongoose.Types.ObjectId;
  teacher: mongoose.Types.ObjectId;
  attachmentUrl?: string;
}

const assignmentSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    dueDate: { type: Date, required: true },
    class: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    teacher: { type: Schema.Types.ObjectId, ref: "User", required: true },
    attachmentUrl: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IAssignment>("Assignment", assignmentSchema);
