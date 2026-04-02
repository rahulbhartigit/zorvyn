import express from "express";
import rateLimit from "express-rate-limit";
import {
  register,
  login,
  refresh,
  logout,
} from "../controllers/auth.controller.js";
import { bootstrapRegisterMiddleware } from "../middleware/bootstrap.middleware.js";
import { validate } from "../middleware/validate.js";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
} from "../validators/auth.validator.js";

const router = express.Router();

// Rate limiter: max 10 requests per 15 minutes for sensitive auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});

router.post(
  "/register",
  bootstrapRegisterMiddleware,
  validate(registerSchema),
  register,
);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/refresh", authLimiter, validate(refreshSchema), refresh);
router.post("/logout", logout);

export default router;
