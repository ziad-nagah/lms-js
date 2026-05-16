import mongoose, { Schema, Document } from "mongoose";

export interface IActivationCode extends Document {
  code: string;
  discount: number; // 100 = 100% off
  isUsed: boolean;
  usedAt?: Date;
  usedBy?: mongoose.Types.ObjectId; // student who redeemed
  expiresAt: Date;
  generatedBy: mongoose.Types.ObjectId; // admin user
}

const activationCodeSchema = new Schema<IActivationCode>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discount: { type: Number, default: 100, min: 0, max: 100 },
    isUsed: { type: Boolean, default: false },
    usedAt: { type: Date },
    usedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    expiresAt: { type: Date, required: true },
    generatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Index for fast lookups on code + expiry queries
activationCodeSchema.index({ code: 1 });
activationCodeSchema.index({ expiresAt: 1 });

export default mongoose.model<IActivationCode>("ActivationCode", activationCodeSchema);
