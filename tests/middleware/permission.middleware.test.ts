import { jest } from "@jest/globals";
import { PermissionResource, PermissionAction } from "@prisma/client";

const mockPrisma: any = {
  permission: {
    findFirst: jest.fn(),
  },
};

jest.unstable_mockModule("../../src/config/db.js", () => ({
  prisma: mockPrisma,
}));

describe("Authorize Middleware", () => {
  let authorizePermission: any;

  beforeAll(async () => {
    const authModule = await import("../../src/middleware/permission.middleware.js");
    authorizePermission = authModule.authorizePermission;
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

  it("returns 401 if user is not set on req", async () => {
    const req: any = {};
    const res = mockResponse();
    const next = jest.fn();

    const middleware = authorizePermission(PermissionResource.DASHBOARD, PermissionAction.READ);
    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: "Unauthorized" });
  });

  it("returns 403 if permission is not found", async () => {
    const req: any = { user: { role: "USER" } };
    const res = mockResponse();
    const next = jest.fn();

    mockPrisma.permission.findFirst.mockResolvedValueOnce(null);

    const middleware = authorizePermission(PermissionResource.RECORDS, PermissionAction.CREATE);
    await middleware(req, res, next);

    expect(mockPrisma.permission.findFirst).toHaveBeenCalledWith({
      where: {
        role: { name: "USER" },
        resource: PermissionResource.RECORDS,
        action: PermissionAction.CREATE,
      },
    });

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("calls next if permission is found", async () => {
    const req: any = { user: { role: "ADMIN" } };
    const res = mockResponse();
    const next = jest.fn();

    mockPrisma.permission.findFirst.mockResolvedValueOnce({ id: 1 });

    const middleware = authorizePermission(PermissionResource.DASHBOARD, PermissionAction.READ);
    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("returns 500 on db error", async () => {
    const req: any = { user: { role: "ADMIN" } };
    const res = mockResponse();
    const next = jest.fn();

    // Silence the expected console.error for this test
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    mockPrisma.permission.findFirst.mockRejectedValueOnce(new Error("DB Error"));

    const middleware = authorizePermission(PermissionResource.DASHBOARD, PermissionAction.READ);
    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    
    consoleSpy.mockRestore();
  });
});
