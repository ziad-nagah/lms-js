import { type Request, type Response } from "express";
import Material from "../models/material";
import { logActivity } from "../utils/activitieslog";

// @desc    Create a new Material
// @route   POST /api/materials/create
// @access  Private (Teacher/Admin)
export const createMaterial = async (req: Request, res: Response) => {
  try {
    const { title, description, url, type, classId, subjectId } = req.body;
    const userId = (req as any).user.id || (req as any).user._id;

    const newMaterial = await Material.create({
      title,
      description,
      url,
      type: type || "Link",
      classId,
      subjectId,
      uploadedBy: userId,
    });

    await logActivity({
      userId,
      action: `Added new material: ${newMaterial.title}`,
    });

    res.status(201).json(newMaterial);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

// @desc    Get All Materials (scoped by role)
// @route   GET /api/materials
// @access  Private
export const getAllMaterials = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const classId = req.query.classId as string;
    const subjectId = req.query.subjectId as string;
    const user = (req as any).user;

    const query: any = {};
    if (search) query.title = { $regex: search, $options: "i" };
    if (classId) query.classId = classId;
    if (subjectId) query.subjectId = subjectId;

    // Role-based scoping
    if (user?.role === "teacher") {
      // Teachers only see materials they uploaded
      query.uploadedBy = user._id;
    } else if (user?.role === "student" && user?.studentClass) {
      // Students only see materials for their class
      query.classId = user.studentClass;
    }

    const [total, materials] = await Promise.all([
      Material.countDocuments(query),
      Material.find(query)
        .populate("classId", "name")
        .populate("subjectId", "name")
        .populate("uploadedBy", "name email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    res.json({
      materials,
      pagination: { total, page, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

// @desc    Delete Material
// @route   DELETE /api/materials/delete/:id
// @access  Private (Teacher/Admin)
export const deleteMaterial = async (req: Request, res: Response) => {
  try {
    const deletedMaterial = await Material.findByIdAndDelete(req.params.id);
    const userId = (req as any).user.id || (req as any).user._id;

    if (!deletedMaterial) {
      return res.status(404).json({ message: "Material not found" });
    }

    await logActivity({
      userId,
      action: `Deleted material: ${deletedMaterial.title}`,
    });

    res.json({ message: "Material removed successfully" });
  } catch (error: any) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
