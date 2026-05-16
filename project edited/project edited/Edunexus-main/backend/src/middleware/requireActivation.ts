import { type Request, type Response, type NextFunction } from "express";
import type { AuthRequest } from "./auth";

/**
 * requireActivation middleware
 * Blocks student access to LMS content unless their isLmsActivated flag is true.
 * Admins and teachers always pass through.
 */
export const requireActivation = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authorized" });
  }

  // Only applies to students
  if (req.user.role !== "student") return next();

  if (!req.user.isLmsActivated) {
    return res.status(403).json({
      message:
        "Access denied. Please activate your account with your payment code.",
      code: "ACTIVATION_REQUIRED",
    });
  }

  next();
};
