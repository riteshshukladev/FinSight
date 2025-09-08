import { useMemo } from "react";

interface Tx {
  date: Date | string;
  amount: string | number;
  type?: string;
  description?: string;
  category?: string;
  merchant?: string;
  address?: string;
  body?: string;
}

interface WindowResult {
  totalCount: number;
  totalCredit: number;
  totalDebit: number;
  net: number;
  list: Tx[];
  top: Tx[];
}

interface TransactionWindows {
  today: WindowResult;
  week: WindowResult;
  month: WindowResult;
  twoMonths: WindowResult;
}

const normalizeDate = (d: any): number => {
  const dt = d instanceof Date ? d : new Date(d);
  return dt.getTime();
};

const summarize = (txs: Tx[], topN: number): WindowResult => {
  let totalCredit = 0;
  let totalDebit = 0;
  txs.forEach(t => {
    const amt = Math.abs(parseFloat(String(t.amount)) || 0);
    if ((t.type || "").toUpperCase() === "CREDIT") totalCredit += amt;
    else totalDebit += amt;
  });
  return {
    totalCount: txs.length,
    totalCredit: Math.round(totalCredit),
    totalDebit: Math.round(totalDebit),
    net: Math.round(totalCredit - totalDebit),
    list: txs,
    top: txs.slice(0, topN),
  };
};

export const useTransactionWindows = (all: Tx[] = []): TransactionWindows => {
  return useMemo(() => {
    if (!Array.isArray(all) || all.length === 0) {
      const empty: WindowResult = {
        totalCount: 0,
        totalCredit: 0,
        totalDebit: 0,
        net: 0,
        list: [],
        top: [],
      };
      return {
        today: empty,
        week: empty,
        month: empty,
        twoMonths: empty,
      };
    }

    const now = new Date();
    const startToday = new Date(now); startToday.setHours(0,0,0,0);
    const startWeek = new Date(now); startWeek.setDate(startWeek.getDate() - 7); startWeek.setHours(0,0,0,0);
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startTwoMonths = new Date(now); startTwoMonths.setDate(startTwoMonths.getDate() - 60); startTwoMonths.setHours(0,0,0,0);

    const sorted = [...all].sort((a,b) => normalizeDate(b.date) - normalizeDate(a.date));

    const inRange = (from: Date) => sorted.filter(tx => normalizeDate(tx.date) >= from.getTime());

    const todayTx = sorted.filter(tx => {
      const ts = normalizeDate(tx.date);
      return ts >= startToday.getTime();
    });

    const weekTx = inRange(startWeek);
    const monthTx = inRange(startMonth);
    const twoMonthsTx = inRange(startTwoMonths);

    return {
      today: summarize(todayTx, 5),
      week: summarize(weekTx, 5),
      month: summarize(monthTx, 4),
      twoMonths: summarize(twoMonthsTx, 5),
    };
  }, [all]);
};