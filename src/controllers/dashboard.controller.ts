import type { Request, Response } from "express";
import {
  getCategoryWiseTotalsService,
  getDashboardSummaryService,
  getMonthlyTrendsService,
  getRecentActivityService,
} from "../services/dashboard.service.js";

export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
    const data = await getDashboardSummaryService({ userId });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
export const getCategoryWiseTotals = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
    const data = await getCategoryWiseTotalsService(userId);

    return res.json({ success: true, data });
  } catch (err) {
    console.error("Category Totals Error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
export const getRecentActivity = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
    const data = await getRecentActivityService(userId);

    return res.json({ success: true, data });
  } catch (err) {
    console.error("Recent Activity Error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
export const getMonthlyTrends = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
    const data = await getMonthlyTrendsService(userId);

    return res.json({ success: true, data });
  } catch (err) {
    console.error("Monthly Trends Error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
