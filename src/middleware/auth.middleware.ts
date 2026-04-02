import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    if (!token)
      return res.status(401).json({ success: false, message: "Invalid token format" });
    const decoded = jwt.verify(
      token,
      process.env.ACCESS_SECRET!,
    ) as unknown as JwtUserPayload;

    // Accept both the current `id` claim and older refreshed tokens that used `userId`.
    const userId = decoded.id ?? decoded.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    req.user = { id: userId, role: decoded.role };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
};
