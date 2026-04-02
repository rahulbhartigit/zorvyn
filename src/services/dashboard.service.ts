import { RecordType } from "@prisma/client";
import { prisma } from "../config/db.js";
interface DashboardParams {
  userId: string;
}

export const getDashboardSummaryService = async ({
  userId,
}: DashboardParams) => {
  const result = await prisma.financialRecord.groupBy({
    by: ["type"],
    where: {
      createdById: userId,
      isDeleted: false,
    },
    _sum: {
      amount: true,
    },
  });
  let totalIncome = 0;
  let totalExpense = 0;

  result.forEach((item) => {
    const value = Number(item._sum.amount || 0);
    if (item.type === RecordType.INCOME) {
      totalIncome = value;
    }
    if (item.type === RecordType.EXPENSE) {
      totalExpense = value;
    }
  });
  const netBalance = totalIncome - totalExpense;
  return { totalIncome, totalExpense, netBalance };
};
export const getCategoryWiseTotalsService = async (userId: string) => {
  const result = await prisma.financialRecord.groupBy({
    by: ["category", "type"],
    where: {
      createdById: userId,
      isDeleted: false,
    },
    _sum: {
      amount: true,
    },
  });

  return result.map((item) => ({
    category: item.category,
    type: item.type,
    total: Number(item._sum.amount || 0),
  }));
};
export const getRecentActivityService = async (userId: string) => {
  const records = await prisma.financialRecord.findMany({
    where: {
      createdById: userId,
      isDeleted: false,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5, // last 5 transactions
  });

  return records;
};
export const getMonthlyTrendsService = async (userId: string) => {
  const records = await prisma.financialRecord.findMany({
    where: {
      createdById: userId,
      isDeleted: false,
    },
    select: {
      amount: true,
      type: true,
      recordDate: true,
    },
  });

  const monthlyMap: Record<string, { income: number; expense: number }> = {};

  records.forEach((r) => {
    const month = new Date(r.recordDate).toISOString().slice(0, 7); // YYYY-MM

    if (!monthlyMap[month]) {
      monthlyMap[month] = { income: 0, expense: 0 };
    }

    const value = Number(r.amount);

    if (r.type === "INCOME") {
      monthlyMap[month].income += value;
    } else {
      monthlyMap[month].expense += value;
    }
  });

  return Object.entries(monthlyMap).map(([month, data]) => ({
    month,
    ...data,
  }));
};
