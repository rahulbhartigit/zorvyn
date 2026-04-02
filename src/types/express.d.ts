import { RoleName } from "@prisma/client";

declare global {
  interface JwtUserPayload {
    id?: string;
    userId?: string;
    role: RoleName;
  }
  namespace Express {
    interface UserPayload {
      id: string;
      role: RoleName;
    }

    interface Request {
      user?: UserPayload;
    }
  }
}
