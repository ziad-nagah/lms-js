import express from "express";
import {
  generateCode,
  listCodes,
  activateCode,
  revokeCode,
  getMyActivationStatus,
} from "../controllers/finance.ts";
import { protect, authorize } from "../middleware/auth.ts";

const financeRouter = express.Router();

// Admin routes
financeRouter.post("/generate", protect, authorize(["admin"]), generateCode);
financeRouter.get("/codes", protect, authorize(["admin"]), listCodes);
financeRouter.delete("/codes/:id", protect, authorize(["admin"]), revokeCode);

// Student routes
financeRouter.post("/activate", protect, authorize(["student"]), activateCode);
financeRouter.get("/my-status", protect, getMyActivationStatus);

export default financeRouter;
