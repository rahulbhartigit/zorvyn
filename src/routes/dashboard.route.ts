import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  getCategoryWiseTotals,
  getDashboardSummary,
  getMonthlyTrends,
  getRecentActivity,
} from "../controllers/dashboard.controller.js";
import { authorizePermission } from "../middleware/permission.middleware.js";

const router = express.Router();

router.get(
  "/summary",
  authMiddleware,
  authorizePermission("DASHBOARD", "READ"),
  getDashboardSummary,
);
router.get(
  "/category-wise",
  authMiddleware,
  authorizePermission("DASHBOARD", "READ"),
  getCategoryWiseTotals,
);
router.get(
  "/recent",
  authMiddleware,
  authorizePermission("DASHBOARD", "READ"),
  getRecentActivity,
);
router.get(
  "/monthly-trends",
  authMiddleware,
  authorizePermission("DASHBOARD", "READ"),
  getMonthlyTrends,
);
export default router;
