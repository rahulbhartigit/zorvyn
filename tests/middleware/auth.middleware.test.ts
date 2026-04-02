import { jest } from "@jest/globals";

process.env.ACCESS_SECRET = "test-secret";

const mockJwt: any = {
  verify: jest.fn(),
};

jest.unstable_mockModule("jsonwebtoken", () => ({
  default: mockJwt,
}));

describe("Auth Middleware", () => {
  let authMiddleware: any;

  beforeAll(async () => {
    const authModule = await import("../../src/middleware/auth.middleware.js");
    authMiddleware = authModule.authMiddleware;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  it("returns 401 if no auth header", async () => {
    const req: any = { headers: {} };
    const res = mockResponse();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "No token provided" });
  });

  it("returns 401 if token format is invalid", async () => {
    const req: any = { headers: { authorization: "Bearer" } };
    const res = mockResponse();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Invalid token format" });
  });

  it("returns 401 if token verification fails", async () => {
    const req: any = { headers: { authorization: "Bearer invalid-token" } };
    const res = mockResponse();
    const next = jest.fn();

    mockJwt.verify.mockImplementation(() => {
      throw new Error("Invalid token");
    });

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("sets req.user and calls next on valid token", async () => {
    const req: any = { headers: { authorization: "Bearer valid-token" } };
    const res = mockResponse();
    const next = jest.fn();

    mockJwt.verify.mockReturnValue({ id: "user-1", role: "ADMIN" });

    authMiddleware(req, res, next);

    expect(mockJwt.verify).toHaveBeenCalledWith("valid-token", "test-secret");
    expect(req.user).toEqual({ id: "user-1", role: "ADMIN" });
    expect(next).toHaveBeenCalled();
  });
});
