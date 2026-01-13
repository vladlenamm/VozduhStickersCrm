import { useMemo, useState } from "react";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Order } from "../types/order";
import { Client } from "../types/client";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Calendar as CalendarIcon,
  Package,
  Users,
  Target,
} from "lucide-react";

interface DirectorDashboardProps {
  orders: Order[];
  clients?: Client[];
  onNavigateToOrders?: () => void;
}

type PeriodFilter = "all" | "today" | "currentMonth" | "firstHalf" | "secondHalf" | "custom";

export function DirectorDashboard({ orders, clients, onNavigateToOrders }: DirectorDashboardProps) {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Получаем текущий месяц для отображения в фильтрах
  const currentMonthName = useMemo(() => {
    const months = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    return months[new Date().getMonth()];
  }, []);

  const filteredOrders = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayStart = today.getTime();
    const todayEnd = todayStart + 24 * 60 * 60 * 1000;

    return orders.filter((order) => {
      // orderDate это timestamp (number)
      const orderTimestamp = order.orderDate;
      // Нормализуем к началу дня
      const orderDate = new Date(orderTimestamp);
      const orderDateStart = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate()).getTime();

      switch (periodFilter) {
        case "today":
          // Проверяем, что заказ создан сегодня
          return orderTimestamp >= todayStart && orderTimestamp < todayEnd;

        case "currentMonth": {
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).getTime();
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
          return orderDateStart >= monthStart && orderDateStart <= monthEnd;
        }

        case "firstHalf": {
          const firstHalfStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).getTime();
          const firstHalfEnd = new Date(now.getFullYear(), now.getMonth(), 15, 23, 59, 59, 999).getTime();
          return orderDateStart >= firstHalfStart && orderDateStart <= firstHalfEnd;
        }

        case "secondHalf": {
          const secondHalfStart = new Date(now.getFullYear(), now.getMonth(), 16, 0, 0, 0, 0).getTime();
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
          return orderDateStart >= secondHalfStart && orderDateStart <= monthEnd;
        }

        case "custom": {
          if (!dateFrom && !dateTo) return true;
          
          // Создаем даты в локальном времени
          let fromDate: number | null = null;
          let toDate: number | null = null;
          
          if (dateFrom) {
            const [year, month, day] = dateFrom.split('-').map(Number);
            const fromDateObj = new Date(year, month - 1, day, 0, 0, 0, 0);
            fromDate = fromDateObj.getTime();
          }
          
          if (dateTo) {
            const [year, month, day] = dateTo.split('-').map(Number);
            const toDateObj = new Date(year, month - 1, day, 23, 59, 59, 999);
            toDate = toDateObj.getTime();
          }

          if (fromDate && orderDateStart < fromDate) return false;
          if (toDate && orderDateStart > toDate) return false;

          return true;
        }

        default:
          return true;
      }
    });
  }, [orders, periodFilter, dateFrom, dateTo]);

  const analytics = useMemo(() => {
    // Группируем дублированные заказы для правильного подсчета
    const processedGroupIds = new Set<string>();
    const uniqueOrders: Order[] = [];
    
    filteredOrders.forEach((order) => {
      if (order.duplicateGroupId) {
        // Если это дубль и мы еще не обработал эту группу
        if (!processedGroupIds.has(order.duplicateGroupId)) {
          processedGroupIds.add(order.duplicateGroupId);
          // Находим все заказы из этой групы
          const groupOrders = orders.filter(o => o.duplicateGroupId === order.duplicateGroupId);
          // Добавляем все заказы группы как один "виртуальный" заказ с суммированной ценой
          uniqueOrders.push({
            ...order,
            price: groupOrders.reduce((sum, o) => sum + o.price, 0),
            // Группа считается оплаченной, если все заказы в группе оплачены
            isPaid: groupOrders.every(o => o.isPaid)
          });
        }
      } else {
        // Обычный заказ - просто добавляем
        uniqueOrders.push(order);
      }
    });

    const totalOrders = uniqueOrders.length;
    const paidOrders = uniqueOrders.filter((o) => o.isPaid).length;
    const totalRevenue = uniqueOrders.filter((o) => o.isPaid).reduce((sum, o) => sum + o.price, 0);
    const pendingRevenue = uniqueOrders
      .filter((o) => !o.isPaid)
      .reduce((sum, o) => sum + o.price, 0);
    const averageCheck = paidOrders > 0 ? totalRevenue / paidOrders : 0;
    const conversionRate = totalOrders > 0 ? (paidOrders / totalOrders) * 100 : 0;

    // Выручка по категориям
    const categoryRevenue = uniqueOrders
      .filter((o) => o.isPaid)
      .reduce((acc, order) => {
        acc[order.category] = (acc[order.category] || 0) + order.price;
        return acc;
      }, {} as Record<string, number>);

    const categoryData = Object.entries(categoryRevenue)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Статистика по менеджерам - используем оригинальные filteredOrders для корректного подсчета
    const managerStats = filteredOrders.reduce((acc, order) => {
      const mgr = order.manager || "Не указан";
      if (!acc[mgr]) {
        acc[mgr] = { name: mgr, orders: 0, revenue: 0, paid: 0 };
      }
      acc[mgr].orders += 1;
      if (order.isPaid) {
        acc[mgr].revenue += order.price;
        acc[mgr].paid += 1;
      }
      return acc;
    }, {} as Record<string, { name: string; orders: number; revenue: number; paid: number }>);

    const managerData = Object.values(managerStats).sort((a, b) => b.revenue - a.revenue);

    // Статистика по источникам заказов
    const sourceStats = uniqueOrders.reduce((acc, order) => {
      const src = order.orderSource || "Не указан";
      if (!acc[src]) {
        acc[src] = { name: src, orders: 0, revenue: 0, paid: 0 };
      }
      acc[src].orders += 1;
      if (order.isPaid) {
        acc[src].revenue += order.price;
        acc[src].paid += 1;
      }
      return acc;
    }, {} as Record<string, { name: string; orders: number; revenue: number; paid: number }>);

    const sourceData = Object.values(sourceStats).sort((a, b) => b.revenue - a.revenue);

    return {
      totalOrders,
      paidOrders,
      totalRevenue,
      pendingRevenue,
      averageCheck,
      conversionRate,
      categoryData,
      managerData,
      sourceData,
    };
  }, [filteredOrders, periodFilter, orders]);

  const COLORS = ["#9CD5FF", "#C1E5FF", "#EAF6FF", "#B3E0FF", "#D6EDFF", "#A8D8FF"];

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="max-w-[1600px] mx-auto space-y-3">
          {/* Компактный заголовок */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-normal text-[#1d1d1f] tracking-tight">Менеджеры</h1>
            <span className="text-xs text-[#86868b] uppercase tracking-wider">
              {filteredOrders.length} из {orders.length}
            </span>
          </div>

          {/* Компактные фильтры периодов */}
          <div className="bg-[#f5f5f7] rounded-[12px] p-2">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { key: "all", label: "Все" },
                { key: "today", label: "Сегодня" },
                { key: "currentMonth", label: currentMonthName },
                { key: "firstHalf", label: `${currentMonthName} 1-15` },
                { key: "secondHalf", label: `${currentMonthName} 16-31` },
                { key: "custom", label: "Период" },
              ].map((period) => (
                <button
                  key={period.key}
                  onClick={() => setPeriodFilter(period.key as PeriodFilter)}
                  className={`px-3 py-1.5 rounded-[8px] text-xs font-normal transition-all ${
                    periodFilter === period.key
                      ? "bg-[#9CD5FF] text-white shadow-sm"
                      : "bg-white text-[#86868b] hover:bg-[#C1E5FF]/30"
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>

            {/* Кастомный период */}
            {periodFilter === "custom" && (
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[#d2d2d7]/30">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-2 py-1.5 bg-white border-0 rounded-[8px] text-xs text-[#1d1d1f] focus:ring-1 focus:ring-[#9CD5FF]"
                  placeholder="От"
                />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-2 py-1.5 bg-white border-0 rounded-[8px] text-xs text-[#1d1d1f] focus:ring-1 focus:ring-[#9CD5FF]"
                  placeholder="До"
                />
              </div>
            )}
          </div>

          {/* KPI метрики - 4 компактные карточки */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {/* Выручка */}
            <div className="bg-white border border-[#d2d2d7]/30 rounded-[12px] p-3 shadow-sm">
              <div className="text-[10px] text-[#86868b] uppercase tracking-wider mb-1.5">
                Выручка
              </div>
              <div className="text-xl font-normal text-[#1d1d1f] leading-tight">
                {analytics.totalRevenue.toLocaleString("ru-RU")} ₽
              </div>
            </div>

            {/* Заказов */}
            <div className="bg-white border border-[#d2d2d7]/30 rounded-[12px] p-3 shadow-sm">
              <div className="text-[10px] text-[#86868b] uppercase tracking-wider mb-1.5">
                Заказов
              </div>
              <div className="text-xl font-normal text-[#1d1d1f] leading-tight">
                {analytics.totalOrders}
              </div>
            </div>

            {/* Средний чек */}
            <div className="bg-white border border-[#d2d2d7]/30 rounded-[12px] p-3 shadow-sm">
              <div className="text-[10px] text-[#86868b] uppercase tracking-wider mb-1.5">
                Средний чек
              </div>
              <div className="text-xl font-normal text-[#1d1d1f] leading-tight">
                {Math.round(analytics.averageCheck).toLocaleString("ru-RU")} ₽
              </div>
            </div>

            {/* Ожидается */}
            <div className="bg-white border border-[#d2d2d7]/30 rounded-[12px] p-3 shadow-sm">
              <div className="text-[10px] text-[#86868b] uppercase tracking-wider mb-1.5">
                Ожидается
              </div>
              <div className="text-xl font-normal text-[#1d1d1f] leading-tight">
                {analytics.pendingRevenue.toLocaleString("ru-RU")} ₽
              </div>
            </div>
          </div>

          {/* Графики - 3 колонки компактно */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Выручка по категориям */}
            <div className="bg-white border border-[#d2d2d7]/30 rounded-[12px] p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-[#86868b]" strokeWidth={1.5} />
                <span className="text-sm font-normal text-[#1d1d1f]">Категории</span>
              </div>

              {analytics.categoryData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={analytics.categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {analytics.categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => `${value.toLocaleString("ru-RU")} ₽`}
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #d2d2d7",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="space-y-1.5 mt-2">
                    {analytics.categoryData.map((cat, index) => (
                      <div
                        key={cat.name}
                        className="flex items-center justify-between p-2 rounded-[8px] bg-[#f5f5f7] hover:bg-[#e8e8ed] transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-[10px] text-[#1d1d1f]">
                            {cat.name === "Штучные стикеры опт" ? "штучные" : 
                             cat.name === "Стикерпаки опт" ? "стикерпаки" : 
                             cat.name === "Штучные стикеры розница" ? "розница" : cat.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-normal text-[#1d1d1f]">
                          {cat.value.toLocaleString("ru-RU")} ₽
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-xs text-[#86868b]">
                  Нет данных
                </div>
              )}
            </div>

            {/* Менеджеры */}
            <div className="bg-white border border-[#d2d2d7]/30 rounded-[12px] p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-[#86868b]" strokeWidth={1.5} />
                <span className="text-sm font-normal text-[#1d1d1f]">Менеджеры</span>
              </div>

              {analytics.managerData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={analytics.managerData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="revenue"
                      >
                        {analytics.managerData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => `${value.toLocaleString("ru-RU")} ₽`}
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #d2d2d7",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="space-y-1.5 mt-2">
                    {analytics.managerData.map((mgr, index) => (
                      <div
                        key={mgr.name}
                        className="p-2 rounded-[8px] bg-[#f5f5f7] hover:bg-[#e8e8ed] transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-[10px] font-normal text-[#1d1d1f]">{mgr.name}</span>
                          </div>
                          <span className="text-[10px] font-normal text-[#1d1d1f]">
                            {mgr.revenue.toLocaleString("ru-RU")} ₽
                          </span>
                        </div>
                        <div className="text-[9px] text-[#86868b] pl-4">
                          {mgr.orders} {mgr.orders === 1 ? 'заказ' : mgr.orders < 5 ? 'заказа' : 'заказов'}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-xs text-[#86868b]">
                  Нет данных
                </div>
              )}
            </div>

            {/* Источники */}
            <div className="bg-white border border-[#d2d2d7]/30 rounded-[12px] p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-[#86868b]" strokeWidth={1.5} />
                <span className="text-sm font-normal text-[#1d1d1f]">Источники</span>
              </div>

              {analytics.sourceData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={analytics.sourceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="revenue"
                      >
                        {analytics.sourceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => `${value.toLocaleString("ru-RU")} ₽`}
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #d2d2d7",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="space-y-1.5 mt-2">
                    {analytics.sourceData.map((source, index) => (
                      <div
                        key={source.name}
                        className="flex items-center justify-between p-2 rounded-[8px] bg-[#f5f5f7] hover:bg-[#e8e8ed] transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-[10px] text-[#1d1d1f]">{source.name}</span>
                        </div>
                        <span className="text-[10px] font-normal text-[#1d1d1f]">
                          {source.revenue.toLocaleString("ru-RU")} ₽
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-xs text-[#86868b]">
                  Нет данных
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}