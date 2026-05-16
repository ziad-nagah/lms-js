import express from "express";
import {
  createMaterial,
  deleteMaterial,
  getAllMaterials,
} from "../controllers/material.controller";
import { authorize, protect } from "../middleware/auth";

const materialRouter = express.Router();

// Allow reading for all authenticated users (students, teachers, admins, parents)
materialRouter.get("/", protect, getAllMaterials);

// Only allow creating and deleting for teachers and admins
materialRouter.post("/create", protect, authorize(["admin", "teacher"]), createMaterial);
materialRouter.delete("/delete/:id", protect, authorize(["admin", "teacher"]), deleteMaterial);

export default materialRouter;
