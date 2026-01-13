import { useState, useMemo } from "react";
import { Client } from "../types/client";
import { Order } from "../types/order";
import { Search, Phone, User, ChevronDown, ChevronRight } from "lucide-react";
import { EditOrderModal } from "./EditOrderModal";

interface ClientsViewProps {
  clients: Client[];
  orders: Order[];
  managers?: string[];
  orderSources?: string[];
  onEditOrder?: (orderId: string, updatedData: Partial<Order>) => void;
}

export function ClientsView({ clients, orders, managers = [], orderSources = [], onEditOrder }: ClientsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Фильтрация клиентов
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;

    const query = searchQuery.toLowerCase();
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(query) ||
        client.phone.toLowerCase().includes(query) ||
        client.manager?.toLowerCase().includes(query)
    );
  }, [clients, searchQuery]);

  // Получить заказы конкретного клиента
  const getClientOrders = (client: Client): Order[] => {
    return orders.filter((order) => client.orderIds.includes(order.id));
  };

  // Статистика
  const stats = useMemo(() => {
    return {
      total: clients.length,
      withOrders: clients.filter((c) => c.totalOrders > 0).length,
      repeat: clients.filter((c) => c.totalOrders > 1).length,
      totalRevenue: clients.reduce((sum, c) => sum + c.totalRevenue, 0),
    };
  }, [clients]);

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="max-w-[1600px] mx-auto space-y-3">
          {/* Компактный заголовок */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-normal text-[#1d1d1f] tracking-tight">База клиентов</h1>
              <p className="text-xs text-[#86868b] mt-0.5">
                {filteredClients.length} {filteredClients.length === 1 ? 'клиент' : filteredClients.length < 5 ? 'клиента' : 'клиентов'}
              </p>
            </div>
          </div>

          {/* KPI + Поиск в одной строке */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            {/* Всего клиентов */}
            <div className="bg-white border border-[#d2d2d7]/30 rounded-[12px] p-2.5 shadow-sm">
              <div className="text-[10px] text-[#86868b] uppercase tracking-wider mb-1">
                Всего
              </div>
              <div className="text-xl font-normal text-[#1d1d1f] leading-tight">
                {stats.total}
              </div>
            </div>

            {/* Повторные */}
            <div className="bg-white border border-[#d2d2d7]/30 rounded-[12px] p-2.5 shadow-sm">
              <div className="text-[10px] text-[#86868b] uppercase tracking-wider mb-1">
                Повторные
              </div>
              <div className="text-xl font-normal text-[#1d1d1f] leading-tight">
                {stats.repeat}
              </div>
            </div>

            {/* Общая выручка */}
            <div className="bg-white border border-[#d2d2d7]/30 rounded-[12px] p-2.5 shadow-sm">
              <div className="text-[10px] text-[#86868b] uppercase tracking-wider mb-1">
                Выручка
              </div>
              <div className="text-xl font-normal text-[#1d1d1f] leading-tight">
                {Math.round(stats.totalRevenue).toLocaleString("ru-RU")} ₽
              </div>
            </div>

            {/* Поиск */}
            <div className="bg-white border border-[#d2d2d7]/30 rounded-[12px] p-2.5 shadow-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#86868b]" strokeWidth={1.5} />
                <input
                  type="text"
                  placeholder="Поиск..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border-0 bg-[#f5f5f7] rounded-[8px] text-sm text-[#1d1d1f] placeholder:text-[#86868b] focus:ring-1 focus:ring-[#9CD5FF]"
                />
              </div>
            </div>
          </div>

          {/* Таблица клиентов - Desktop */}
          <div className="hidden md:block bg-white border border-[#d2d2d7]/30 rounded-[12px] shadow-sm overflow-hidden">
            {filteredClients.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#f5f5f7]">
                    <tr>
                      <th className="text-left py-2 px-3 text-[10px] font-normal text-[#86868b] uppercase tracking-wider">
                        Клиент
                      </th>
                      <th className="text-left py-2 px-3 text-[10px] font-normal text-[#86868b] uppercase tracking-wider">
                        Телефон
                      </th>
                      <th className="text-center py-2 px-3 text-[10px] font-normal text-[#86868b] uppercase tracking-wider">
                        Заказов
                      </th>
                      <th className="text-right py-2 px-3 text-[10px] font-normal text-[#86868b] uppercase tracking-wider">
                        Выручка
                      </th>
                      <th className="text-right py-2 px-3 text-[10px] font-normal text-[#86868b] uppercase tracking-wider">
                        Средний чек
                      </th>
                      <th className="text-center py-2 px-3 text-[10px] font-normal text-[#86868b] uppercase tracking-wider">
                        Последний
                      </th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d2d2d7]/20">
                    {filteredClients.map((client) => {
                      const clientOrders = getClientOrders(client);
                      const isExpanded = selectedClient?.id === client.id;
                      const averageCheck = client.totalOrders > 0 ? client.totalRevenue / client.totalOrders : 0;

                      return [
                        <tr
                          key={`row-${client.id}`}
                          onClick={() => setSelectedClient(isExpanded ? null : client)}
                          className={`cursor-pointer transition-colors ${
                            isExpanded 
                              ? "bg-[#EAF6FF]" 
                              : "hover:bg-[#f5f5f7]"
                          }`}
                        >
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center flex-shrink-0 border border-[#d2d2d7]/30">
                                <User className="w-3.5 h-3.5 text-[#86868b]" strokeWidth={1.5} />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-sm font-normal text-[#1d1d1f] truncate">{client.name}</p>
                                  {client.totalOrders > 1 && (
                                    <span className="px-1.5 py-0.5 rounded-full bg-[#C1E5FF] text-white text-[9px] font-normal flex-shrink-0">
                                      Повт.
                                    </span>
                                  )}
                                </div>
                                {client.manager && (
                                  <p className="text-[10px] text-[#86868b]">{client.manager}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <p className="text-xs text-[#86868b]">{client.phone}</p>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-full bg-[#f5f5f7] text-[#1d1d1f] text-xs font-normal">
                              {client.totalOrders}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <p className="text-sm font-normal text-[#1d1d1f]">
                              {Math.round(client.totalRevenue).toLocaleString("ru-RU")} ₽
                            </p>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <p className="text-xs font-normal text-[#86868b]">
                              {Math.round(averageCheck).toLocaleString("ru-RU")} ₽
                            </p>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <p className="text-xs text-[#86868b]">
                              {new Date(client.lastOrderDate).toLocaleDateString("ru-RU", {
                                day: "2-digit",
                                month: "2-digit",
                              })}
                            </p>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center justify-center">
                              {isExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5 text-[#86868b]" strokeWidth={1.5} />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-[#86868b]" strokeWidth={1.5} />
                              )}
                            </div>
                          </td>
                        </tr>,

                        // История заказов (раскрывается)
                        isExpanded && clientOrders.length > 0 && (
                          <tr key={`expanded-${client.id}`}>
                            <td colSpan={7} className="py-0 px-3 bg-[#EAF6FF]/50">
                              <div className="py-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <h4 className="text-xs font-normal text-[#1d1d1f] mb-2">
                                  История заказов ({clientOrders.length})
                                </h4>
                                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                                  {clientOrders
                                    .sort((a, b) => b.orderDate - a.orderDate)
                                    .map((order, index) => {
                                      // Нумерация: первый заказ = #1, последний = #N
                                      const orderNumber = clientOrders.length - index;
                                      return (
                                      <div
                                        key={order.id}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedOrder(order);
                                        }}
                                        className="p-2 rounded-[8px] bg-white border border-[#d2d2d7]/30 hover:border-[#9CD5FF] hover:shadow-sm transition-all cursor-pointer"
                                      >
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 mb-0.5">
                                              <span className="text-[9px] font-normal text-[#86868b] bg-[#f5f5f7] px-1.5 py-0.5 rounded">
                                                #{orderNumber}
                                              </span>
                                              <p className="text-sm font-normal text-[#1d1d1f] truncate">
                                                {order.title}
                                              </p>
                                            </div>
                                            <p className="text-[10px] text-[#86868b]">
                                              {order.category} • {order.paymentMethod} • {new Date(order.orderDate).toLocaleDateString("ru-RU", {
                                                day: "2-digit",
                                                month: "2-digit",
                                              })}
                                            </p>
                                          </div>
                                          <div className="flex items-center gap-2 flex-shrink-0">
                                            <span
                                              className={`text-[9px] px-1.5 py-0.5 rounded-full font-normal ${
                                                order.isPaid
                                                  ? "bg-[#34C759] text-white"
                                                  : "bg-[#FF9500] text-white"
                                              }`}
                                            >
                                              {order.isPaid ? "✓" : "⏳"}
                                            </span>
                                            <span className="text-sm font-normal text-[#1d1d1f] min-w-[80px] text-right">
                                              {order.price.toLocaleString("ru-RU")} ₽
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                    })}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )
                      ].filter(Boolean);
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <User className="w-12 h-12 text-[#86868b]/40 mb-3" strokeWidth={1.5} />
                <h3 className="text-sm font-normal text-[#1d1d1f] mb-1">
                  {searchQuery ? "Клиенты не найдены" : "База клиентов пуста"}
                </h3>
                <p className="text-xs text-[#86868b] max-w-md">
                  {searchQuery
                    ? "Попробуйте изменить поисковый запрос"
                    : "Клиенты добавляются автоматически при создании заказов"}
                </p>
              </div>
            )}
          </div>

          {/* Компактные карточки - Mobile */}
          <div className="md:hidden space-y-2">
            {filteredClients.length > 0 ? (
              filteredClients.map((client) => {
                const clientOrders = getClientOrders(client);
                const isExpanded = selectedClient?.id === client.id;
                const averageCheck = client.totalOrders > 0 ? client.totalRevenue / client.totalOrders : 0;

                return (
                  <div
                    key={client.id}
                    className={`bg-white border rounded-[12px] overflow-hidden transition-all cursor-pointer shadow-sm ${
                      isExpanded
                        ? "border-[#9CD5FF]"
                        : "border-[#d2d2d7]/30 hover:border-[#9CD5FF]"
                    }`}
                    onClick={() => setSelectedClient(isExpanded ? null : client)}
                  >
                    <div className="p-3">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-[#f5f5f7] flex items-center justify-center flex-shrink-0">
                            <User className="w-3.5 h-3.5 text-[#86868b]" strokeWidth={1.5} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-normal text-[#1d1d1f] truncate">{client.name}</p>
                              {client.totalOrders > 1 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-[#C1E5FF] text-white text-[9px] font-normal">
                                  Повт.
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-[#86868b]">{client.phone}</p>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-[#86868b] flex-shrink-0" strokeWidth={1.5} />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-[#86868b] flex-shrink-0" strokeWidth={1.5} />
                        )}
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-1.5">
                        <div className="text-center p-2 rounded-[8px] bg-[#f5f5f7]">
                          <p className="text-xs text-[#1d1d1f] font-normal">{client.totalOrders}</p>
                          <p className="text-[9px] text-[#86868b]">заказов</p>
                        </div>
                        <div className="text-center p-2 rounded-[8px] bg-[#f5f5f7]">
                          <p className="text-xs text-[#1d1d1f] font-normal">
                            {Math.round(client.totalRevenue).toLocaleString("ru-RU")} ₽
                          </p>
                          <p className="text-[9px] text-[#86868b]">выручка</p>
                        </div>
                        <div className="text-center p-2 rounded-[8px] bg-[#f5f5f7]">
                          <p className="text-xs text-[#86868b] font-normal">
                            {Math.round(averageCheck).toLocaleString("ru-RU")} ₽
                          </p>
                          <p className="text-[9px] text-[#86868b]">средний</p>
                        </div>
                      </div>

                      {/* Expanded History */}
                      {isExpanded && clientOrders.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-[#d2d2d7]/30 animate-in fade-in slide-in-from-top-2 duration-300">
                          <h4 className="text-[10px] font-normal text-[#86868b] uppercase tracking-wider mb-2">
                            История ({clientOrders.length})
                          </h4>
                          <div className="space-y-1.5 max-h-48 overflow-y-auto">
                            {clientOrders
                              .sort((a, b) => b.orderDate - a.orderDate)
                              .map((order, index) => {
                                // Нумерация: первый заказ = #1, последний = #N
                                const orderNumber = clientOrders.length - index;
                                return (
                                <div
                                  key={order.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedOrder(order);
                                  }}
                                  className="p-2 rounded-[8px] bg-[#f5f5f7] hover:bg-[#e8e8ed] transition-colors cursor-pointer"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1 mb-0.5">
                                        <span className="text-[9px] font-normal text-[#86868b] bg-white px-1.5 py-0.5 rounded">
                                          #{orderNumber}
                                        </span>
                                        <p className="text-xs font-normal text-[#1d1d1f] truncate">
                                          {order.title}
                                        </p>
                                      </div>
                                      <p className="text-[10px] text-[#86868b]">
                                        {order.category} • {order.paymentMethod} • {new Date(order.orderDate).toLocaleDateString("ru-RU", {
                                          day: "2-digit",
                                          month: "2-digit",
                                        })}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                      <span
                                        className={`text-[9px] px-1.5 py-0.5 rounded-full font-normal ${
                                          order.isPaid
                                            ? "bg-[#34C759] text-white"
                                            : "bg-[#FF9500] text-white"
                                        }`}
                                      >
                                        {order.isPaid ? "✓" : "⏳"}
                                      </span>
                                      <span className="text-xs font-normal text-[#1d1d1f]">
                                        {order.price.toLocaleString("ru-RU")} ₽
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white border border-[#d2d2d7]/30 rounded-[12px] shadow-sm">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <User className="w-12 h-12 text-[#86868b]/40 mb-3" strokeWidth={1.5} />
                  <h3 className="text-sm font-normal text-[#1d1d1f] mb-1">
                    {searchQuery ? "Клиенты не найдены" : "База клиентов пуста"}
                  </h3>
                  <p className="text-xs text-[#86868b] max-w-md px-4">
                    {searchQuery
                      ? "Попробуйте изменить запрос"
                      : "Клиенты добавляются автоматически"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {selectedOrder && (
        <EditOrderModal
          order={selectedOrder}
          open={!!selectedOrder}
          onOpenChange={(open) => {
            if (!open) setSelectedOrder(null);
          }}
          managers={managers}
          orderSources={orderSources}
          onEditOrder={(orderId, updatedData) => {
            if (onEditOrder) {
              onEditOrder(orderId, updatedData);
            }
            setSelectedOrder(null);
          }}
        />
      )}
    </div>
  );
}