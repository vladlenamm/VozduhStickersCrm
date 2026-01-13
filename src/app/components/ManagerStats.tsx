import { useState, useEffect } from "react";
import { Order } from "../types/order";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Plus, Trash2, Calculator } from "lucide-react";

interface Expense {
  id: string;
  title: string;
  amount: number;
}

interface ManagerStatsProps {
  orders: Order[];
  currentManager: string;
}

const EXPENSES_STORAGE_KEY = "sticker-crm-manager-expenses";
const SALARY_RATE_STORAGE_KEY = "sticker-crm-salary-rate";

function loadExpenses(): Record<string, Expense[]> {
  const stored = localStorage.getItem(EXPENSES_STORAGE_KEY);
  return stored ? JSON.parse(stored) : {};
}

function saveExpenses(expenses: Record<string, Expense[]>): void {
  localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
}

function loadSalaryRate(): number {
  const stored = localStorage.getItem(SALARY_RATE_STORAGE_KEY);
  return stored ? parseFloat(stored) : 22;
}

function saveSalaryRate(rate: number): void {
  localStorage.setItem(SALARY_RATE_STORAGE_KEY, rate.toString());
}

export function ManagerStats({ orders, currentManager }: ManagerStatsProps) {
  const [selectedManager, setSelectedManager] = useState<string>(currentManager);
  const [salaryRate, setSalaryRate] = useState<number>(22);
  const [expenses, setExpenses] = useState<Record<string, Expense[]>>({});
  const [newExpenseTitle, setNewExpenseTitle] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState("");

  // Загрузка данных при монтировании
  useEffect(() => {
    setExpenses(loadExpenses());
    setSalaryRate(loadSalaryRate());
  }, []);

  // Фильтруем заказы выбранного менеджера
  const managerOrders = orders.filter(order => order.manager === selectedManager);
  
  // Группируем дублированные заказы для корректного подсчета
  const processedDuplicates = new Set<string>();
  let totalRevenue = 0;

  managerOrders.forEach(order => {
    if (order.duplicateGroupId) {
      if (!processedDuplicates.has(order.duplicateGroupId)) {
        // Для дублированных заказов берем только сумму текущего менеджера
        totalRevenue += order.price;
        processedDuplicates.add(order.duplicateGroupId);
      }
    } else {
      totalRevenue += order.price;
    }
  });

  // Подсчет заработной платы
  const salary = (totalRevenue * salaryRate) / 100;

  // Расходы текущего менеджера
  const managerExpenses = expenses[selectedManager] || [];
  const totalExpenses = managerExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Итого к выплате
  const totalPayout = salary + totalExpenses;

  // Количество заказов (без дублей)
  const uniqueOrders = new Set<string>();
  managerOrders.forEach(order => {
    if (order.duplicateGroupId) {
      uniqueOrders.add(order.duplicateGroupId);
    } else {
      uniqueOrders.add(order.id);
    }
  });
  const ordersCount = uniqueOrders.size;

  const handleAddExpense = () => {
    if (!newExpenseTitle.trim() || !newExpenseAmount) return;

    const amount = parseFloat(newExpenseAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Введите корректную сумму расхода");
      return;
    }

    const newExpense: Expense = {
      id: `expense_${Date.now()}_${Math.random()}`,
      title: newExpenseTitle.trim(),
      amount: amount,
    };

    const updatedExpenses = {
      ...expenses,
      [selectedManager]: [...(expenses[selectedManager] || []), newExpense],
    };

    setExpenses(updatedExpenses);
    saveExpenses(updatedExpenses);
    setNewExpenseTitle("");
    setNewExpenseAmount("");
  };

  const handleDeleteExpense = (expenseId: string) => {
    const updatedExpenses = {
      ...expenses,
      [selectedManager]: (expenses[selectedManager] || []).filter(
        (exp) => exp.id !== expenseId
      ),
    };

    setExpenses(updatedExpenses);
    saveExpenses(updatedExpenses);
  };

  const handleSalaryRateChange = (newRate: string) => {
    const rate = parseFloat(newRate);
    if (!isNaN(rate) && rate >= 0 && rate <= 100) {
      setSalaryRate(rate);
      saveSalaryRate(rate);
    }
  };

  // Получаем список всех менеджеров из заказов
  const allManagers = Array.from(new Set(orders.map(o => o.manager).filter(Boolean)));

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="max-w-[1200px] mx-auto space-y-3">
          {/* Компактный заголовок */}
          <div>
            <h1 className="text-2xl font-normal text-[#1d1d1f] tracking-tight">Моя статистика</h1>
            <p className="text-xs text-[#86868b] mt-0.5">
              Расчет заработной платы и учет расходов
            </p>
          </div>

          {/* Выбор менеджера и процент - в одну строку */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Выбор менеджера */}
            <div className="bg-[#f5f5f7] rounded-[12px] p-3">
              <label className="block text-[10px] font-normal text-[#86868b] uppercase tracking-wider mb-1.5">
                Менеджер
              </label>
              <select
                value={selectedManager}
                onChange={(e) => setSelectedManager(e.target.value)}
                className="w-full px-3 py-2 border-0 rounded-[8px] text-sm bg-white text-[#1d1d1f] focus:ring-1 focus:ring-[#9CD5FF]"
              >
                {allManagers.map((manager) => (
                  <option key={manager} value={manager}>
                    {manager}
                  </option>
                ))}
              </select>
            </div>

            {/* Процент */}
            <div className="bg-[#f5f5f7] rounded-[12px] p-3">
              <label className="block text-[10px] font-normal text-[#86868b] uppercase tracking-wider mb-1.5">
                Процент от заказов (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={salaryRate}
                onChange={(e) => handleSalaryRateChange(e.target.value)}
                className="w-full px-3 py-2 border-0 rounded-[8px] text-sm bg-white text-[#1d1d1f] focus:ring-1 focus:ring-[#9CD5FF]"
              />
            </div>
          </div>

          {/* KPI метрики - 4 компактные карточки */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {/* Заказов */}
            <div className="bg-white border border-[#d2d2d7]/30 rounded-[12px] p-3 shadow-sm">
              <div className="text-[10px] text-[#86868b] uppercase tracking-wider mb-1.5">
                Заказов
              </div>
              <div className="text-xl font-normal text-[#1d1d1f] leading-tight">
                {ordersCount}
              </div>
            </div>

            {/* Выручка */}
            <div className="bg-white border border-[#d2d2d7]/30 rounded-[12px] p-3 shadow-sm">
              <div className="text-[10px] text-[#86868b] uppercase tracking-wider mb-1.5">
                Выручка
              </div>
              <div className="text-xl font-normal text-[#1d1d1f] leading-tight">
                {totalRevenue.toLocaleString('ru-RU')} ₽
              </div>
            </div>

            {/* Зарплата */}
            <div className="bg-white border border-[#d2d2d7]/30 rounded-[12px] p-3 shadow-sm">
              <div className="text-[10px] text-[#86868b] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Calculator className="w-3 h-3" strokeWidth={1.5} />
                Зарплата
              </div>
              <div className="text-xl font-normal text-[#1d1d1f] leading-tight">
                {salary.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
              </div>
            </div>

            {/* Итоговый доход */}
            <div className="bg-[#9CD5FF] border border-[#9CD5FF] rounded-[12px] p-3 shadow-sm">
              <div className="text-[10px] text-white/80 uppercase tracking-wider mb-1.5">
                Итоговый доход
              </div>
              <div className="text-xl font-normal text-white leading-tight">
                {totalPayout.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
              </div>
            </div>
          </div>

          {/* Расходы - компактная карточка */}
          <div className="bg-white border border-[#d2d2d7]/30 rounded-[12px] p-3 shadow-sm">
            <div className="text-sm font-normal text-[#1d1d1f] mb-3">Дополнительные расходы</div>
            
            {/* Форма добавления расхода - компактная */}
            <div className="space-y-2 mb-3">
              <input
                type="text"
                placeholder="Название расхода"
                value={newExpenseTitle}
                onChange={(e) => setNewExpenseTitle(e.target.value)}
                className="w-full px-3 py-2 border-0 bg-[#f5f5f7] rounded-[8px] text-sm text-[#1d1d1f] placeholder:text-[#86868b] focus:ring-1 focus:ring-[#9CD5FF]"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Сумма"
                  value={newExpenseAmount}
                  onChange={(e) => setNewExpenseAmount(e.target.value)}
                  className="flex-1 px-3 py-2 border-0 bg-[#f5f5f7] rounded-[8px] text-sm text-[#1d1d1f] placeholder:text-[#86868b] focus:ring-1 focus:ring-[#9CD5FF]"
                />
                <button
                  onClick={handleAddExpense}
                  className="px-3 py-2 bg-[#9CD5FF] text-white rounded-[8px] hover:bg-[#C1E5FF] transition-colors inline-flex items-center gap-1.5 text-sm font-normal"
                >
                  <Plus className="w-4 h-4" strokeWidth={1.5} />
                  Добавить
                </button>
              </div>
            </div>

            {/* Список расходов */}
            {managerExpenses.length > 0 ? (
              <div className="space-y-1.5 mt-3">
                {managerExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-2 rounded-[8px] bg-[#f5f5f7] hover:bg-[#e8e8ed] transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-normal text-[#1d1d1f]">{expense.title}</p>
                      <p className="text-xs text-[#86868b]">
                        {expense.amount.toLocaleString('ru-RU')} ₽
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      className="p-1.5 rounded-[6px] text-[#86868b] hover:bg-[#d2d2d7] transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#86868b] text-center py-4">
                Нет расходов
              </p>
            )}

            {/* Итого расходы */}
            {managerExpenses.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[#d2d2d7]/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-normal text-[#86868b]">Итого расходы:</span>
                  <span className="text-base font-normal text-[#1d1d1f]">
                    {totalExpenses.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Итого к выплате - компактная акцентная карточка */}
          <div className="bg-[#1d1d1f] rounded-[12px] p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-white/60 uppercase tracking-wider mb-1">Итого к выплате</p>
                <p className="text-2xl font-normal text-white leading-tight">
                  {totalPayout.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                </p>
              </div>
              <div className="text-right text-xs text-white/60">
                <p>Зарплата: {salary.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽</p>
                <p>Расходы: {totalExpenses.toLocaleString('ru-RU')} ₽</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
