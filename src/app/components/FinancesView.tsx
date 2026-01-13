import { useState, useMemo } from "react";
import { Order } from "../types/order";
import { Expense, Salary } from "../types/finance";
import { ManagerData } from "../types/manager";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { ArchiveView } from "./ArchiveView";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  Trash2,
  Tag,
  Users,
  Check,
  X,
  Download,
  Archive,
} from "lucide-react";
import { toast } from "sonner";

interface FinancesViewProps {
  orders: Order[];
  managersData: ManagerData[];
  expenses: Expense[];
  salaries: Salary[];
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onAddSalary: (salary: Salary) => void;
  onDeleteSalary: (id: string) => void;
  onToggleSalaryPaid: (id: string) => void;
}

const EXPENSE_CATEGORIES = [
  "Смола",
  "Расходники",
  "Печать",
  "Прочее",
];

const PAYMENT_SOURCES = [
  "Наличные",
  "Карта",
  "Терминал",
  "Расчетный счет",
];

export function FinancesView({
  orders,
  managersData,
  expenses,
  salaries,
  onAddExpense,
  onDeleteExpense,
  onAddSalary,
  onDeleteSalary,
  onToggleSalaryPaid,
}: FinancesViewProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<"month" | "all" | "custom" | "first-half" | "second-half">("month");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [customStartDate, setCustomStartDate] = useState(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return firstDay.toISOString().split("T")[0];
  });
  const [customEndDate, setCustomEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  
  const [cashReserveBreakdown, setCashReserveBreakdown] = useState({
    card: 0,
    terminal: 0,
    rs: 0,
    cash: 0,
  });
  
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  const [overrides, setOverrides] = useState<{
    revenue?: { card?: number; terminal?: number; rs?: number; cash?: number };
    expenses?: { card?: number; terminal?: number; rs?: number; cash?: number };
    salaries?: { card?: number; terminal?: number; rs?: number; cash?: number };
  }>({});

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().split("T")[0],
    category: EXPENSE_CATEGORIES[0],
    amount: "",
    paymentSource: PAYMENT_SOURCES[0],
  });

  const [newSalary, setNewSalary] = useState({
    month: selectedMonth,
    manager: managersData[0]?.name || "",
    customManager: "",
    isCustomManager: false,
    amount: "",
    paymentSource: PAYMENT_SOURCES[0],
  });

  const [importParams, setImportParams] = useState({
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    manager: managersData[0]?.name || "",
    paymentSource: PAYMENT_SOURCES[0],
  });

  const [activeTab, setActiveTab] = useState<"main" | "archive">("main");
  const [rightPanelTab, setRightPanelTab] = useState<"expenses" | "salaries">("expenses");
  
  const filteredData = useMemo(() => {
    if (selectedPeriod === "all") {
      return {
        orders: orders.filter((o) => o.isPaid),
        expenses,
        salaries,
      };
    }

    if (selectedPeriod === "custom") {
      const startDate = new Date(customStartDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999);

      return {
        orders: orders.filter((o) => {
          if (!o.isPaid) return false;
          const orderDate = new Date(o.orderDate);
          return orderDate >= startDate && orderDate <= endDate;
        }),
        expenses: expenses.filter((e) => {
          const expenseDate = new Date(e.date);
          return expenseDate >= startDate && expenseDate <= endDate;
        }),
        salaries: salaries.filter((s) => {
          const salaryDate = new Date(s.month + "-01");
          return salaryDate >= startDate && salaryDate <= endDate;
        }),
      };
    }

    // Первая половина месяца (1-15)
    if (selectedPeriod === "first-half") {
      const now = new Date();
      const [year, month] = [now.getFullYear(), now.getMonth()];
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month, 15, 23, 59, 59);
      const currentMonth = `${year}-${String(month + 1).padStart(2, "0")}`;

      return {
        orders: orders.filter((o) => {
          if (!o.isPaid) return false;
          const orderDate = new Date(o.orderDate);
          return orderDate >= startDate && orderDate <= endDate;
        }),
        expenses: expenses.filter((e) => {
          const expenseDate = new Date(e.date);
          return expenseDate >= startDate && expenseDate <= endDate;
        }),
        salaries: salaries.filter((s) => s.month === currentMonth),
      };
    }

    // Вторая половина месяца (16-31)
    if (selectedPeriod === "second-half") {
      const now = new Date();
      const [year, month] = [now.getFullYear(), now.getMonth()];
      const startDate = new Date(year, month, 16);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59); // Последний день месяца
      const currentMonth = `${year}-${String(month + 1).padStart(2, "0")}`;

      return {
        orders: orders.filter((o) => {
          if (!o.isPaid) return false;
          const orderDate = new Date(o.orderDate);
          return orderDate >= startDate && orderDate <= endDate;
        }),
        expenses: expenses.filter((e) => {
          const expenseDate = new Date(e.date);
          return expenseDate >= startDate && expenseDate <= endDate;
        }),
        salaries: salaries.filter((s) => s.month === currentMonth),
      };
    }

    const [year, month] = selectedMonth.split("-");
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    return {
      orders: orders.filter((o) => {
        if (!o.isPaid) return false;
        const orderDate = new Date(o.orderDate);
        return orderDate >= startDate && orderDate <= endDate;
      }),
      expenses: expenses.filter((e) => {
        const expenseDate = new Date(e.date);
        return expenseDate >= startDate && expenseDate <= endDate;
      }),
      salaries: salaries.filter((s) => s.month === selectedMonth),
    };
  }, [selectedPeriod, selectedMonth, customStartDate, customEndDate, orders, expenses, salaries]);

  const stats = useMemo(() => {
    const processedDuplicates = new Set<string>();
    let totalRevenue = 0;
    let revenueByCard = 0;
    let revenueByTerminal = 0;
    let revenueByRS = 0;
    let revenueByCash = 0;

    filteredData.orders.forEach((order) => {
      let orderRevenue = 0;
      
      if (order.duplicateGroupId) {
        if (processedDuplicates.has(order.duplicateGroupId)) {
          return;
        }
        const duplicateGroupOrders = filteredData.orders.filter(
          (o) => o.duplicateGroupId === order.duplicateGroupId
        );
        orderRevenue = duplicateGroupOrders.reduce((sum, o) => sum + o.price, 0);
        processedDuplicates.add(order.duplicateGroupId);
      } else {
        orderRevenue = order.price;
      }
      
      totalRevenue += orderRevenue;
      
      switch (order.paymentMethod) {
        case "Карта":
          revenueByCard += orderRevenue;
          break;
        case "Терминал":
          revenueByTerminal += orderRevenue;
          break;
        case "РС":
          revenueByRS += orderRevenue;
          break;
        case "Наличные":
          revenueByCash += orderRevenue;
          break;
      }
    });

    const totalExpenses = filteredData.expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalSalaries = filteredData.salaries.reduce((sum, s) => sum + s.amount, 0);
    
    let expensesByCard = 0;
    let expensesByTerminal = 0;
    let expensesByRS = 0;
    let expensesByCash = 0;
    
    filteredData.expenses.forEach((expense) => {
      switch (expense.paymentSource) {
        case "Карта":
          expensesByCard += expense.amount;
          break;
        case "Терминал":
          expensesByTerminal += expense.amount;
          break;
        case "Расчетный счет":
          expensesByRS += expense.amount;
          break;
        case "Наличные":
          expensesByCash += expense.amount;
          break;
      }
    });
    
    let salariesByCard = 0;
    let salariesByTerminal = 0;
    let salariesByRS = 0;
    let salariesByCash = 0;
    
    filteredData.salaries.forEach((salary) => {
      if (!salary.paymentSource) return;
      
      switch (salary.paymentSource) {
        case "Карта":
          salariesByCard += salary.amount;
          break;
        case "Терминал":
          salariesByTerminal += salary.amount;
          break;
        case "Расчетный счет":
          salariesByRS += salary.amount;
          break;
        case "Наличные":
          salariesByCash += salary.amount;
          break;
      }
    });
    
    if (overrides.revenue?.card !== undefined) revenueByCard = overrides.revenue.card;
    if (overrides.revenue?.terminal !== undefined) revenueByTerminal = overrides.revenue.terminal;
    if (overrides.revenue?.rs !== undefined) revenueByRS = overrides.revenue.rs;
    if (overrides.revenue?.cash !== undefined) revenueByCash = overrides.revenue.cash;
    
    if (overrides.expenses?.card !== undefined) expensesByCard = overrides.expenses.card;
    if (overrides.expenses?.terminal !== undefined) expensesByTerminal = overrides.expenses.terminal;
    if (overrides.expenses?.rs !== undefined) expensesByRS = overrides.expenses.rs;
    if (overrides.expenses?.cash !== undefined) expensesByCash = overrides.expenses.cash;
    
    if (overrides.salaries?.card !== undefined) salariesByCard = overrides.salaries.card;
    if (overrides.salaries?.terminal !== undefined) salariesByTerminal = overrides.salaries.terminal;
    if (overrides.salaries?.rs !== undefined) salariesByRS = overrides.salaries.rs;
    if (overrides.salaries?.cash !== undefined) salariesByCash = overrides.salaries.cash;
    
    const finalTotalRevenue = revenueByCard + revenueByTerminal + revenueByRS + revenueByCash;
    const finalTotalExpenses = expensesByCard + expensesByTerminal + expensesByRS + expensesByCash;
    const finalTotalSalaries = salariesByCard + salariesByTerminal + salariesByRS + salariesByCash;
    
    const netProfit = finalTotalRevenue - finalTotalExpenses - finalTotalSalaries;
    
    const netProfitByCard = revenueByCard - expensesByCard - salariesByCard - cashReserveBreakdown.card;
    const netProfitByTerminal = revenueByTerminal - expensesByTerminal - salariesByTerminal - cashReserveBreakdown.terminal;
    const netProfitByRS = revenueByRS - expensesByRS - salariesByRS - cashReserveBreakdown.rs;
    const netProfitByCash = revenueByCash - expensesByCash - salariesByCash - cashReserveBreakdown.cash;

    return {
      totalRevenue: finalTotalRevenue,
      revenueByCard,
      revenueByTerminal,
      revenueByRS,
      revenueByCash,
      totalExpenses: finalTotalExpenses,
      expensesByCard,
      expensesByTerminal,
      expensesByRS,
      expensesByCash,
      totalSalaries: finalTotalSalaries,
      salariesByCard,
      salariesByTerminal,
      salariesByRS,
      salariesByCash,
      netProfit,
      netProfitByCard,
      netProfitByTerminal,
      netProfitByRS,
      netProfitByCash,
    };
  }, [filteredData, cashReserveBreakdown, overrides]);

  const handleAddExpense = () => {
    if (!newExpense.amount || parseFloat(newExpense.amount) <= 0) {
      toast.error("Укажите корректную сумму расхода");
      return;
    }

    const expense: Expense = {
      id: `expense_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: newExpense.date,
      category: newExpense.category,
      amount: parseFloat(newExpense.amount),
      paymentSource: newExpense.paymentSource,
      createdAt: Date.now(),
    };

    onAddExpense(expense);
    setNewExpense({
      date: new Date().toISOString().split("T")[0],
      category: EXPENSE_CATEGORIES[0],
      amount: "",
      paymentSource: PAYMENT_SOURCES[0],
    });
    setShowExpenseModal(false);
    toast.success("Расход добавлен");
  };

  const handleAddSalary = () => {
    if (!newSalary.amount || parseFloat(newSalary.amount) <= 0) {
      toast.error("Укажите корректную сумму зарплаты");
      return;
    }

    const managerName = newSalary.isCustomManager ? newSalary.customManager : newSalary.manager;
    
    if (!managerName || managerName.trim() === "") {
      toast.error("Укажите менеджера или подрядчика");
      return;
    }

    const exists = salaries.some(
      (s) => s.month === newSalary.month && s.manager === managerName
    );

    if (exists) {
      toast.error(`Зарплата для ${managerName} за этот месяц уже добавлена`);
      return;
    }

    const salary: Salary = {
      id: `salary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      month: newSalary.month,
      manager: managerName,
      amount: parseFloat(newSalary.amount),
      isPaid: false,
      paymentSource: newSalary.paymentSource,
      createdAt: Date.now(),
    };

    onAddSalary(salary);
    setNewSalary({
      month: selectedMonth,
      manager: managersData[0]?.name || "",
      customManager: "",
      isCustomManager: false,
      amount: "",
      paymentSource: PAYMENT_SOURCES[0],
    });
    setShowSalaryModal(false);
    toast.success("Зарплата добавлена");
  };

  const handleImportSalaries = () => {
    setShowImportModal(true);
  };

  const handleConfirmImport = () => {
    const { startDate, endDate, manager, paymentSource } = importParams;
    
    const managerData = managersData.find((m) => m.name === manager);
    if (!managerData) {
      toast.error("Менеджер не найден");
      return;
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const ordersInRange = orders.filter((o) => {
      if (!o.isPaid || o.manager !== manager) return false;
      const orderDate = new Date(o.orderDate);
      return orderDate >= start && orderDate <= end;
    });

    const processedDuplicates = new Set<string>();
    let managerRevenue = 0;

    ordersInRange.forEach((order) => {
      let orderRevenue = 0;

      if (order.duplicateGroupId) {
        if (processedDuplicates.has(order.duplicateGroupId)) {
          return;
        }
        const duplicateGroupOrders = ordersInRange.filter(
          (o) => o.duplicateGroupId === order.duplicateGroupId
        );
        orderRevenue = duplicateGroupOrders.reduce((sum, o) => sum + o.price, 0);
        processedDuplicates.add(order.duplicateGroupId);
      } else {
        orderRevenue = order.price;
      }

      managerRevenue += orderRevenue;
    });

    const calculatedSalary = (managerRevenue * managerData.salaryPercentage) / 100;

    if (calculatedSalary <= 0) {
      toast.error("Нет выручки за указанный период");
      setShowImportModal(false);
      return;
    }

    const salaryMonth = startDate.slice(0, 7);

    const exists = salaries.some(
      (s) => s.month === salaryMonth && s.manager === manager
    );

    if (exists) {
      toast.error(`Зарплата для ${manager} за этот период уже добавлена`);
      setShowImportModal(false);
      return;
    }

    const salary: Salary = {
      id: `salary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      month: salaryMonth,
      manager: manager,
      amount: calculatedSalary,
      isPaid: false,
      paymentSource: paymentSource,
      createdAt: Date.now(),
    };

    onAddSalary(salary);
    setShowImportModal(false);
    toast.success(`Зарплата импортирована: ${Math.round(calculatedSalary).toLocaleString("ru-RU")} ₽`);
  };
  
  const handleCellClick = (cellId: string, currentValue: number) => {
    setEditingCell(cellId);
    setEditValue(currentValue.toString());
  };
  
  const handleCellSave = (cellId: string) => {
    const value = parseFloat(editValue) || 0;
    
    if (cellId === "cash-card") {
      setCashReserveBreakdown({ ...cashReserveBreakdown, card: value });
    } else if (cellId === "cash-terminal") {
      setCashReserveBreakdown({ ...cashReserveBreakdown, terminal: value });
    } else if (cellId === "cash-rs") {
      setCashReserveBreakdown({ ...cashReserveBreakdown, rs: value });
    } else if (cellId === "cash-cash") {
      setCashReserveBreakdown({ ...cashReserveBreakdown, cash: value });
    }
    else if (cellId === "revenue-card") {
      setOverrides({ ...overrides, revenue: { ...overrides.revenue, card: value } });
    } else if (cellId === "revenue-terminal") {
      setOverrides({ ...overrides, revenue: { ...overrides.revenue, terminal: value } });
    } else if (cellId === "revenue-rs") {
      setOverrides({ ...overrides, revenue: { ...overrides.revenue, rs: value } });
    } else if (cellId === "revenue-cash") {
      setOverrides({ ...overrides, revenue: { ...overrides.revenue, cash: value } });
    }
    else if (cellId === "expenses-card") {
      setOverrides({ ...overrides, expenses: { ...overrides.expenses, card: value } });
    } else if (cellId === "expenses-terminal") {
      setOverrides({ ...overrides, expenses: { ...overrides.expenses, terminal: value } });
    } else if (cellId === "expenses-rs") {
      setOverrides({ ...overrides, expenses: { ...overrides.expenses, rs: value } });
    } else if (cellId === "expenses-cash") {
      setOverrides({ ...overrides, expenses: { ...overrides.expenses, cash: value } });
    }
    else if (cellId === "salaries-card") {
      setOverrides({ ...overrides, salaries: { ...overrides.salaries, card: value } });
    } else if (cellId === "salaries-terminal") {
      setOverrides({ ...overrides, salaries: { ...overrides.salaries, terminal: value } });
    } else if (cellId === "salaries-rs") {
      setOverrides({ ...overrides, salaries: { ...overrides.salaries, rs: value } });
    } else if (cellId === "salaries-cash") {
      setOverrides({ ...overrides, salaries: { ...overrides.salaries, cash: value } });
    }
    
    setEditingCell(null);
    setEditValue("");
  };
  
  const handleCellCancel = () => {
    setEditingCell(null);
    setEditValue("");
  };
  
  const handleCellKeyDown = (e: React.KeyboardEvent, cellId: string) => {
    if (e.key === "Enter") {
      handleCellSave(cellId);
    } else if (e.key === "Escape") {
      handleCellCancel();
    }
  };

  const EditableCell = ({ cellId, value, className = "" }: { cellId: string; value: number; className?: string }) => {
    if (editingCell === cellId) {
      return (
        <div className="flex items-center gap-1 justify-end">
          <input
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => handleCellKeyDown(e, cellId)}
            onBlur={() => handleCellSave(cellId)}
            autoFocus
            className="w-20 px-2 py-1 text-xs text-right bg-white border border-[#9CD5FF] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#9CD5FF]"
          />
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleCellSave(cellId)}
            className="p-1 rounded-md bg-[#9CD5FF] text-white hover:bg-[#C1E5FF]"
          >
            <Check className="w-3 h-3" strokeWidth={2} />
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleCellCancel}
            className="p-1 rounded-md bg-white text-[#86868b] hover:bg-[#f5f5f7] border border-[#d2d2d7]/30"
          >
            <X className="w-3 h-3" strokeWidth={2} />
          </button>
        </div>
      );
    }
    
    return (
      <button
        onClick={() => handleCellClick(cellId, value)}
        className={`text-xs hover:text-[#9CD5FF] hover:underline decoration-dotted underline-offset-2 transition-colors ${className}`}
      >
        {Math.round(value).toLocaleString("ru-RU")} ₽
      </button>
    );
  };

  const getPeriodLabel = () => {
    if (selectedPeriod === "all") return "За всё время";
    if (selectedPeriod === "custom") {
      const start = new Date(customStartDate).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
      const end = new Date(customEndDate).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
      return `${start} - ${end}`;
    }
    if (selectedPeriod === "first-half") {
      const now = new Date();
      const monthName = now.toLocaleDateString("ru-RU", { month: "long" });
      return `${monthName} 1-15`;
    }
    if (selectedPeriod === "second-half") {
      const now = new Date();
      const monthName = now.toLocaleDateString("ru-RU", { month: "long" });
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      return `${monthName} 16-${lastDay}`;
    }
    return new Date(selectedMonth + "-01").toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
  };

  return (
    <div className="space-y-4">
      {/* Компактный заголовок и фильтры */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl text-[#1d1d1f]">Финансы</h1>
          <p className="text-xs text-[#86868b] mt-0.5">{getPeriodLabel()}</p>
        </div>

        {/* Компактные фильтры */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-white rounded-xl p-0.5 shadow-sm border border-[#e5e5ea]">
            <button
              onClick={() => setSelectedPeriod("month")}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                selectedPeriod === "month"
                  ? "bg-[#9CD5FF] text-white"
                  : "text-[#86868b] hover:text-[#1d1d1f]"
              }`}
            >
              Месяц
            </button>
            <button
              onClick={() => setSelectedPeriod("first-half")}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                selectedPeriod === "first-half"
                  ? "bg-[#9CD5FF] text-white"
                  : "text-[#86868b] hover:text-[#1d1d1f]"
              }`}
            >
              1-15
            </button>
            <button
              onClick={() => setSelectedPeriod("second-half")}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                selectedPeriod === "second-half"
                  ? "bg-[#9CD5FF] text-white"
                  : "text-[#86868b] hover:text-[#1d1d1f]"
              }`}
            >
              16-31
            </button>
            <button
              onClick={() => setSelectedPeriod("all")}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                selectedPeriod === "all"
                  ? "bg-[#9CD5FF] text-white"
                  : "text-[#86868b] hover:text-[#1d1d1f]"
              }`}
            >
              Всё
            </button>
            <button
              onClick={() => setSelectedPeriod("custom")}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                selectedPeriod === "custom"
                  ? "bg-[#9CD5FF] text-white"
                  : "text-[#86868b] hover:text-[#1d1d1f]"
              }`}
            >
              Период
            </button>
          </div>

          {selectedPeriod === "month" && (
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-36 h-8 text-xs bg-white border-[#e5e5ea] rounded-lg"
            />
          )}

          {selectedPeriod === "custom" && (
            <div className="flex items-center gap-1.5">
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-32 h-8 text-xs bg-white border-[#e5e5ea] rounded-lg"
              />
              <span className="text-[#86868b] text-xs">—</span>
              <Input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-32 h-8 text-xs bg-white border-[#e5e5ea] rounded-lg"
              />
            </div>
          )}
        </div>
      </div>

      {/* Компактные метрики */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#e5e5ea]">
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 rounded-lg bg-[#EAF6FF]">
              <TrendingUp className="w-4 h-4 text-[#9CD5FF]" strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-[10px] text-[#86868b] uppercase tracking-wider mb-1">Выручка</p>
          <p className="text-xl text-[#1d1d1f]">
            {Math.round(stats.totalRevenue).toLocaleString("ru-RU")} ₽
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#e5e5ea]">
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 rounded-lg bg-[#f5f5f7]">
              <TrendingDown className="w-4 h-4 text-[#86868b]" strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-[10px] text-[#86868b] uppercase tracking-wider mb-1">Расходы</p>
          <p className="text-xl text-[#1d1d1f]">
            {Math.round(stats.totalExpenses).toLocaleString("ru-RU")} ₽
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#e5e5ea]">
          <div className="flex items-center justify-between mb-2">
            <div className="p-1.5 rounded-lg bg-[#f5f5f7]">
              <Users className="w-4 h-4 text-[#86868b]" strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-[10px] text-[#86868b] uppercase tracking-wider mb-1">Зарплаты</p>
          <p className="text-xl text-[#1d1d1f]">
            {Math.round(stats.totalSalaries).toLocaleString("ru-RU")} ₽
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#e5e5ea]">
          <div className="flex items-center justify-between mb-2">
            <div className={`p-1.5 rounded-lg ${stats.netProfit >= 0 ? "bg-[#EAF6FF]" : "bg-[#f5f5f7]"}`}>
              <Wallet className={`w-4 h-4 ${stats.netProfit >= 0 ? "text-[#9CD5FF]" : "text-[#86868b]"}`} strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-[10px] text-[#86868b] uppercase tracking-wider mb-1">Прибыль</p>
          <p className={`text-xl ${stats.netProfit >= 0 ? "text-[#1d1d1f]" : "text-[#86868b]"}`}>
            {Math.round(stats.netProfit).toLocaleString("ru-RU")} ₽
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white rounded-xl p-0.5 shadow-sm border border-[#e5e5ea] w-fit">
        <button
          onClick={() => setActiveTab("main")}
          className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
            activeTab === "main"
              ? "bg-[#9CD5FF] text-white"
              : "text-[#86868b] hover:text-[#1d1d1f]"
          }`}
        >
          Основное
        </button>
        <button
          onClick={() => setActiveTab("archive")}
          className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 ${
            activeTab === "archive"
              ? "bg-[#9CD5FF] text-white"
              : "text-[#86868b] hover:text-[#1d1d1f]"
          }`}
        >
          <Archive className="w-3.5 h-3.5" strokeWidth={1.5} />
          Архив
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "main" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Калькулятор - 2 колонки */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-[#e5e5ea] overflow-hidden">
            <div className="p-5">
              <div className="mb-4 p-3 bg-[#EAF6FF] rounded-xl">
                <p className="text-xs text-[#86868b] flex items-center gap-2">
                  <span>💡</span>
                  Нажмите на любое значение в таблице, чтобы отредактировать его
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#e5e5ea]">
                      <th className="pb-3 text-left text-[10px] text-[#86868b] uppercase tracking-wider"></th>
                      <th className="pb-3 px-3 text-right text-[10px] text-[#86868b] uppercase tracking-wider">Карта</th>
                      <th className="pb-3 px-3 text-right text-[10px] text-[#86868b] uppercase tracking-wider">Терминал</th>
                      <th className="pb-3 px-3 text-right text-[10px] text-[#86868b] uppercase tracking-wider">РС</th>
                      <th className="pb-3 px-3 text-right text-[10px] text-[#86868b] uppercase tracking-wider">Наличные</th>
                      <th className="pb-3 pl-3 text-right text-[10px] text-[#86868b] uppercase tracking-wider">Итого</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[#e5e5ea]/50 hover:bg-[#fbfbfd] transition-colors">
                      <td className="py-3 text-xs text-[#1d1d1f]">Выручка</td>
                      <td className="py-3 px-3 text-right">
                        <EditableCell cellId="revenue-card" value={stats.revenueByCard} className="text-[#86868b]" />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <EditableCell cellId="revenue-terminal" value={stats.revenueByTerminal} className="text-[#86868b]" />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <EditableCell cellId="revenue-rs" value={stats.revenueByRS} className="text-[#86868b]" />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <EditableCell cellId="revenue-cash" value={stats.revenueByCash} className="text-[#86868b]" />
                      </td>
                      <td className="py-3 pl-3 text-right text-xs text-[#1d1d1f]">
                        {Math.round(stats.revenueByCard + stats.revenueByTerminal + stats.revenueByRS + stats.revenueByCash).toLocaleString("ru-RU")} ₽
                      </td>
                    </tr>
                    
                    <tr className="border-b border-[#e5e5ea]/50 hover:bg-[#fbfbfd] transition-colors">
                      <td className="py-3 text-xs text-[#1d1d1f]">Расходы</td>
                      <td className="py-3 px-3 text-right">
                        <EditableCell cellId="expenses-card" value={stats.expensesByCard} className="text-[#86868b]" />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <EditableCell cellId="expenses-terminal" value={stats.expensesByTerminal} className="text-[#86868b]" />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <EditableCell cellId="expenses-rs" value={stats.expensesByRS} className="text-[#86868b]" />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <EditableCell cellId="expenses-cash" value={stats.expensesByCash} className="text-[#86868b]" />
                      </td>
                      <td className="py-3 pl-3 text-right text-xs text-[#1d1d1f]">
                        {Math.round(stats.expensesByCard + stats.expensesByTerminal + stats.expensesByRS + stats.expensesByCash).toLocaleString("ru-RU")} ₽
                      </td>
                    </tr>
                    
                    <tr className="border-b border-[#e5e5ea]/50 hover:bg-[#fbfbfd] transition-colors">
                      <td className="py-3 text-xs text-[#1d1d1f]">Зарплаты</td>
                      <td className="py-3 px-3 text-right">
                        <EditableCell cellId="salaries-card" value={stats.salariesByCard} className="text-[#86868b]" />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <EditableCell cellId="salaries-terminal" value={stats.salariesByTerminal} className="text-[#86868b]" />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <EditableCell cellId="salaries-rs" value={stats.salariesByRS} className="text-[#86868b]" />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <EditableCell cellId="salaries-cash" value={stats.salariesByCash} className="text-[#86868b]" />
                      </td>
                      <td className="py-3 pl-3 text-right text-xs text-[#1d1d1f]">
                        {Math.round(stats.salariesByCard + stats.salariesByTerminal + stats.salariesByRS + stats.salariesByCash).toLocaleString("ru-RU")} ₽
                      </td>
                    </tr>
                    
                    <tr className="border-b border-[#e5e5ea]/50 bg-[#EAF6FF]/20">
                      <td className="py-3 text-xs text-[#1d1d1f]">Касса</td>
                      <td className="py-3 px-3 text-right">
                        <EditableCell cellId="cash-card" value={cashReserveBreakdown.card} className="text-[#86868b]" />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <EditableCell cellId="cash-terminal" value={cashReserveBreakdown.terminal} className="text-[#86868b]" />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <EditableCell cellId="cash-rs" value={cashReserveBreakdown.rs} className="text-[#86868b]" />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <EditableCell cellId="cash-cash" value={cashReserveBreakdown.cash} className="text-[#86868b]" />
                      </td>
                      <td className="py-3 pl-3 text-right text-xs text-[#1d1d1f]">
                        {Math.round(cashReserveBreakdown.card + cashReserveBreakdown.terminal + cashReserveBreakdown.rs + cashReserveBreakdown.cash).toLocaleString("ru-RU")} ₽
                      </td>
                    </tr>
                    
                    <tr className="bg-[#EAF6FF]/30">
                      <td className="py-3 text-sm text-[#1d1d1f]">Прибыль</td>
                      <td className="py-3 px-3 text-right text-sm text-[#1d1d1f]">
                        {Math.round(stats.netProfitByCard).toLocaleString("ru-RU")} ₽
                      </td>
                      <td className="py-3 px-3 text-right text-sm text-[#1d1d1f]">
                        {Math.round(stats.netProfitByTerminal).toLocaleString("ru-RU")} ₽
                      </td>
                      <td className="py-3 px-3 text-right text-sm text-[#1d1d1f]">
                        {Math.round(stats.netProfitByRS).toLocaleString("ru-RU")} ₽
                      </td>
                      <td className="py-3 px-3 text-right text-sm text-[#1d1d1f]">
                        {Math.round(stats.netProfitByCash).toLocaleString("ru-RU")} ₽
                      </td>
                      <td className="py-3 pl-3 text-right text-sm text-[#1d1d1f]">
                        {Math.round(stats.netProfitByCard + stats.netProfitByTerminal + stats.netProfitByRS + stats.netProfitByCash).toLocaleString("ru-RU")} ₽
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Правая панель - Расходы и Зарплаты - 1 колонка */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#e5e5ea] overflow-hidden flex flex-col">
            <div className="p-3 border-b border-[#e5e5ea] flex items-center justify-between">
              <div className="flex items-center gap-1 bg-[#f5f5f7] rounded-lg p-0.5">
                <button
                  onClick={() => setRightPanelTab("expenses")}
                  className={`px-2.5 py-1 rounded-md text-xs transition-all flex items-center gap-1.5 ${
                    rightPanelTab === "expenses"
                      ? "bg-white text-[#1d1d1f] shadow-sm"
                      : "text-[#86868b] hover:text-[#1d1d1f]"
                  }`}
                >
                  Расходы
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    rightPanelTab === "expenses" ? "bg-[#EAF6FF] text-[#9CD5FF]" : "bg-[#e5e5ea] text-[#86868b]"
                  }`}>
                    {filteredData.expenses.length}
                  </span>
                </button>
                <button
                  onClick={() => setRightPanelTab("salaries")}
                  className={`px-2.5 py-1 rounded-md text-xs transition-all flex items-center gap-1.5 ${
                    rightPanelTab === "salaries"
                      ? "bg-white text-[#1d1d1f] shadow-sm"
                      : "text-[#86868b] hover:text-[#1d1d1f]"
                  }`}
                >
                  Зарплаты
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    rightPanelTab === "salaries" ? "bg-[#EAF6FF] text-[#9CD5FF]" : "bg-[#e5e5ea] text-[#86868b]"
                  }`}>
                    {filteredData.salaries.length}
                  </span>
                </button>
              </div>

              <div className="flex gap-1.5">
                {rightPanelTab === "expenses" && (
                  <Button
                    onClick={() => setShowExpenseModal(true)}
                    className="px-2 py-1 bg-[#9CD5FF] text-white rounded-lg hover:bg-[#C1E5FF] text-xs shadow-sm"
                  >
                    <Plus className="w-3 h-3" strokeWidth={2} />
                  </Button>
                )}
                {rightPanelTab === "salaries" && (
                  <>
                    <Button
                      onClick={() => setShowSalaryModal(true)}
                      className="px-2 py-1 bg-[#9CD5FF] text-white rounded-lg hover:bg-[#C1E5FF] text-xs shadow-sm"
                    >
                      <Plus className="w-3 h-3" strokeWidth={2} />
                    </Button>
                    <Button
                      onClick={handleImportSalaries}
                      className="px-2 py-1 bg-white text-[#1d1d1f] rounded-lg hover:bg-[#f5f5f7] text-xs shadow-sm border border-[#e5e5ea]"
                    >
                      <Download className="w-3 h-3" strokeWidth={2} />
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[600px]">
              {rightPanelTab === "expenses" && (
                <div className="divide-y divide-[#e5e5ea]/50">
                  {filteredData.expenses.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-[#f5f5f7] flex items-center justify-center">
                        <Tag className="w-5 h-5 text-[#86868b]" strokeWidth={1.5} />
                      </div>
                      <p className="text-xs text-[#86868b] mb-3">Расходы не добавлены</p>
                      <Button
                        onClick={() => setShowExpenseModal(true)}
                        className="px-3 py-1.5 bg-[#9CD5FF] text-white rounded-lg hover:bg-[#C1E5FF] text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" strokeWidth={2} />
                        Добавить
                      </Button>
                    </div>
                  ) : (
                    filteredData.expenses
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((expense) => (
                        <div
                          key={expense.id}
                          className="flex items-start justify-between p-3 hover:bg-[#fbfbfd] transition-colors group"
                        >
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-[#f5f5f7] flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Tag className="w-3.5 h-3.5 text-[#86868b]" strokeWidth={1.5} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-[#1d1d1f] mb-0.5 truncate">{expense.category}</p>
                              <div className="flex flex-col gap-0.5 text-[10px] text-[#86868b]">
                                <span>
                                  {new Date(expense.date).toLocaleDateString("ru-RU", {
                                    day: "numeric",
                                    month: "short",
                                  })}
                                </span>
                                <span>{expense.paymentSource}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-start gap-2 flex-shrink-0">
                            <span className="text-xs text-[#1d1d1f] tabular-nums">
                              {Math.round(expense.amount).toLocaleString("ru-RU")} ₽
                            </span>
                            <button
                              onClick={() => {
                                if (confirm("Удалить этот расход?")) {
                                  onDeleteExpense(expense.id);
                                  toast.success("Расход удален");
                                }
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-[#86868b] hover:bg-[#f5f5f7] transition-all"
                            >
                              <Trash2 className="w-3 h-3" strokeWidth={1.5} />
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}

              {rightPanelTab === "salaries" && (
                <div className="divide-y divide-[#e5e5ea]/50">
                  {filteredData.salaries.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-[#f5f5f7] flex items-center justify-center">
                        <Users className="w-5 h-5 text-[#86868b]" strokeWidth={1.5} />
                      </div>
                      <p className="text-xs text-[#86868b] mb-3">Зарплаты не добавлены</p>
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => setShowSalaryModal(true)}
                          className="px-3 py-1.5 bg-[#9CD5FF] text-white rounded-lg hover:bg-[#C1E5FF] text-xs"
                        >
                          <Plus className="w-3 h-3 mr-1" strokeWidth={2} />
                          Добавить
                        </Button>
                        <Button
                          onClick={handleImportSalaries}
                          className="px-3 py-1.5 bg-white text-[#1d1d1f] rounded-lg hover:bg-[#f5f5f7] text-xs border border-[#e5e5ea]"
                        >
                          <Download className="w-3 h-3 mr-1" strokeWidth={2} />
                          Импортировать
                        </Button>
                      </div>
                    </div>
                  ) : (
                    filteredData.salaries.map((salary) => (
                      <div
                        key={salary.id}
                        className="flex items-start justify-between p-3 hover:bg-[#fbfbfd] transition-colors group"
                      >
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <button
                            onClick={() => onToggleSalaryPaid(salary.id)}
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                              salary.isPaid
                                ? "bg-[#9CD5FF] border-[#9CD5FF]"
                                : "border-[#d2d2d7] hover:border-[#9CD5FF]"
                            }`}
                          >
                            {salary.isPaid && <Check className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-[#1d1d1f] mb-0.5 truncate">{salary.manager}</p>
                            <div className="flex flex-col gap-0.5 text-[10px] text-[#86868b]">
                              <span>
                                {new Date(salary.month + "-01").toLocaleDateString("ru-RU", {
                                  month: "long",
                                  year: "numeric",
                                })}
                              </span>
                              {salary.paymentSource && <span>{salary.paymentSource}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 flex-shrink-0">
                          <span className="text-xs text-[#1d1d1f] tabular-nums">
                            {Math.round(salary.amount).toLocaleString("ru-RU")} ₽
                          </span>
                          <button
                            onClick={() => {
                              if (confirm("Удалить эту запись о зарплате?")) {
                                onDeleteSalary(salary.id);
                                toast.success("Зарплата удалена");
                              }
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-[#86868b] hover:bg-[#f5f5f7] transition-all"
                          >
                            <Trash2 className="w-3 h-3" strokeWidth={1.5} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Архив */}
      {activeTab === "archive" && (
        <div className="bg-white rounded-2xl shadow-sm border border-[#e5e5ea] overflow-hidden">
          <ArchiveView 
            orders={orders}
            expenses={expenses}
            salaries={salaries}
            managersData={managersData}
          />
        </div>
      )}

      {/* Модальное окно добавления расхода */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowExpenseModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg text-[#1d1d1f]">Добавить расход</h3>
                <button
                  onClick={() => setShowExpenseModal(false)}
                  className="p-1.5 rounded-lg text-[#86868b] hover:bg-[#f5f5f7]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-[10px] text-[#86868b] mb-1.5 block uppercase tracking-wider">Дата</Label>
                  <Input
                    type="date"
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                    className="bg-[#f5f5f7] border-0 rounded-xl h-10 text-xs"
                  />
                </div>
                
                <div>
                  <Label className="text-[10px] text-[#86868b] mb-1.5 block uppercase tracking-wider">Категория</Label>
                  <div className="flex flex-wrap gap-2">
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setNewExpense({ ...newExpense, category: cat })}
                        className={`px-4 py-2 rounded-lg text-xs transition-all ${
                          newExpense.category === cat
                            ? "bg-[#9CD5FF] text-white"
                            : "bg-[#f5f5f7] text-[#86868b] hover:bg-[#e8e8ed]"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label className="text-[10px] text-[#86868b] mb-1.5 block uppercase tracking-wider">Сумма (₽)</Label>
                  <Input
                    type="number"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    placeholder="0"
                    className="bg-[#f5f5f7] border-0 rounded-xl h-10 text-xs"
                  />
                </div>
                
                <div>
                  <Label className="text-[10px] text-[#86868b] mb-1.5 block uppercase tracking-wider">Источник оплаты</Label>
                  <div className="flex flex-wrap gap-2">
                    {PAYMENT_SOURCES.map((source) => (
                      <button
                        key={source}
                        type="button"
                        onClick={() => setNewExpense({ ...newExpense, paymentSource: source })}
                        className={`px-4 py-2 rounded-lg text-xs transition-all ${
                          newExpense.paymentSource === source
                            ? "bg-[#9CD5FF] text-white"
                            : "bg-[#f5f5f7] text-[#86868b] hover:bg-[#e8e8ed]"
                        }`}
                      >
                        {source}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button
                  onClick={handleAddExpense}
                  className="flex-1 px-4 py-2.5 bg-[#9CD5FF] text-white rounded-xl hover:bg-[#C1E5FF] text-xs"
                >
                  Добавить
                </Button>
                <Button
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2.5 bg-[#f5f5f7] text-[#86868b] rounded-xl hover:bg-[#e8e8ed] text-xs"
                >
                  Отмена
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно добавления зарплаты */}
      {showSalaryModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowSalaryModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg text-[#1d1d1f]">Добавить зарплату</h3>
                <button
                  onClick={() => setShowSalaryModal(false)}
                  className="p-1.5 rounded-lg text-[#86868b] hover:bg-[#f5f5f7]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-[10px] text-[#86868b] mb-1.5 block uppercase tracking-wider">Месяц</Label>
                  <Input
                    type="month"
                    value={newSalary.month}
                    onChange={(e) => setNewSalary({ ...newSalary, month: e.target.value })}
                    className="bg-[#f5f5f7] border-0 rounded-xl h-10 text-xs"
                  />
                </div>
                
                <div>
                  <Label className="text-[10px] text-[#86868b] mb-1.5 block uppercase tracking-wider">Менеджер</Label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {managersData.map((manager) => (
                      <button
                        key={manager.name}
                        type="button"
                        onClick={() => setNewSalary({ ...newSalary, manager: manager.name, isCustomManager: false })}
                        className={`px-4 py-2 rounded-lg text-xs transition-all ${
                          !newSalary.isCustomManager && newSalary.manager === manager.name
                            ? "bg-[#9CD5FF] text-white"
                            : "bg-[#f5f5f7] text-[#86868b] hover:bg-[#e8e8ed]"
                        }`}
                      >
                        {manager.name}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setNewSalary({ ...newSalary, isCustomManager: true, customManager: "" })}
                      className={`px-4 py-2 rounded-lg text-xs transition-all ${
                        newSalary.isCustomManager
                          ? "bg-[#9CD5FF] text-white"
                          : "bg-[#f5f5f7] text-[#86868b] hover:bg-[#e8e8ed]"
                      }`}
                    >
                      Другой
                    </button>
                  </div>
                  
                  {newSalary.isCustomManager && (
                    <Input
                      type="text"
                      value={newSalary.customManager}
                      onChange={(e) => setNewSalary({ ...newSalary, customManager: e.target.value })}
                      placeholder="Введите имя (например, SMM)"
                      className="bg-[#f5f5f7] border-0 rounded-xl h-10 text-xs"
                    />
                  )}
                </div>
                
                <div>
                  <Label className="text-[10px] text-[#86868b] mb-1.5 block uppercase tracking-wider">Сумма (₽)</Label>
                  <Input
                    type="number"
                    value={newSalary.amount}
                    onChange={(e) => setNewSalary({ ...newSalary, amount: e.target.value })}
                    placeholder="0"
                    className="bg-[#f5f5f7] border-0 rounded-xl h-10 text-xs"
                  />
                </div>
                
                <div>
                  <Label className="text-[10px] text-[#86868b] mb-1.5 block uppercase tracking-wider">Источник оплаты</Label>
                  <div className="flex flex-wrap gap-2">
                    {PAYMENT_SOURCES.map((source) => (
                      <button
                        key={source}
                        type="button"
                        onClick={() => setNewSalary({ ...newSalary, paymentSource: source })}
                        className={`px-4 py-2 rounded-lg text-xs transition-all ${
                          newSalary.paymentSource === source
                            ? "bg-[#9CD5FF] text-white"
                            : "bg-[#f5f5f7] text-[#86868b] hover:bg-[#e8e8ed]"
                        }`}
                      >
                        {source}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button
                  onClick={handleAddSalary}
                  className="flex-1 px-4 py-2.5 bg-[#9CD5FF] text-white rounded-xl hover:bg-[#C1E5FF] text-xs"
                >
                  Добавить
                </Button>
                <Button
                  onClick={() => setShowSalaryModal(false)}
                  className="px-4 py-2.5 bg-[#f5f5f7] text-[#86868b] rounded-xl hover:bg-[#e8e8ed] text-xs"
                >
                  Отмена
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно импорта зарплат */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowImportModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg text-[#1d1d1f]">Импорт зарплаты</h3>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="p-1.5 rounded-lg text-[#86868b] hover:bg-[#f5f5f7]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-[10px] text-[#86868b] mb-1.5 block uppercase tracking-wider">Начальная дата</Label>
                  <Input
                    type="date"
                    value={importParams.startDate}
                    onChange={(e) => setImportParams({ ...importParams, startDate: e.target.value })}
                    className="bg-[#f5f5f7] border-0 rounded-xl h-10 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-[#86868b] mb-1.5 block uppercase tracking-wider">Конечная дата</Label>
                  <Input
                    type="date"
                    value={importParams.endDate}
                    onChange={(e) => setImportParams({ ...importParams, endDate: e.target.value })}
                    className="bg-[#f5f5f7] border-0 rounded-xl h-10 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-[#86868b] mb-1.5 block uppercase tracking-wider">Менеджер</Label>
                  <select
                    value={importParams.manager}
                    onChange={(e) => setImportParams({ ...importParams, manager: e.target.value })}
                    className="w-full h-10 px-3 bg-[#f5f5f7] border-0 rounded-xl text-xs text-[#1d1d1f]"
                  >
                    {managersData.map((manager) => (
                      <option key={manager.name} value={manager.name}>
                        {manager.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-[10px] text-[#86868b] mb-1.5 block uppercase tracking-wider">Источник оплаты</Label>
                  <select
                    value={importParams.paymentSource}
                    onChange={(e) => setImportParams({ ...importParams, paymentSource: e.target.value })}
                    className="w-full h-10 px-3 bg-[#f5f5f7] border-0 rounded-xl text-xs text-[#1d1d1f]"
                  >
                    {PAYMENT_SOURCES.map((source) => (
                      <option key={source} value={source}>
                        {source}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button
                  onClick={handleConfirmImport}
                  className="flex-1 px-4 py-2.5 bg-[#9CD5FF] text-white rounded-xl hover:bg-[#C1E5FF] text-xs"
                >
                  Импортировать
                </Button>
                <Button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2.5 bg-[#f5f5f7] text-[#86868b] rounded-xl hover:bg-[#e8e8ed] text-xs"
                >
                  Отмена
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
