import type { NextFunction, Request, Response } from "express";
import type { PermissionAction, PermissionResource } from "@prisma/client";
import { prisma } from "../config/db.js";

/**
 * Checks the Permission table to confirm the authenticated user's role
 * has the given (resource, action) pair before allowing the request through.
 *
 * Must be used after authMiddleware (which sets req.user).
 */
export const authorizePermission =
  (resource: PermissionResource, action: PermissionAction) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    try {
      const permission = await prisma.permission.findFirst({
        where: {
          role: { name: user.role as any },
          resource,
          action,
        },
      });

      if (!permission) {
        return res.status(403).json({
          success: false,
          message: `Forbidden: your role does not have ${action} access on ${resource}`,
        });
      }

      next();
    } catch (err) {
      console.error("Permission check error:", err);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  };
