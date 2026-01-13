import { useState, useEffect } from "react";
import { Order } from "../types/order";
import { Expense, Salary, MonthlyArchive } from "../types/finance";
import { ManagerData } from "../types/manager";
import { Calendar, TrendingUp, TrendingDown, Users, Wallet, ChevronLeft, Save, Archive } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";

interface ArchiveViewProps {
  orders: Order[];
  expenses: Expense[];
  salaries: Salary[];
  managersData: ManagerData[];
}

export function ArchiveView({ orders, expenses, salaries, managersData }: ArchiveViewProps) {
  const [archives, setArchives] = useState<MonthlyArchive[]>([]);
  const [selectedArchive, setSelectedArchive] = useState<MonthlyArchive | null>(null);

  // Загрузка архивов из localStorage
  useEffect(() => {
    const savedArchives = localStorage.getItem("monthly_archives");
    if (savedArchives) {
      try {
        setArchives(JSON.parse(savedArchives));
      } catch (e) {
        console.error("Failed to load archives", e);
      }
    }
  }, []);

  // Функция для закрытия текущего месяца и создания архива
  const closeCurrentMonth = () => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    
    // Проверяем, не закрыт ли уже этот месяц
    if (archives.some(a => a.month === currentMonth)) {
      toast.error("Этот месяц уже закрыт");
      return;
    }

    // Фильтруем данные текущего месяца
    const monthOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      const orderMonth = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, "0")}`;
      return orderMonth === currentMonth;
    });

    const monthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const expenseMonth = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, "0")}`;
      return expenseMonth === currentMonth;
    });

    const monthSalaries = salaries.filter(salary => salary.month === currentMonth);

    // Рассчитываем статистику
    const stats = calculateStats(monthOrders, monthExpenses, monthSalaries, managersData);

    // Создаем архив
    const newArchive: MonthlyArchive = {
      month: currentMonth,
      closedAt: Date.now(),
      stats,
      overrides: JSON.parse(localStorage.getItem(`finance_overrides_${currentMonth}`) || "{}"),
      ordersCount: monthOrders.length,
      expensesCount: monthExpenses.length,
      salariesCount: monthSalaries.length,
    };

    // Сохраняем архив
    const updatedArchives = [...archives, newArchive].sort((a, b) => b.month.localeCompare(a.month));
    setArchives(updatedArchives);
    localStorage.setItem("monthly_archives", JSON.stringify(updatedArchives));
    
    toast.success(`Месяц ${formatMonthName(currentMonth)} закрыт и добавлен в архив`);
  };

  // Вычисление статистики
  const calculateStats = (
    orders: Order[],
    expenses: Expense[],
    salaries: Salary[],
    managersData: ManagerData[]
  ) => {
    // Выручка по источникам
    const revenueByCard = orders
      .filter(o => o.paymentType === "Карта" && o.status === "Готово")
      .reduce((sum, o) => sum + o.amount, 0);
    
    const revenueByTerminal = orders
      .filter(o => o.paymentType === "Терминал" && o.status === "Готово")
      .reduce((sum, o) => sum + o.amount, 0);
    
    const revenueByRS = orders
      .filter(o => o.paymentType === "Расчетный счет" && o.status === "Готово")
      .reduce((sum, o) => sum + o.amount, 0);
    
    const revenueByCash = orders
      .filter(o => o.paymentType === "Наличные" && o.status === "Готово")
      .reduce((sum, o) => sum + o.amount, 0);

    // Расходы по источникам
    const expensesByCard = expenses
      .filter(e => e.paymentSource === "Карта")
      .reduce((sum, e) => sum + e.amount, 0);
    
    const expensesByTerminal = expenses
      .filter(e => e.paymentSource === "Терминал")
      .reduce((sum, e) => sum + e.amount, 0);
    
    const expensesByRS = expenses
      .filter(e => e.paymentSource === "Расчетный счет")
      .reduce((sum, e) => sum + e.amount, 0);
    
    const expensesByCash = expenses
      .filter(e => e.paymentSource === "Наличные")
      .reduce((sum, e) => sum + e.amount, 0);

    // Зарплаты по источникам
    const salariesByCard = salaries
      .filter(s => s.isPaid && s.paymentSource === "Карта")
      .reduce((sum, s) => sum + s.amount, 0);
    
    const salariesByTerminal = salaries
      .filter(s => s.isPaid && s.paymentSource === "Терминал")
      .reduce((sum, s) => sum + s.amount, 0);
    
    const salariesByRS = salaries
      .filter(s => s.isPaid && s.paymentSource === "Расчетный счет")
      .reduce((sum, s) => sum + s.amount, 0);
    
    const salariesByCash = salaries
      .filter(s => s.isPaid && s.paymentSource === "Наличные")
      .reduce((sum, s) => sum + s.amount, 0);

    // Касса по источникам (сохраненные данные из localStorage)
    const cashReserveData = JSON.parse(localStorage.getItem("cash_reserve_breakdown") || '{"card":0,"terminal":0,"rs":0,"cash":0}');

    const totalRevenue = revenueByCard + revenueByTerminal + revenueByRS + revenueByCash;
    const totalExpenses = expensesByCard + expensesByTerminal + expensesByRS + expensesByCash;
    const totalSalaries = salariesByCard + salariesByTerminal + salariesByRS + salariesByCash;
    const netProfit = totalRevenue - totalExpenses - totalSalaries;

    return {
      totalRevenue,
      totalExpenses,
      totalSalaries,
      netProfit,
      revenueByCard,
      revenueByTerminal,
      revenueByRS,
      revenueByCash,
      expensesByCard,
      expensesByTerminal,
      expensesByRS,
      expensesByCash,
      salariesByCard,
      salariesByTerminal,
      salariesByRS,
      salariesByCash,
      cashReserveByCard: cashReserveData.card,
      cashReserveByTerminal: cashReserveData.terminal,
      cashReserveByRS: cashReserveData.rs,
      cashReserveByCash: cashReserveData.cash,
    };
  };

  // Форматирование названия месяца
  const formatMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("ru-RU", { year: "numeric", month: "long" });
  };

  // Если выбран архив, показываем детальную информацию
  if (selectedArchive) {
    return (
      <div className="p-6">
        {/* Заголовок */}
        <div className="mb-6">
          <button
            onClick={() => setSelectedArchive(null)}
            className="flex items-center gap-2 text-[#86868b] hover:text-[#1d1d1f] text-sm font-normal mb-4 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
            Назад к списку
          </button>
          <h2 className="text-2xl font-light text-[#1d1d1f] tracking-tight">
            {formatMonthName(selectedArchive.month)}
          </h2>
          <p className="text-sm text-[#86868b] mt-1">
            Закрыт {new Date(selectedArchive.closedAt).toLocaleDateString("ru-RU")}
          </p>
        </div>

        {/* Метрики */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-[20px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 rounded-[12px] bg-[#f5f5f7]">
                <TrendingUp className="w-5 h-5 text-[#1d1d1f]" strokeWidth={1.5} />
              </div>
            </div>
            <p className="text-xs font-normal text-[#86868b] uppercase tracking-wider mb-2">Выручка</p>
            <p className="text-3xl font-light text-[#1d1d1f] tracking-tight">
              {Math.round(selectedArchive.stats.totalRevenue).toLocaleString("ru-RU")} ₽
            </p>
          </div>

          <div className="bg-white rounded-[20px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 rounded-[12px] bg-[#f5f5f7]">
                <TrendingDown className="w-5 h-5 text-[#86868b]" strokeWidth={1.5} />
              </div>
            </div>
            <p className="text-xs font-normal text-[#86868b] uppercase tracking-wider mb-2">Расходы</p>
            <p className="text-3xl font-light text-[#1d1d1f] tracking-tight">
              {Math.round(selectedArchive.stats.totalExpenses).toLocaleString("ru-RU")} ₽
            </p>
          </div>

          <div className="bg-white rounded-[20px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 rounded-[12px] bg-[#f5f5f7]">
                <Users className="w-5 h-5 text-[#86868b]" strokeWidth={1.5} />
              </div>
            </div>
            <p className="text-xs font-normal text-[#86868b] uppercase tracking-wider mb-2">Зарплаты</p>
            <p className="text-3xl font-light text-[#1d1d1f] tracking-tight">
              {Math.round(selectedArchive.stats.totalSalaries).toLocaleString("ru-RU")} ₽
            </p>
          </div>

          <div className="bg-white rounded-[20px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 rounded-[12px] bg-[#f5f5f7]">
                <Wallet className="w-5 h-5 text-[#1d1d1f]" strokeWidth={1.5} />
              </div>
            </div>
            <p className="text-xs font-normal text-[#86868b] uppercase tracking-wider mb-2">Чистая прибыль</p>
            <p className="text-3xl font-light text-[#1d1d1f] tracking-tight">
              {Math.round(selectedArchive.stats.netProfit).toLocaleString("ru-RU")} ₽
            </p>
          </div>
        </div>

        {/* Финансовый калькулятор */}
        <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#d2d2d7]/20">
                  <th className="py-4 pl-6 pr-4 text-left text-xs font-normal text-[#86868b] uppercase tracking-wider">
                    Статья
                  </th>
                  <th className="py-4 px-4 text-right text-xs font-normal text-[#86868b] uppercase tracking-wider">
                    Карта
                  </th>
                  <th className="py-4 px-4 text-right text-xs font-normal text-[#86868b] uppercase tracking-wider">
                    Терминал
                  </th>
                  <th className="py-4 px-4 text-right text-xs font-normal text-[#86868b] uppercase tracking-wider">
                    РС
                  </th>
                  <th className="py-4 px-4 text-right text-xs font-normal text-[#86868b] uppercase tracking-wider">
                    Наличные
                  </th>
                  <th className="py-4 pl-4 pr-6 text-right text-xs font-normal text-[#86868b] uppercase tracking-wider">
                    Итого
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d2d2d7]/10">
                {/* Выручка */}
                <tr className="hover:bg-[#fbfbfd] transition-colors">
                  <td className="py-4 pl-6 pr-4 text-sm font-normal text-[#1d1d1f]">Выручка</td>
                  <td className="py-4 px-4 text-right text-sm text-[#86868b]">
                    {Math.round(selectedArchive.stats.revenueByCard).toLocaleString("ru-RU")} ₽
                  </td>
                  <td className="py-4 px-4 text-right text-sm text-[#86868b]">
                    {Math.round(selectedArchive.stats.revenueByTerminal).toLocaleString("ru-RU")} ₽
                  </td>
                  <td className="py-4 px-4 text-right text-sm text-[#86868b]">
                    {Math.round(selectedArchive.stats.revenueByRS).toLocaleString("ru-RU")} ₽
                  </td>
                  <td className="py-4 px-4 text-right text-sm text-[#86868b]">
                    {Math.round(selectedArchive.stats.revenueByCash).toLocaleString("ru-RU")} ₽
                  </td>
                  <td className="py-4 pl-4 pr-6 text-right text-sm font-normal text-[#1d1d1f]">
                    {Math.round(selectedArchive.stats.totalRevenue).toLocaleString("ru-RU")} ₽
                  </td>
                </tr>

                {/* Расходы */}
                <tr className="hover:bg-[#fbfbfd] transition-colors">
                  <td className="py-4 pl-6 pr-4 text-sm font-normal text-[#1d1d1f]">Расходы</td>
                  <td className="py-4 px-4 text-right text-sm text-[#86868b]">
                    {Math.round(selectedArchive.stats.expensesByCard).toLocaleString("ru-RU")} ₽
                  </td>
                  <td className="py-4 px-4 text-right text-sm text-[#86868b]">
                    {Math.round(selectedArchive.stats.expensesByTerminal).toLocaleString("ru-RU")} ₽
                  </td>
                  <td className="py-4 px-4 text-right text-sm text-[#86868b]">
                    {Math.round(selectedArchive.stats.expensesByRS).toLocaleString("ru-RU")} ₽
                  </td>
                  <td className="py-4 px-4 text-right text-sm text-[#86868b]">
                    {Math.round(selectedArchive.stats.expensesByCash).toLocaleString("ru-RU")} ₽
                  </td>
                  <td className="py-4 pl-4 pr-6 text-right text-sm font-normal text-[#1d1d1f]">
                    {Math.round(selectedArchive.stats.totalExpenses).toLocaleString("ru-RU")} ₽
                  </td>
                </tr>

                {/* Зарплаты */}
                <tr className="hover:bg-[#fbfbfd] transition-colors">
                  <td className="py-4 pl-6 pr-4 text-sm font-normal text-[#1d1d1f]">Зарплаты</td>
                  <td className="py-4 px-4 text-right text-sm text-[#86868b]">
                    {Math.round(selectedArchive.stats.salariesByCard).toLocaleString("ru-RU")} ₽
                  </td>
                  <td className="py-4 px-4 text-right text-sm text-[#86868b]">
                    {Math.round(selectedArchive.stats.salariesByTerminal).toLocaleString("ru-RU")} ₽
                  </td>
                  <td className="py-4 px-4 text-right text-sm text-[#86868b]">
                    {Math.round(selectedArchive.stats.salariesByRS).toLocaleString("ru-RU")} ₽
                  </td>
                  <td className="py-4 px-4 text-right text-sm text-[#86868b]">
                    {Math.round(selectedArchive.stats.salariesByCash).toLocaleString("ru-RU")} ₽
                  </td>
                  <td className="py-4 pl-4 pr-6 text-right text-sm font-normal text-[#1d1d1f]">
                    {Math.round(selectedArchive.stats.totalSalaries).toLocaleString("ru-RU")} ₽
                  </td>
                </tr>

                {/* Касса */}
                <tr className="hover:bg-[#fbfbfd] transition-colors">
                  <td className="py-4 pl-6 pr-4 text-sm font-normal text-[#1d1d1f]">Касса</td>
                  <td className="py-4 px-4 text-right text-sm text-[#86868b]">
                    {Math.round(selectedArchive.stats.cashReserveByCard).toLocaleString("ru-RU")} ₽
                  </td>
                  <td className="py-4 px-4 text-right text-sm text-[#86868b]">
                    {Math.round(selectedArchive.stats.cashReserveByTerminal).toLocaleString("ru-RU")} ₽
                  </td>
                  <td className="py-4 px-4 text-right text-sm text-[#86868b]">
                    {Math.round(selectedArchive.stats.cashReserveByRS).toLocaleString("ru-RU")} ₽
                  </td>
                  <td className="py-4 px-4 text-right text-sm text-[#86868b]">
                    {Math.round(selectedArchive.stats.cashReserveByCash).toLocaleString("ru-RU")} ₽
                  </td>
                  <td className="py-4 pl-4 pr-6 text-right text-sm font-normal text-[#1d1d1f]">
                    {Math.round(
                      selectedArchive.stats.cashReserveByCard +
                      selectedArchive.stats.cashReserveByTerminal +
                      selectedArchive.stats.cashReserveByRS +
                      selectedArchive.stats.cashReserveByCash
                    ).toLocaleString("ru-RU")} ₽
                  </td>
                </tr>

                {/* Прибыль */}
                <tr className="bg-[#f5f5f7]/50">
                  <td className="py-5 pl-6 pr-4 text-base font-normal text-[#1d1d1f]">Прибыль</td>
                  <td className="py-5 px-4 text-right text-base font-normal text-[#1d1d1f]">
                    {Math.round(
                      selectedArchive.stats.revenueByCard -
                      selectedArchive.stats.expensesByCard -
                      selectedArchive.stats.salariesByCard -
                      selectedArchive.stats.cashReserveByCard
                    ).toLocaleString("ru-RU")} ₽
                  </td>
                  <td className="py-5 px-4 text-right text-base font-normal text-[#1d1d1f]">
                    {Math.round(
                      selectedArchive.stats.revenueByTerminal -
                      selectedArchive.stats.expensesByTerminal -
                      selectedArchive.stats.salariesByTerminal -
                      selectedArchive.stats.cashReserveByTerminal
                    ).toLocaleString("ru-RU")} ₽
                  </td>
                  <td className="py-5 px-4 text-right text-base font-normal text-[#1d1d1f]">
                    {Math.round(
                      selectedArchive.stats.revenueByRS -
                      selectedArchive.stats.expensesByRS -
                      selectedArchive.stats.salariesByRS -
                      selectedArchive.stats.cashReserveByRS
                    ).toLocaleString("ru-RU")} ₽
                  </td>
                  <td className="py-5 px-4 text-right text-base font-normal text-[#1d1d1f]">
                    {Math.round(
                      selectedArchive.stats.revenueByCash -
                      selectedArchive.stats.expensesByCash -
                      selectedArchive.stats.salariesByCash -
                      selectedArchive.stats.cashReserveByCash
                    ).toLocaleString("ru-RU")} ₽
                  </td>
                  <td className="py-5 pl-4 pr-6 text-right text-base font-normal text-[#1d1d1f]">
                    {Math.round(selectedArchive.stats.netProfit).toLocaleString("ru-RU")} ₽
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Дополнительная информация */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white rounded-[16px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <p className="text-xs font-normal text-[#86868b] uppercase tracking-wider mb-2">Заказов</p>
            <p className="text-2xl font-light text-[#1d1d1f]">{selectedArchive.ordersCount}</p>
          </div>
          <div className="bg-white rounded-[16px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <p className="text-xs font-normal text-[#86868b] uppercase tracking-wider mb-2">Расходов</p>
            <p className="text-2xl font-light text-[#1d1d1f]">{selectedArchive.expensesCount}</p>
          </div>
          <div className="bg-white rounded-[16px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <p className="text-xs font-normal text-[#86868b] uppercase tracking-wider mb-2">Зарплат</p>
            <p className="text-2xl font-light text-[#1d1d1f]">{selectedArchive.salariesCount}</p>
          </div>
        </div>
      </div>
    );
  }

  // Список архивов
  return (
    <div className="p-6">
      {/* Заголовок и кнопка закрытия месяца */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-light text-[#1d1d1f] tracking-tight">Финансовый архив</h2>
          <p className="text-sm text-[#86868b] mt-1">История закрытых периодов</p>
        </div>
        <Button
          onClick={closeCurrentMonth}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1d1d1f] text-white rounded-[14px] hover:bg-[#424245] text-sm font-normal transition-colors w-full sm:w-auto justify-center"
        >
          <Save className="w-4 h-4" strokeWidth={1.5} />
          Закрыть текущий месяц
        </Button>
      </div>

      {/* Список архивов */}
      {archives.length === 0 ? (
        <div className="bg-[#f5f5f7] rounded-[20px] p-16 text-center">
          <div className="inline-flex p-5 rounded-[20px] bg-white shadow-sm mb-5">
            <Archive className="w-10 h-10 text-[#86868b]" strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-light text-[#1d1d1f] mb-2">Архив пуст</h3>
          <p className="text-sm text-[#86868b] max-w-md mx-auto">
            Закройте текущий месяц, чтобы сохранить снимок финансовых данных в архив. Это позволит отслеживать историю и сравнивать результаты.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {archives.map((archive) => (
            <button
              key={archive.month}
              onClick={() => setSelectedArchive(archive)}
              className="bg-white rounded-[20px] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-all text-left"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-[12px] bg-[#f5f5f7]">
                    <Calendar className="w-5 h-5 text-[#1d1d1f]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-lg font-normal text-[#1d1d1f]">
                      {formatMonthName(archive.month)}
                    </h3>
                    <p className="text-xs text-[#86868b] mt-0.5">
                      Закрыт {new Date(archive.closedAt).toLocaleDateString("ru-RU")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-normal text-[#86868b] uppercase tracking-wider">Прибыль</p>
                  <p className={`text-2xl font-light tracking-tight mt-1 ${
                    archive.stats.netProfit >= 0 ? "text-[#1d1d1f]" : "text-[#86868b]"
                  }`}>
                    {Math.round(archive.stats.netProfit).toLocaleString("ru-RU")} ₽
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-[#86868b] mb-1">Выручка</p>
                  <p className="text-sm font-normal text-[#1d1d1f]">
                    {Math.round(archive.stats.totalRevenue).toLocaleString("ru-RU")} ₽
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#86868b] mb-1">Расходы</p>
                  <p className="text-sm font-normal text-[#1d1d1f]">
                    {Math.round(archive.stats.totalExpenses).toLocaleString("ru-RU")} ₽
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#86868b] mb-1">Зарплаты</p>
                  <p className="text-sm font-normal text-[#1d1d1f]">
                    {Math.round(archive.stats.totalSalaries).toLocaleString("ru-RU")} ₽
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#86868b] mb-1">Заказов</p>
                  <p className="text-sm font-normal text-[#1d1d1f]">
                    {archive.ordersCount}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}