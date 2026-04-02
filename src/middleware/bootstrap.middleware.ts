import type { NextFunction, Request, Response } from "express";
import { prisma } from "../config/db.js";
import { authMiddleware } from "./auth.middleware.js";
import { authorizePermission } from "./permission.middleware.js";

const requireUserCreatePermission = authorizePermission("USERS", "CREATE");

export const bootstrapRegisterMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userCount = await prisma.user.count();

    if (userCount === 0) {
      return next();
    }

    authMiddleware(req, res, (authError?: unknown) => {
      if (authError) {
        return next(authError);
      }

      return requireUserCreatePermission(req, res, next);
    });
  } catch (error) {
    console.error("Bootstrap register middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
