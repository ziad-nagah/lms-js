import mongoose, { Schema, Document } from "mongoose";

export interface IMaterial extends Document {
  title: string;
  description?: string;
  url: string;
  type: "PDF" | "Video" | "Link" | "Document";
  classId?: mongoose.Types.ObjectId;
  subjectId?: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId;
}

const materialSchema = new Schema<IMaterial>(
  {
    title: { type: String, required: true },
    description: { type: String },
    url: { type: String, required: true },
    type: { 
      type: String, 
      enum: ["PDF", "Video", "Link", "Document"],
      default: "Link"
    },
    classId: { type: Schema.Types.ObjectId, ref: "Class" },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject" },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IMaterial>("Material", materialSchema);
