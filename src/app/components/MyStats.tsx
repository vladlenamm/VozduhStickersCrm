import { useState, useMemo, useEffect } from "react";
import { Order, UserRole } from "../types/order";
import { Plus, Trash2, Calculator, Copy } from "lucide-react";

interface Expense {
  id: string;
  name: string;
  amount: number;
}

interface MyStatsProps {
  orders: Order[];
  managers: string[];
  currentUser?: UserRole; // Текущий пользователь
}

const EXPENSES_STORAGE_KEY = "sticker-crm-expenses";
const COMMISSION_STORAGE_KEY = "sticker-crm-commission";

function loadExpenses(): Expense[] {
  const stored = localStorage.getItem(EXPENSES_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveExpenses(expenses: Expense[]): void {
  localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
}

function loadCommission(): number {
  const stored = localStorage.getItem(COMMISSION_STORAGE_KEY);
  return stored ? parseFloat(stored) : 22;
}

function saveCommission(commission: number): void {
  localStorage.setItem(COMMISSION_STORAGE_KEY, commission.toString());
}

export function MyStats({ orders, managers, currentUser }: MyStatsProps) {
  const [selectedManager, setSelectedManager] = useState<string>("");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [newExpenseName, setNewExpenseName] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState("");
  const [commission, setCommission] = useState(22);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Загрузка данных при монтировании
  useEffect(() => {
    setExpenses(loadExpenses());
    const loadedCommission = loadCommission();
    setCommission(loadedCommission);
  }, []);

  // Автоматический выбор менеджера для сотрудников
  useEffect(() => {
    if (currentUser && (currentUser === "Софа" || currentUser === "Лена")) {
      setSelectedManager(currentUser);
    }
  }, [currentUser]);

  // Фильтрация заказов по выбранному менеджеру и датам
  const filteredOrders = useMemo(() => {
    if (!selectedManager) return [];
    
    let filtered = orders.filter(order => order.manager === selectedManager);
    
    // Применяем фильтр по датам
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter(order => new Date(order.orderDate) >= start);
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(order => new Date(order.orderDate) <= end);
    }
    
    return filtered;
  }, [orders, selectedManager, startDate, endDate]);

  // Подсчет статистики
  const stats = useMemo(() => {
    const processedDuplicates = new Set<string>();
    let totalRevenue = 0;
    let paidRevenue = 0;
    let unpaidRevenue = 0;
    let totalOrders = 0;
    let paidOrders = 0;

    filteredOrders.forEach(order => {
      // Для дублированных заказов считаем только их часть
      if (order.duplicateGroupId) {
        // Просто берем цену текущего заказа (это уже часть менеджера)
        totalRevenue += order.price;
        if (order.isPaid) {
          paidRevenue += order.price;
        } else {
          unpaidRevenue += order.price;
        }
      } else {
        totalRevenue += order.price;
        if (order.isPaid) {
          paidRevenue += order.price;
        } else {
          unpaidRevenue += order.price;
        }
      }

      // Для подсчета количества заказов учитываем дубликаты как один
      if (order.duplicateGroupId) {
        if (!processedDuplicates.has(order.duplicateGroupId)) {
          processedDuplicates.add(order.duplicateGroupId);
          totalOrders += 1;
          if (order.isPaid) paidOrders += 1;
        }
      } else {
        totalOrders += 1;
        if (order.isPaid) paidOrders += 1;
      }
    });

    const salary = (totalRevenue * commission) / 100;
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalIncome = salary + totalExpenses;

    return {
      totalRevenue,
      paidRevenue,
      unpaidRevenue,
      totalOrders,
      paidOrders,
      unpaidOrders: totalOrders - paidOrders,
      salary,
      totalExpenses,
      totalIncome,
    };
  }, [filteredOrders, commission, expenses]);

  const handleAddExpense = () => {
    if (!newExpenseName.trim() || !newExpenseAmount) return;

    const amount = parseFloat(newExpenseAmount);
    if (isNaN(amount) || amount <= 0) return;

    const newExpense: Expense = {
      id: `expense_${Date.now()}`,
      name: newExpenseName.trim(),
      amount,
    };

    const updatedExpenses = [...expenses, newExpense];
    setExpenses(updatedExpenses);
    saveExpenses(updatedExpenses);

    setNewExpenseName("");
    setNewExpenseAmount("");
  };

  const handleDeleteExpense = (id: string) => {
    const updatedExpenses = expenses.filter(exp => exp.id !== id);
    setExpenses(updatedExpenses);
    saveExpenses(updatedExpenses);
  };

  const handleCommissionChange = (value: string) => {
    const newCommission = parseFloat(value);
    if (!isNaN(newCommission) && newCommission >= 0 && newCommission <= 100) {
      setCommission(newCommission);
      saveCommission(newCommission);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="max-w-[1600px] mx-auto space-y-3">
          {/* Компактный заголовок */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-normal text-[#1d1d1f] tracking-tight">
              {currentUser === "Софа" || currentUser === "Лена" ? "Зарплата" : "Менеджеры"}
            </h1>
            {selectedManager && (
              <span className="text-xs text-[#86868b] uppercase tracking-wider">
                {filteredOrders.length} {filteredOrders.length === 1 ? 'заказ' : filteredOrders.length < 5 ? 'заказа' : 'заказов'}
              </span>
            )}
          </div>

          {/* Настройки - менеджер, даты, комиссия в одной карточке */}
          <div className="bg-[#f5f5f7] rounded-[12px] p-3">
            <div className={`grid grid-cols-1 gap-2 ${currentUser === "Менеджер" ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
              {/* Менеджер - только для роли Менеджер */}
              {currentUser === "Менеджер" && (
                <div>
                  <label className="block text-[10px] font-normal text-[#86868b] uppercase tracking-wider mb-1.5">
                    Менеджер
                  </label>
                  <select
                    value={selectedManager}
                    onChange={(e) => setSelectedManager(e.target.value)}
                    className="w-full px-3 py-2 border-0 rounded-[8px] text-sm bg-white text-[#1d1d1f] focus:ring-1 focus:ring-[#9CD5FF]"
                  >
                    <option value="">Выберите</option>
                    {managers.map(manager => (
                      <option key={manager} value={manager}>{manager}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Дата от */}
              <div>
                <label className="block text-[10px] font-normal text-[#86868b] uppercase tracking-wider mb-1.5">
                  Дата от
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border-0 rounded-[8px] text-sm bg-white text-[#1d1d1f] focus:ring-1 focus:ring-[#9CD5FF]"
                />
              </div>

              {/* Дата до */}
              <div>
                <label className="block text-[10px] font-normal text-[#86868b] uppercase tracking-wider mb-1.5">
                  Дата до
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border-0 rounded-[8px] text-sm bg-white text-[#1d1d1f] focus:ring-1 focus:ring-[#9CD5FF]"
                />
              </div>
            </div>

            {/* Кнопка сброса фильтров */}
            {(startDate || endDate) && (
              <div className="mt-2">
                <button
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="text-xs text-[#86868b] hover:text-[#1d1d1f] transition-colors"
                >
                  Сбросить фильтры
                </button>
              </div>
            )}
          </div>

          {selectedManager ? (
            <>
              {/* KPI метрики - 4 компактные карточки */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {/* Заказов */}
                <div className="bg-white border border-[#d2d2d7]/30 rounded-[12px] p-3 shadow-sm">
                  <div className="text-[10px] text-[#86868b] uppercase tracking-wider mb-1.5">
                    Заказов
                  </div>
                  <div className="text-xl font-normal text-[#1d1d1f] leading-tight">
                    {stats.totalOrders}
                  </div>
                </div>

                {/* Выручка */}
                <div className="bg-white border border-[#d2d2d7]/30 rounded-[12px] p-3 shadow-sm">
                  <div className="text-[10px] text-[#86868b] uppercase tracking-wider mb-1.5">
                    Выручка
                  </div>
                  <div className="text-xl font-normal text-[#1d1d1f] leading-tight">
                    {stats.totalRevenue.toLocaleString('ru-RU')} ₽
                  </div>
                </div>

                {/* Зарплата */}
                <div className="bg-white border border-[#d2d2d7]/30 rounded-[12px] p-3 shadow-sm">
                  <div className="text-[10px] text-[#86868b] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Calculator className="w-3 h-3" strokeWidth={1.5} />
                    Зарплата
                  </div>
                  <div className="text-xl font-normal text-[#1d1d1f] leading-tight">
                    {stats.salary.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                  </div>
                </div>

                {/* Итоговый доход */}
                <div className="bg-[#9CD5FF] border border-[#9CD5FF] rounded-[12px] p-3 shadow-sm">
                  <div className="text-[10px] text-white/80 uppercase tracking-wider mb-1.5">
                    Итого
                  </div>
                  <div className="text-xl font-normal text-white leading-tight">
                    {stats.totalIncome.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                  </div>
                </div>
              </div>

              {/* Расходы */}
              <div className="bg-white border border-[#d2d2d7]/30 rounded-[12px] p-3 shadow-sm">
                <div className="text-sm font-normal text-[#1d1d1f] mb-3">Расходы</div>
                
                {/* Форма добавления расхода */}
                <div className="space-y-2 mb-3">
                  <input
                    type="text"
                    placeholder="Название расхода"
                    value={newExpenseName}
                    onChange={(e) => setNewExpenseName(e.target.value)}
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
                {expenses.length > 0 ? (
                  <div className="space-y-1.5">
                    {expenses.map(expense => (
                      <div
                        key={expense.id}
                        className="flex items-center justify-between p-2 rounded-[8px] bg-[#f5f5f7] hover:bg-[#e8e8ed] transition-colors"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-normal text-[#1d1d1f]">{expense.name}</p>
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
                    
                    {/* Итого расходов */}
                    <div className="pt-2 mt-2 border-t border-[#d2d2d7]/30">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-normal text-[#86868b]">Итого:</span>
                        <span className="text-base font-normal text-[#1d1d1f]">
                          {stats.totalExpenses.toLocaleString('ru-RU')} ₽
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#86868b] text-center py-6">
                    Нет расходов
                  </p>
                )}
              </div>

              {/* Список заказов - полная ширина */}
              <div className="bg-white border border-[#d2d2d7]/30 rounded-[12px] p-3 shadow-sm">
                <div className="text-sm font-normal text-[#1d1d1f] mb-3">Заказы</div>

                {filteredOrders.length > 0 ? (
                  <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
                    {filteredOrders
                      .sort((a, b) => b.orderDate - a.orderDate)
                      .map((order, index) => {
                        const orderNumber = index + 1;
                        const orderIncome = (order.price * commission) / 100;
                        
                        return (
                          <div
                            key={order.id}
                            className="p-2 rounded-[8px] bg-[#f5f5f7] hover:bg-[#e8e8ed] transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className="text-[9px] font-normal text-[#86868b] bg-white px-1.5 py-0.5 rounded">
                                    #{orderNumber}
                                  </span>
                                  <h3 className="text-sm font-normal text-[#1d1d1f] truncate">
                                    {order.clientName}
                                  </h3>
                                  {order.duplicateGroupId && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-normal bg-[#C1E5FF] text-white flex-shrink-0">
                                      <Copy className="w-2 h-2" strokeWidth={2} />
                                      Double
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-[#86868b]">
                                  <span className="truncate">{order.title}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[9px] text-[#86868b] mt-0.5">
                                  <span>
                                    {new Date(order.orderDate).toLocaleDateString('ru-RU', {
                                      day: '2-digit',
                                      month: '2-digit',
                                    })}
                                  </span>
                                  <span>•</span>
                                  <span className={order.isPaid ? 'text-[#34C759]' : 'text-[#FF9500]'}>
                                    {order.isPaid ? '✓ Оплачен' : '⏳ Ожидает'}
                                  </span>
                                </div>
                              </div>
                              <div className="flex-shrink-0 text-right">
                                <p className="text-sm font-normal text-[#1d1d1f]">
                                  {order.price.toLocaleString('ru-RU')} ₽
                                </p>
                                <p className="text-[10px] text-[#86868b]">
                                  {orderIncome.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <p className="text-xs text-[#86868b] text-center py-6">
                    {startDate || endDate ? 'Нет заказов за период' : 'Нет заказов'}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white border border-[#d2d2d7]/30 rounded-[12px] p-12 text-center shadow-sm">
              <Calculator className="w-12 h-12 text-[#86868b]/40 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-sm text-[#86868b]">Выберите менеджера для просмотра показателей</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}