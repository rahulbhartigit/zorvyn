import { jest } from "@jest/globals";
import { RoleName } from "@prisma/client";
process.env.ACCESS_SECRET = "test-access-secret";
process.env.REFRESH_SECRET = "test-refresh-secret";
jest.unstable_mockModule("bcryptjs", () => ({
    default: {
        hash: jest.fn().mockResolvedValue("hashed-password"),
        compare: jest.fn().mockResolvedValue(true),
    },
}));
jest.unstable_mockModule("jsonwebtoken", () => ({
    default: {
        sign: jest.fn().mockReturnValue("mock-token"),
        verify: jest.fn().mockReturnValue({ userId: "user-1", role: "ADMIN" }),
    },
}));
const mockPrisma = {
    user: {
        findUnique: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
    },
    role: {
        findUnique: jest.fn(),
    },
    refreshToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        updateMany: jest.fn(),
    },
};
jest.unstable_mockModule("../../src/config/db.js", () => ({
    prisma: mockPrisma,
}));
describe("Auth Service", () => {
    let registerUser;
    let loginUser;
    let logoutUser;
    beforeAll(async () => {
        const authService = await import("../../src/services/auth.service.js");
        registerUser = authService.registerUser;
        loginUser = authService.loginUser;
        logoutUser = authService.logoutUser;
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe("registerUser", () => {
        it("throws if user already exists", async () => {
            mockPrisma.user.findUnique.mockResolvedValueOnce({ id: "user-1" });
            await expect(registerUser({
                email: "test@test.com",
                password: "password",
                firstName: "John",
                lastName: "Doe",
                role: RoleName.VIEWER,
            })).rejects.toThrow("User already exists");
        });
        it("throws if first user is not ADMIN", async () => {
            mockPrisma.user.findUnique.mockResolvedValueOnce(null);
            mockPrisma.user.count.mockResolvedValueOnce(0);
            await expect(registerUser({
                email: "test@test.com",
                password: "password",
                firstName: "John",
                lastName: "Doe",
                role: RoleName.VIEWER,
            })).rejects.toThrow("First registered user must be an ADMIN");
        });
        it("registers user successfully", async () => {
            mockPrisma.user.findUnique.mockResolvedValueOnce(null);
            mockPrisma.user.count.mockResolvedValueOnce(1);
            mockPrisma.role.findUnique.mockResolvedValueOnce({ id: "role-1", name: RoleName.VIEWER });
            mockPrisma.user.create.mockResolvedValueOnce({
                id: "new-user-id",
                email: "test@test.com",
                passwordHash: "hashed-password",
                role: { name: RoleName.VIEWER }
            });
            const user = await registerUser({
                email: "test@test.com",
                password: "password",
                firstName: "John",
                lastName: "Doe",
                role: RoleName.VIEWER,
            });
            expect(user).not.toHaveProperty("passwordHash");
            expect(user.id).toBe("new-user-id");
            expect(mockPrisma.user.create).toHaveBeenCalled();
        });
    });
    describe("loginUser", () => {
        it("throws if user not found", async () => {
            mockPrisma.user.findUnique.mockResolvedValueOnce(null);
            await expect(loginUser({ email: "test@test.com", password: "password" })).rejects.toThrow("Invalid email or password");
        });
        it("throws if user inactive", async () => {
            mockPrisma.user.findUnique.mockResolvedValueOnce({ status: "INACTIVE" });
            await expect(loginUser({ email: "test@test.com", password: "password" })).rejects.toThrow("Account is inactive or suspended");
        });
        it("returns tokens on successful login", async () => {
            mockPrisma.user.findUnique.mockResolvedValueOnce({
                id: "user-1",
                status: "ACTIVE",
                passwordHash: "hashed-password",
                role: { name: RoleName.VIEWER },
            });
            const result = await loginUser({ email: "test@test.com", password: "password" });
            expect(result).toHaveProperty("accessToken");
            expect(result).toHaveProperty("refreshToken");
            expect(result).toHaveProperty("user");
            expect(result.user).not.toHaveProperty("passwordHash");
            expect(mockPrisma.refreshToken.create).toHaveBeenCalled();
            expect(mockPrisma.user.update).toHaveBeenCalled();
        });
    });
    describe("logoutUser", () => {
        it("revokes tokens", async () => {
            await logoutUser("some-token");
            expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
                where: { token: "some-token", revoked: false },
                data: { revoked: true },
            });
        });
    });
});
//# sourceMappingURL=auth.service.test.js.map