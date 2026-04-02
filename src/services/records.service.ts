import { Currency, RecordType } from "@prisma/client";
import { prisma } from "../config/db.js";
import { Decimal } from "@prisma/client/runtime/client";

type GetRecordsParams = {
  userId: string;
  type?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
};
type CreateRecordParams = {
  type: RecordType;
  amount: number;
  currency?: Currency;
  category: string;
  description?: string;
  createdById: string;
};
interface UpdateRecordParams {
  id: string;
  userId: string;
  amount?: number;
  type?: RecordType;
  category?: string;
  recordDate?: string;
  description?: string;
}
interface DeleteRecordParams {
  id: string;
  userId: string;
}

export const createRecordService = async ({
  type,
  amount,
  currency,
  category,
  description,
  createdById,
}: CreateRecordParams) => {
  if (!createdById) throw new Error("User ID missing");
  const record = await prisma.financialRecord.create({
    data: {
      type,
      amount: new Decimal(amount),
      category,
      createdById,
      ...(currency && { currency }),
      ...(description !== undefined && { description }),
    },
  });

  return record;
};
export const getRecordsService = async ({
  userId,
  type,
  category,
  startDate,
  endDate,
  page = 1,
  limit = 10,
}: GetRecordsParams) => {
  //  sanitize pagination
  const safePage = Math.max(1, Number(page));
  const safeLimit = Math.min(50, Math.max(1, Number(limit)));
  const skip = (safePage - 1) * safeLimit;

  //  build filters cleanly
  const where: any = {
    createdById: userId,
    isDeleted: false,
  };

  // type filter
  if (type && Object.values(RecordType).includes(type as RecordType)) {
    where.type = type as RecordType;
  }

  // category filter
  if (category) {
    where.category = {
      contains: category,
      mode: "insensitive",
    };
  }

  // date filter securely
  if (startDate || endDate) {
    where.recordDate = {};
    if (startDate) {
      const parsedStart = new Date(startDate);
      if (isNaN(parsedStart.getTime()))
        throw new Error("Invalid startDate format");
      where.recordDate.gte = parsedStart;
    }
    if (endDate) {
      const parsedEnd = new Date(endDate);
      if (isNaN(parsedEnd.getTime())) throw new Error("Invalid endDate format");
      where.recordDate.lte = parsedEnd;
    }
  }

  // query + count together
  const [records, total] = await Promise.all([
    prisma.financialRecord.findMany({
      where,
      orderBy: {
        recordDate: "desc",
      },
      skip,
      take: safeLimit,
    }),
    prisma.financialRecord.count({ where }),
  ]);

  return {
    data: records,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
};
export const updateRecordService = async ({
  id,
  userId,
  amount,
  type,
  category,
  recordDate,
  description,
}: UpdateRecordParams) => {
  //  check ownership
  const existingRecord = await prisma.financialRecord.findFirst({
    where: {
      id,
      createdById: userId,
      isDeleted: false,
    },
  });

  if (!existingRecord) {
    throw new Error("RECORD_NOT_FOUND");
  }

  // update
  const updatedRecord = await prisma.financialRecord.update({
    where: { id },
    data: {
      ...(amount !== undefined && { amount }),
      ...(type && { type }),
      ...(category && { category }),
      ...(recordDate && { recordDate: new Date(recordDate) }),
      ...(description !== undefined && { description }),
    },
  });

  return updatedRecord;
};
export const deleteRecordService = async ({
  id,
  userId,
}: DeleteRecordParams) => {
  // check ownership + not already deleted
  const existingRecord = await prisma.financialRecord.findFirst({
    where: {
      id,
      createdById: userId,
      isDeleted: false,
    },
  });

  if (!existingRecord) {
    throw new Error("RECORD_NOT_FOUND");
  }

  // soft delete
  await prisma.financialRecord.update({
    where: { id },
    data: {
      isDeleted: true,
    },
  });

  return { success: true };
};
