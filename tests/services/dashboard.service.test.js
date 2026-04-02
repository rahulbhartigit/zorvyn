import { jest } from "@jest/globals";
import { RecordType } from "@prisma/client";
const mockPrisma = {
    financialRecord: {
        groupBy: jest.fn(),
        findMany: jest.fn(),
    },
};
jest.unstable_mockModule("../../src/config/db.js", () => ({
    prisma: mockPrisma,
}));
describe("Dashboard Service", () => {
    let getDashboardSummaryService;
    let getCategoryWiseTotalsService;
    let getRecentActivityService;
    let getMonthlyTrendsService;
    beforeAll(async () => {
        const dashboardService = await import("../../src/services/dashboard.service.js");
        getDashboardSummaryService = dashboardService.getDashboardSummaryService;
        getCategoryWiseTotalsService = dashboardService.getCategoryWiseTotalsService;
        getRecentActivityService = dashboardService.getRecentActivityService;
        getMonthlyTrendsService = dashboardService.getMonthlyTrendsService;
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe("getDashboardSummaryService", () => {
        it("returns correct totals and balance", async () => {
            mockPrisma.financialRecord.groupBy.mockResolvedValueOnce([
                { type: RecordType.INCOME, _sum: { amount: 1000 } },
                { type: RecordType.EXPENSE, _sum: { amount: 400 } },
            ]);
            const result = await getDashboardSummaryService({ userId: "user-1" });
            expect(result).toEqual({
                totalIncome: 1000,
                totalExpense: 400,
                netBalance: 600,
            });
        });
    });
    describe("getCategoryWiseTotalsService", () => {
        it("returns category groupings", async () => {
            mockPrisma.financialRecord.groupBy.mockResolvedValueOnce([
                { category: "Salary", type: RecordType.INCOME, _sum: { amount: 1000 } },
                { category: "Food", type: RecordType.EXPENSE, _sum: { amount: 200 } },
            ]);
            const result = await getCategoryWiseTotalsService("user-1");
            expect(result).toEqual([
                { category: "Salary", type: RecordType.INCOME, total: 1000 },
                { category: "Food", type: RecordType.EXPENSE, total: 200 },
            ]);
        });
    });
    describe("getRecentActivityService", () => {
        it("fetches the last 5 transactions", async () => {
            mockPrisma.financialRecord.findMany.mockResolvedValueOnce([{ id: "r1" }, { id: "r2" }]);
            const result = await getRecentActivityService("user-1");
            expect(result).toEqual([{ id: "r1" }, { id: "r2" }]);
            expect(mockPrisma.financialRecord.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 5, orderBy: { createdAt: "desc" } }));
        });
    });
    describe("getMonthlyTrendsService", () => {
        it("groups records by month", async () => {
            mockPrisma.financialRecord.findMany.mockResolvedValueOnce([
                { type: RecordType.INCOME, amount: 1000, recordDate: new Date("2026-04-10") },
                { type: RecordType.EXPENSE, amount: 200, recordDate: new Date("2026-04-15") },
                { type: RecordType.EXPENSE, amount: 300, recordDate: new Date("2026-03-10") },
            ]);
            const result = await getMonthlyTrendsService("user-1");
            expect(result).toEqual([
                { month: "2026-04", income: 1000, expense: 200 },
                { month: "2026-03", income: 0, expense: 300 },
            ]);
        });
    });
});
//# sourceMappingURL=dashboard.service.test.js.map