export interface FinanceStats {
  totalRevenue: number;
  totalExpenses: number;
  totalSalaries: number;
  netProfit: number;
}

export interface MonthlyArchive {
  month: string; // формат: "2025-01"
  closedAt: number; // timestamp когда месяц был закрыт
  stats: {
    totalRevenue: number;
    totalExpenses: number;
    totalSalaries: number;
    netProfit: number;
    revenueByCard: number;
    revenueByTerminal: number;
    revenueByRS: number;
    revenueByCash: number;
    expensesByCard: number;
    expensesByTerminal: number;
    expensesByRS: number;
    expensesByCash: number;
    salariesByCard: number;
    salariesByTerminal: number;
    salariesByRS: number;
    salariesByCash: number;
    cashReserveByCard: number;
    cashReserveByTerminal: number;
    cashReserveByRS: number;
    cashReserveByCash: number;
  };
  overrides: Record<string, number>;
  ordersCount: number;
  expensesCount: number;
  salariesCount: number;
}