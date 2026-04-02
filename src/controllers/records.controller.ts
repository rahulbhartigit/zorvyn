import type { Request, Response } from "express";
import {
  createRecordService,
  deleteRecordService,
  getRecordsService,
  updateRecordService,
} from "../services/records.service.js";

// -------------------------- CREATE -------------------------------

export const createRecord = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
    // Validation is handled by the validate middleware before reaching here

    const record = await createRecordService({
      type: req.body.type,
      amount: req.body.amount,
      currency: req.body.currency,
      category: req.body.category,
      description: req.body.description,
      createdById: req.user.id,
    });
    res.status(201).json({
      success: true,
      message: "Record created successfully",
      data: record,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
//--------------------------- READ -------------------------------
export const getRecords = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      throw new Error("Unauthorized");
    }
    const result = await getRecordsService({
      userId: req.user?.id,
      ...req.query,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    const status = err.message === "Unauthorized" ? 401 : 400;
    res.status(status).json({
      success: false,
      message: err.message,
    });
  }
};
//------------------------------ UPDATE -------------------------------------
export const updateRecord = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id; // from auth middleware

    if (!id || typeof id !== "string") {
      return res.status(400).json({ success: false, message: "Invalid record id" });
    }
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Explicitly destructure to prevent req.body injection attacks
    const { amount, type, category, recordDate, description } = req.body;

    const updatedRecord = await updateRecordService({
      id,
      userId,
      amount,
      type,
      category,
      recordDate,
      description,
    });

    return res.status(200).json({
      success: true,
      data: updatedRecord,
    });
  } catch (error: any) {
    console.error("Update Record Controller Error:", error);

    if (error.message === "RECORD_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
//----------------------------- DELETE --------------------------------------
export const deleteRecordController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!id || typeof id !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid record id",
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    await deleteRecordService({ id, userId });

    return res.status(200).json({
      success: true,
      message: "Record deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete Record Error:", error);

    if (error.message === "RECORD_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
