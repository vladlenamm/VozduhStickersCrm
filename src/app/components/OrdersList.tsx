import { useMemo, useState } from "react";
import { Order, Category, PaymentMethod, Manager } from "../types/order";
import { OrderCard } from "./OrderCard";
import { GroupedOrderCard } from "./GroupedOrderCard";
import { Input } from "./ui/input";
import { Search, Filter, Calendar, X, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";

interface OrdersListProps {
  orders: Order[];
  onTogglePaid: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (order: Order) => void;
  showDelete: boolean;
  managers?: string[];
  onAddOrder?: () => void;
}

export function OrdersList({ orders, onTogglePaid, onDelete, onEdit, showDelete, managers = [], onAddOrder }: OrdersListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentMethod | "all">("all");
  const [managerFilter, setManagerFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Подсчет активных фильтров
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (categoryFilter !== "all") count++;
    if (paymentFilter !== "all") count++;
    if (managerFilter !== "all") count++;
    if (dateFrom || dateTo) count++;
    return count;
  }, [categoryFilter, paymentFilter, managerFilter, dateFrom, dateTo]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch = order.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || order.category === categoryFilter;
      const matchesPayment = paymentFilter === "all" || order.paymentMethod === paymentFilter;
      const matchesManager = managerFilter === "all" || order.manager === managerFilter;
      
      let matchesDate = true;
      if (dateFrom || dateTo) {
        const orderDate = new Date(order.orderDate);
        const fromDate = dateFrom ? new Date(dateFrom) : null;
        const toDate = dateTo ? new Date(dateTo) : null;
        
        if (fromDate && orderDate < fromDate) matchesDate = false;
        if (toDate && orderDate > new Date(toDate.getTime() + 24 * 60 * 60 * 1000 - 1)) matchesDate = false;
      }
      
      return matchesSearch && matchesCategory && matchesPayment && matchesManager && matchesDate;
    });
  }, [orders, searchQuery, categoryFilter, paymentFilter, managerFilter, dateFrom, dateTo]);

  const groupedOrders = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 24 * 60 * 60 * 1000;

    const groups: { today: (Order | Order[])[]; yesterday: (Order | Order[])[]; earlier: (Order | Order[])[]; } = {
      today: [],
      yesterday: [],
      earlier: [],
    };

    const duplicateGroups = new Map<string, Order[]>();
    const processedIds = new Set<string>();

    filteredOrders.forEach((order) => {
      if (processedIds.has(order.id)) return;

      if (order.duplicateGroupId && managerFilter === "all") {
        const groupOrders = filteredOrders.filter(o => o.duplicateGroupId === order.duplicateGroupId);
        groupOrders.forEach(o => processedIds.add(o.id));
        
        const orderDate = new Date(order.createdAt);
        const orderDay = new Date(
          orderDate.getFullYear(),
          orderDate.getMonth(),
          orderDate.getDate()
        ).getTime();

        if (orderDay === today) {
          groups.today.push(groupOrders);
        } else if (orderDay === yesterday) {
          groups.yesterday.push(groupOrders);
        } else {
          groups.earlier.push(groupOrders);
        }
      } else {
        processedIds.add(order.id);
        
        const orderDate = new Date(order.createdAt);
        const orderDay = new Date(
          orderDate.getFullYear(),
          orderDate.getMonth(),
          orderDate.getDate()
        ).getTime();

        if (orderDay === today) {
          groups.today.push(order);
        } else if (orderDay === yesterday) {
          groups.yesterday.push(order);
        } else {
          groups.earlier.push(order);
        }
      }
    });

    const sortItems = (items: (Order | Order[])[]) => {
      return items.sort((a, b) => {
        const aDate = Array.isArray(a) ? a[0].createdAt : a.createdAt;
        const bDate = Array.isArray(b) ? b[0].createdAt : b.createdAt;
        return bDate - aDate;
      });
    };

    groups.today = sortItems(groups.today);
    groups.yesterday = sortItems(groups.yesterday);
    groups.earlier = sortItems(groups.earlier);

    return groups;
  }, [filteredOrders, orders, searchQuery, categoryFilter, paymentFilter, managerFilter, dateFrom, dateTo]);

  const totalSum = useMemo(() => {
    const processedGroupIds = new Set<string>();
    let sum = 0;

    filteredOrders.forEach((order) => {
      if (order.duplicateGroupId) {
        if (!processedGroupIds.has(order.duplicateGroupId)) {
          processedGroupIds.add(order.duplicateGroupId);
          
          if (managerFilter === "all") {
            const groupOrders = orders.filter(o => o.duplicateGroupId === order.duplicateGroupId);
            const groupSum = groupOrders.reduce((s, o) => s + o.price, 0);
            sum += groupSum;
          } else {
            const groupOrders = filteredOrders.filter(o => o.duplicateGroupId === order.duplicateGroupId);
            const groupSum = groupOrders.reduce((s, o) => s + o.price, 0);
            sum += groupSum;
          }
        }
      } else {
        sum += order.price;
      }
    });

    return sum;
  }, [filteredOrders, orders, managerFilter]);

  const resetFilters = () => {
    setCategoryFilter("all");
    setPaymentFilter("all");
    setManagerFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className="h-full flex flex-col">
      {/* Компактная шапка с поиском и фильтрами */}
      <div className="flex-shrink-0 bg-white border-b border-[#d2d2d7]/30 px-4 py-3">
        {/* Первая строка: Поиск + Статистика + Кнопка фильтров */}
        <div className="flex items-center gap-3 mb-3">
          {/* Поиск */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b]" strokeWidth={1.5} />
            <Input
              type="text"
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 h-9 bg-[#f5f5f7] border-0 rounded-[10px] text-sm placeholder:text-[#86868b]"
            />
          </div>

          {/* Общая сумма */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-[#f5f5f7] rounded-[10px]">
            <span className="text-xs font-normal text-[#86868b] uppercase tracking-wider">Сумма:</span>
            <span className="text-sm font-normal text-[#1d1d1f]">{totalSum.toLocaleString("ru-RU")} ₽</span>
          </div>

          {/* Кнопка фильтров */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-[10px] text-sm font-normal transition-all ${
              showFilters || activeFiltersCount > 0
                ? "bg-[#9CD5FF] text-white"
                : "bg-[#f5f5f7] text-[#86868b] hover:bg-[#e8e8ed]"
            }`}
          >
            <Filter className="w-4 h-4" strokeWidth={1.5} />
            {activeFiltersCount > 0 && (
              <span className="px-1.5 py-0.5 bg-white/20 rounded text-xs">{activeFiltersCount}</span>
            )}
            <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? "rotate-180" : ""}`} strokeWidth={2} />
          </button>
        </div>

        {/* Мобильная сумма */}
        <div className="sm:hidden flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-normal text-[#86868b] uppercase tracking-wider">Всего заказов:</span>
          <span className="text-sm font-normal text-[#1d1d1f]">{filteredOrders.length}</span>
        </div>
        <div className="sm:hidden flex items-center justify-between px-1">
          <span className="text-xs font-normal text-[#86868b] uppercase tracking-wider">Общая сумма:</span>
          <span className="text-sm font-normal text-[#1d1d1f]">{totalSum.toLocaleString("ru-RU")} ₽</span>
        </div>

        {/* Панель фильтров (компактная) */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-[#d2d2d7]/20 space-y-3">
            {/* Категория */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-normal text-[#86868b] uppercase tracking-wider">Категория</span>
                {categoryFilter !== "all" && (
                  <button
                    onClick={() => setCategoryFilter("all")}
                    className="text-xs text-[#86868b] hover:text-[#1d1d1f]"
                  >
                    Сбросить
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {(["all", "Штучные стикеры опт", "Стикерпаки опт", "Штучные стикеры розница"] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-[8px] text-xs font-normal transition-all ${
                      categoryFilter === cat
                        ? "bg-[#9CD5FF] text-white"
                        : "bg-[#f5f5f7] text-[#86868b] hover:bg-[#C1E5FF]/50"
                    }`}
                  >
                    {cat === "all" ? "Все" : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Оплата */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-normal text-[#86868b] uppercase tracking-wider">Оплата</span>
                {paymentFilter !== "all" && (
                  <button
                    onClick={() => setPaymentFilter("all")}
                    className="text-xs text-[#86868b] hover:text-[#1d1d1f]"
                  >
                    Сбросить
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {(["all", "Карта", "Терминал", "Расчетный счет", "Наличные"] as const).map((payment) => (
                  <button
                    key={payment}
                    onClick={() => setPaymentFilter(payment)}
                    className={`px-3 py-1.5 rounded-[8px] text-xs font-normal transition-all ${
                      paymentFilter === payment
                        ? "bg-[#9CD5FF] text-white"
                        : "bg-[#f5f5f7] text-[#86868b] hover:bg-[#C1E5FF]/50"
                    }`}
                  >
                    {payment === "all" ? "Все" : payment}
                  </button>
                ))}
              </div>
            </div>

            {/* Менеджер */}
            {managers.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-normal text-[#86868b] uppercase tracking-wider">Менеджер</span>
                  {managerFilter !== "all" && (
                    <button
                      onClick={() => setManagerFilter("all")}
                      className="text-xs text-[#86868b] hover:text-[#1d1d1f]"
                    >
                      Сбросить
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setManagerFilter("all")}
                    className={`px-3 py-1.5 rounded-[8px] text-xs font-normal transition-all ${
                      managerFilter === "all"
                        ? "bg-[#9CD5FF] text-white"
                        : "bg-[#f5f5f7] text-[#86868b] hover:bg-[#C1E5FF]/50"
                    }`}
                  >
                    Все
                  </button>
                  {managers.map((manager) => (
                    <button
                      key={manager}
                      onClick={() => setManagerFilter(manager)}
                      className={`px-3 py-1.5 rounded-[8px] text-xs font-normal transition-all ${
                        managerFilter === manager
                          ? "bg-[#9CD5FF] text-white"
                          : "bg-[#f5f5f7] text-[#86868b] hover:bg-[#C1E5FF]/50"
                      }`}
                    >
                      {manager}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Даты */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-normal text-[#86868b] uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" strokeWidth={1.5} />
                  Период
                </span>
                {(dateFrom || dateTo) && (
                  <button
                    onClick={() => { setDateFrom(""); setDateTo(""); }}
                    className="text-xs text-[#86868b] hover:text-[#1d1d1f]"
                  >
                    Сбросить
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-3 py-1.5 bg-[#f5f5f7] border-0 rounded-[8px] text-xs font-normal text-[#1d1d1f]"
                  placeholder="От"
                />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-3 py-1.5 bg-[#f5f5f7] border-0 rounded-[8px] text-xs font-normal text-[#1d1d1f]"
                  placeholder="До"
                />
              </div>
            </div>

            {/* Кнопка сброса всех фильтров */}
            {activeFiltersCount > 0 && (
              <button
                onClick={resetFilters}
                className="w-full px-3 py-2 bg-[#f5f5f7] text-[#86868b] rounded-[8px] text-xs font-normal hover:bg-[#e8e8ed] transition-colors"
              >
                Сбросить все фильтры
              </button>
            )}
          </div>
        )}
      </div>

      {/* Список заказов */}
      <div className="flex-1 overflow-y-auto px-4">
        {filteredOrders.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center py-12">
              <div className="inline-flex p-4 rounded-[16px] bg-[#f5f5f7] mb-3">
                <Search className="w-6 h-6 text-[#86868b]" strokeWidth={1.5} />
              </div>
              <p className="text-sm font-normal text-[#86868b]">Заказы не найдены</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Сегодня */}
            {groupedOrders.today.length > 0 && (() => {
              const today = new Date();
              const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
              const dateStr = `${today.getDate()} ${months[today.getMonth()]}`;
              const orderText = groupedOrders.today.length === 1 ? 'заказ' : groupedOrders.today.length < 5 ? 'заказа' : 'заказов';
              
              return (
                <div>
                  <h3 className="text-xs font-normal text-[#86868b] uppercase tracking-wider mb-2 px-1">
                    сегодня • {dateStr} • {groupedOrders.today.length} {orderText}
                  </h3>
                  <div className="space-y-2">
                    {groupedOrders.today.map((item, index) => {
                      // Нумерация: самый старый заказ = #1, самый новый = последний номер
                      // Внутри сек��ии: index=0 это новый заказ, поэтому переворачиваем
                      const orderNumber = groupedOrders.earlier.length + groupedOrders.yesterday.length + (groupedOrders.today.length - index);
                      return Array.isArray(item) ? (
                        <GroupedOrderCard
                          key={`group-${item[0].duplicateGroupId}-${index}`}
                          orders={item}
                          orderNumber={orderNumber}
                          onTogglePaid={onTogglePaid}
                          onDelete={onDelete}
                          onEdit={onEdit}
                          showDelete={showDelete}
                        />
                      ) : (
                        <OrderCard
                          key={item.id}
                          order={item}
                          orderNumber={orderNumber}
                          onTogglePaid={onTogglePaid}
                          onDelete={onDelete}
                          onEdit={onEdit}
                          showDelete={showDelete}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Вчера */}
            {groupedOrders.yesterday.length > 0 && (() => {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
              const dateStr = `${yesterday.getDate()} ${months[yesterday.getMonth()]}`;
              const orderText = groupedOrders.yesterday.length === 1 ? 'заказ' : groupedOrders.yesterday.length < 5 ? 'заказа' : 'заказов';
              
              return (
                <div>
                  <h3 className="text-xs font-normal text-[#86868b] uppercase tracking-wider mb-2 px-1">
                    вчера • {dateStr} • {groupedOrders.yesterday.length} {orderText}
                  </h3>
                  <div className="space-y-2">
                    {groupedOrders.yesterday.map((item, index) => {
                      // Нумерация: самый старый заказ = #1, самый новый = последний номер
                      // Внутри секции: index=0 это новый заказ, поэтому переворачиваем
                      const orderNumber = groupedOrders.earlier.length + (groupedOrders.yesterday.length - index);
                      return Array.isArray(item) ? (
                        <GroupedOrderCard
                          key={`group-${item[0].duplicateGroupId}-${index}`}
                          orders={item}
                          orderNumber={orderNumber}
                          onTogglePaid={onTogglePaid}
                          onDelete={onDelete}
                          onEdit={onEdit}
                          showDelete={showDelete}
                        />
                      ) : (
                        <OrderCard
                          key={item.id}
                          order={item}
                          orderNumber={orderNumber}
                          onTogglePaid={onTogglePaid}
                          onDelete={onDelete}
                          onEdit={onEdit}
                          showDelete={showDelete}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Ранее */}
            {groupedOrders.earlier.length > 0 && (() => {
              const orderText = groupedOrders.earlier.length === 1 ? 'заказ' : groupedOrders.earlier.length < 5 ? 'заказа' : 'заказов';
              
              return (
                <div>
                  <h3 className="text-xs font-normal text-[#86868b] uppercase tracking-wider mb-2 px-1">
                    ранее • {groupedOrders.earlier.length} {orderText}
                  </h3>
                  <div className="space-y-2">
                    {groupedOrders.earlier.map((item, index) => {
                      // Нумерация: самый старый заказ = #1, самый новый = последний номер
                      // Внутри секции: index=0 это новый заказ, поэтому переворачиваем
                      const orderNumber = groupedOrders.earlier.length - index;
                      return Array.isArray(item) ? (
                        <GroupedOrderCard
                          key={`group-${item[0].duplicateGroupId}-${index}`}
                          orders={item}
                          orderNumber={orderNumber}
                          onTogglePaid={onTogglePaid}
                          onDelete={onDelete}
                          onEdit={onEdit}
                          showDelete={showDelete}
                        />
                      ) : (
                        <OrderCard
                          key={item.id}
                          order={item}
                          orderNumber={orderNumber}
                          onTogglePaid={onTogglePaid}
                          onDelete={onDelete}
                          onEdit={onEdit}
                          showDelete={showDelete}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}