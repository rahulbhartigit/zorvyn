import { jest } from "@jest/globals";
import { RecordType, Currency } from "@prisma/client";


const mockPrisma: any = {
  financialRecord: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};

jest.unstable_mockModule("../../src/config/db.js", () => ({
  prisma: mockPrisma,
}));

describe("Records Service", () => {
  let createRecordService: any;
  let getRecordsService: any;
  let updateRecordService: any;
  let deleteRecordService: any;

  beforeAll(async () => {
    const recordsService = await import("../../src/services/records.service.js");
    createRecordService = recordsService.createRecordService;
    getRecordsService = recordsService.getRecordsService;
    updateRecordService = recordsService.updateRecordService;
    deleteRecordService = recordsService.deleteRecordService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createRecordService", () => {
    it("throws if createdById is missing", async () => {
      await expect(
        createRecordService({
          type: RecordType.INCOME,
          amount: 100,
          category: "Salary",
        } as any)
      ).rejects.toThrow("User ID missing");
    });

    it("creates record successfully", async () => {
      mockPrisma.financialRecord.create.mockResolvedValueOnce({ id: "record-1" });
      const record = await createRecordService({
        type: RecordType.INCOME,
        amount: 500,
        currency: Currency.INR,
        category: "Salary",
        description: "Monthly salary",
        createdById: "user-1",
      });

      expect(record).toEqual({ id: "record-1" });
      expect(mockPrisma.financialRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            amount: expect.anything(),
            type: RecordType.INCOME,
            category: "Salary",
            createdById: "user-1",
            currency: Currency.INR,
            description: "Monthly salary",
          }),
        })
      );
    });
  });

  describe("getRecordsService", () => {
    it("handles pagination ranges correctly", async () => {
      mockPrisma.financialRecord.findMany.mockResolvedValueOnce([]);
      mockPrisma.financialRecord.count.mockResolvedValueOnce(0);

      await getRecordsService({ userId: "user-1", page: 0, limit: 100 });
      
      expect(mockPrisma.financialRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 50,
        })
      );
    });

    it("throws on invalid dates", async () => {
      await expect(
        getRecordsService({ userId: "user-1", startDate: "invalid-date" })
      ).rejects.toThrow("Invalid startDate format");
    });
  });

  describe("updateRecordService", () => {
    it("throws if record is not found", async () => {
      mockPrisma.financialRecord.findFirst.mockResolvedValueOnce(null);
      await expect(
        updateRecordService({ id: "record-1", userId: "user-1", amount: 200 })
      ).rejects.toThrow("RECORD_NOT_FOUND");
    });

    it("updates record successfully", async () => {
      mockPrisma.financialRecord.findFirst.mockResolvedValueOnce({ id: "record-1" });
      mockPrisma.financialRecord.update.mockResolvedValueOnce({ id: "record-1", amount: 200 });

      const updated = await updateRecordService({
        id: "record-1",
        userId: "user-1",
        amount: 200,
      });

      expect(updated).toEqual({ id: "record-1", amount: 200 });
      expect(mockPrisma.financialRecord.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "record-1" },
        })
      );
    });
  });

  describe("deleteRecordService", () => {
    it("throws if record not found", async () => {
      mockPrisma.financialRecord.findFirst.mockResolvedValueOnce(null);
      await expect(deleteRecordService({ id: "record-1", userId: "user-1" })).rejects.toThrow("RECORD_NOT_FOUND");
    });

    it("soft deletes a record", async () => {
      mockPrisma.financialRecord.findFirst.mockResolvedValueOnce({ id: "record-1" });
      mockPrisma.financialRecord.update.mockResolvedValueOnce({ id: "record-1", isDeleted: true });

      const result = await deleteRecordService({ id: "record-1", userId: "user-1" });
      expect(result).toEqual({ success: true });
      expect(mockPrisma.financialRecord.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "record-1" },
          data: { isDeleted: true },
        })
      );
    });
  });
});
