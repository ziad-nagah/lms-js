import { type Request, type Response } from "express";
import ActivationCode from "../models/activationCode.ts";
import User from "../models/user.ts";
import { logActivity } from "../utils/activitieslog.ts";
import crypto from "crypto";

/** Generate a random coupon code like EDU-A3F9-B72X */
const generateUniqueCode = () => {
  const part = () => crypto.randomBytes(2).toString("hex").toUpperCase();
  return `EDU-${part()}-${part()}`;
};

// @desc    Generate a new activation/coupon code
// @route   POST /api/finance/generate
// @access  Admin only
export const generateCode = async (req: Request, res: Response) => {
  try {
    const { expiresAt, quantity = 1 } = req.body;
    const adminId = (req as any).user._id;

    if (!expiresAt) {
      return res.status(400).json({ message: "Expiration date is required" });
    }

    const expiry = new Date(expiresAt);
    if (isNaN(expiry.getTime()) || expiry <= new Date()) {
      return res.status(400).json({ message: "Expiration date must be in the future" });
    }

    const qty = Math.min(Math.max(parseInt(quantity), 1), 50); // max 50 at once
    const codes = [];

    for (let i = 0; i < qty; i++) {
      let code: string;
      let exists = true;
      // Ensure uniqueness
      do {
        code = generateUniqueCode();
        exists = !!(await ActivationCode.findOne({ code }));
      } while (exists);

      codes.push({
        code,
        discount: 100,
        expiresAt: expiry,
        generatedBy: adminId,
      });
    }

    const created = await ActivationCode.insertMany(codes);

    await logActivity({
      userId: adminId,
      action: `Generated ${qty} activation code(s) expiring on ${expiry.toLocaleDateString()}`,
    });

    res.status(201).json({ message: `${qty} code(s) generated`, codes: created });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

// @desc    List all activation codes (with filters)
// @route   GET /api/finance/codes
// @access  Admin only
export const listCodes = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string; // "used" | "active" | "expired"

    const query: any = {};
    const now = new Date();

    if (status === "used") {
      query.isUsed = true;
    } else if (status === "active") {
      query.isUsed = false;
      query.expiresAt = { $gt: now };
    } else if (status === "expired") {
      query.isUsed = false;
      query.expiresAt = { $lte: now };
    }

    const [total, codes] = await Promise.all([
      ActivationCode.countDocuments(query),
      ActivationCode.find(query)
        .populate("generatedBy", "name email")
        .populate("usedBy", "name email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    // Enrich each code with a computed status
    const enriched = codes.map((c) => ({
      ...c.toObject(),
      status: c.isUsed ? "used" : c.expiresAt <= now ? "expired" : "active",
    }));

    res.json({
      codes: enriched,
      pagination: { total, page, pages: Math.ceil(total / limit) },
      stats: {
        total: await ActivationCode.countDocuments(),
        used: await ActivationCode.countDocuments({ isUsed: true }),
        active: await ActivationCode.countDocuments({ isUsed: false, expiresAt: { $gt: now } }),
        expired: await ActivationCode.countDocuments({ isUsed: false, expiresAt: { $lte: now } }),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

// @desc    Activate a code (student redeems their coupon)
// @route   POST /api/finance/activate
// @access  Student (authenticated)
export const activateCode = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    const studentId = (req as any).user._id;

    if (!code) return res.status(400).json({ message: "Code is required" });

    const record = await ActivationCode.findOne({ code: code.trim().toUpperCase() });

    if (!record) {
      return res.status(404).json({ message: "Invalid code. Please check and try again." });
    }
    if (record.isUsed) {
      return res.status(400).json({ message: "This code has already been used." });
    }
    if (record.expiresAt <= new Date()) {
      return res.status(400).json({ message: "This code has expired." });
    }

    // Mark code as used
    record.isUsed = true;
    record.usedAt = new Date();
    record.usedBy = studentId;
    await record.save();

    // Activate the student's LMS access
    await User.findByIdAndUpdate(studentId, { isLmsActivated: true });

    await logActivity({
      userId: studentId,
      action: `Activated LMS access using code: ${code}`,
    });

    res.json({ message: "Account activated successfully! You now have full LMS access.", activated: true });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

// @desc    Revoke / delete a code (admin)
// @route   DELETE /api/finance/codes/:id
// @access  Admin only
export const revokeCode = async (req: Request, res: Response) => {
  try {
    const code = await ActivationCode.findById(req.params.id);
    if (!code) return res.status(404).json({ message: "Code not found" });
    if (code.isUsed) return res.status(400).json({ message: "Cannot revoke a code that has already been used." });

    await code.deleteOne();
    await logActivity({
      userId: (req as any).user._id,
      action: `Revoked activation code: ${code.code}`,
    });

    res.json({ message: "Code revoked successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

// @desc    Get the current user's activation status
// @route   GET /api/finance/my-status
// @access  Student (authenticated)
export const getMyActivationStatus = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    res.json({ isLmsActivated: user.isLmsActivated ?? false, role: user.role });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};
