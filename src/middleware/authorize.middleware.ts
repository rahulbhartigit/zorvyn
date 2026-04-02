import type { NextFunction, Request, Response } from "express";

import { roleHierarchy } from "../utils/roles.js";
import type { Role } from "../utils/roles.js";

export const authorizeMinRole =
  (requiredRole: Role) => (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (roleHierarchy[user.role] < roleHierarchy[requiredRole]) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    next();
  };
