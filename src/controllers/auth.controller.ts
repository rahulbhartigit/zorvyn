import type { Request, Response } from "express";
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
} from "../services/auth.service.js";

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    const user = await registerUser({
      email,
      password,
      firstName,
      lastName,
      role,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: user,
    });
  } catch (error: any) {
    if (error.message === "User already exists") {
      return res.status(409).json({ success: false, message: error.message });
    }
    if (
      error.message?.startsWith("Invalid role") ||
      error.message === "First registered user must be an ADMIN"
    ) {
      return res.status(422).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: "Registration failed" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const result = await loginUser({ email, password });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error: any) {
    console.error("LOGIN ERROR:", error);
    const status =
      error.message === "Account is inactive or suspended" ? 403 : 401;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ success: false, message: "Refresh token is required" });
      return;
    }

    const result = await refreshAccessToken(refreshToken);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(401).json({ success: false, message: error.message });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ success: false, message: "Refresh token is required" });
      return;
    }

    await logoutUser(refreshToken);

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
