import { RoleName } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/db.js";

if (!process.env.ACCESS_SECRET) {
  throw new Error("ACCESS_SECRET environment variable is not set");
}
if (!process.env.REFRESH_SECRET) {
  throw new Error("REFRESH_SECRET environment variable is not set");
}

const ACCESS_SECRET = process.env.ACCESS_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

// ─── Register ─────────────────────────────────────────────

export const registerUser = async ({
  email,
  password,
  firstName,
  lastName,
  role,
}: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: RoleName;
}) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error("User already exists");
  }
  const userCount = await prisma.user.count();
  const roleEnum = RoleName[role as keyof typeof RoleName];

  if (!roleEnum) {
    throw new Error(`Invalid role: ${role}`);
  }
  if (userCount === 0 && role !== RoleName.ADMIN) {
    throw new Error("First registered user must be an ADMIN");
  }

  const roleRecord = await prisma.role.findUnique({
    where: { name: role },
  });
  if (!roleRecord) {
    throw new Error(`Invalid role: ${role}`);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      roleId: roleRecord.id,
    },
    include: {
      role: true,
    },
  });

  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
};

// ─── Login ────────────────────────────────────────────────

export const loginUser = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      role: {
        include: {
          permissions: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (user.status !== "ACTIVE") {
    throw new Error("Account is inactive or suspended");
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  const accessToken = jwt.sign(
    { id: user.id, role: user.role.name },
    ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY },
  );

  const refreshToken = jwt.sign(
    { userId: user.id, type: "refresh" },
    REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY },
  );

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const { passwordHash: _, ...safeUser } = user;
  return { user: safeUser, accessToken, refreshToken };
};

// ─── Refresh Token ────────────────────────────────────────

export const refreshAccessToken = async (token: string) => {
  let payload: any;
  try {
    payload = jwt.verify(token, REFRESH_SECRET);
  } catch {
    throw new Error("Invalid or expired refresh token");
  }

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token },
  });

  if (
    !storedToken ||
    storedToken.revoked ||
    storedToken.expiresAt < new Date()
  ) {
    throw new Error("Invalid or expired refresh token");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { role: true },
  });

  if (!user || user.status !== "ACTIVE") {
    throw new Error("User not found or inactive");
  }

  const accessToken = jwt.sign(
    { id: user.id, role: user.role.name },
    ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY },
  );

  return { accessToken };
};

// ─── Logout ───────────────────────────────────────────────

export const logoutUser = async (token: string) => {
  await prisma.refreshToken.updateMany({
    where: { token, revoked: false },
    data: { revoked: true },
  });
};
