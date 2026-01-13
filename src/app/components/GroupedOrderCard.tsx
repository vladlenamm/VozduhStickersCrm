import { useState } from "react";
import { Order } from "../types/order";
import { Copy, Edit, Trash2, ChevronDown } from "lucide-react";

interface GroupedOrderCardProps {
  orders: Order[];
  orderNumber: number;
  onTogglePaid: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (order: Order) => void;
  showDelete: boolean;
}

export function GroupedOrderCard({ orders, orderNumber, onTogglePaid, onDelete, onEdit, showDelete }: GroupedOrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const mainOrder = orders[0];
  const totalPrice = orders.reduce((sum, order) => sum + order.price, 0);
  const managers = Array.from(new Set(orders.map(o => o.manager).filter(Boolean)));
  const allPaid = orders.every(o => o.isPaid);

  const handleTogglePaid = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTogglePaid(orders[0].id);
  };

  return (
    <div 
      className={`bg-white rounded-[16px] border-2 border-[#d2d2d7]/40 transition-all ${
        isExpanded 
          ? "shadow-[0_4px_20px_rgba(0,0,0,0.08)]" 
          : "shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
      }`}
    >
      {/* Основная информация */}
      <div className="px-4 py-2 md:py-2.5">
        {/* Номер, название и цена в одной строке */}
        <div className="flex items-start justify-between gap-3 mb-1.5 md:mb-2">
          <div className="flex items-baseline gap-2 flex-1 min-w-0">
            <span className="flex-shrink-0 text-xs font-normal text-[#86868b]">
              #{orderNumber}
            </span>
            <h3 className="flex-1 font-normal text-[#1d1d1f] text-sm break-words leading-tight">
              {mainOrder.title}
            </h3>
          </div>
          <div className="flex-shrink-0">
            <div className="text-base font-normal text-[#1d1d1f] tracking-tight text-right">
              {totalPrice.toLocaleString("ru-RU")} ₽
            </div>
            <div className="text-[9px] text-[#86868b] text-right">
              {orders.map(o => o.price.toLocaleString("ru-RU")).join(" + ")}
            </div>
          </div>
        </div>
      </div>

      {/* Баннеры и кнопки действий - растянуты на всю ширину экрана в мобильной версии */}
      <div className="md:px-4 md:pb-2.5">
        <div className="px-4 py-2 bg-[#f5f5f7]/40 md:bg-transparent md:py-0 flex items-start justify-between gap-3">
          {/* Баннеры - одна строка в д��сктопе */}
          <div className="flex flex-wrap items-center gap-1.5 flex-1">
            {/* Статус оплаты */}
            <button
              onClick={handleTogglePaid}
              className={`px-2 py-0.5 rounded-[6px] text-[10px] font-normal uppercase tracking-wider transition-all ${
                allPaid 
                  ? "bg-[#9CD5FF] text-white" 
                  : "bg-[#f5f5f7] text-[#86868b] hover:bg-[#e8e8ed]"
              }`}
            >
              {allPaid ? "✓" : "○"}
            </button>
            
            {/* Дата */}
            <span className="px-2 py-0.5 bg-[#f5f5f7] text-[#86868b] rounded-[6px] text-[10px] font-normal">
              {new Date(mainOrder.orderDate).toLocaleDateString("ru-RU", {
                day: "2-digit",
                month: "2-digit",
              })}
            </span>
            
            {/* Способ оплаты */}
            <span className="px-2 py-0.5 bg-[#f5f5f7] text-[#86868b] rounded-[6px] text-[10px] font-normal uppercase tracking-wider">
              {mainOrder.paymentMethod === "Расчетный счет" ? "РС" : mainOrder.paymentMethod}
            </span>

            {/* Индикатор дубля */}
            <div className="flex items-center gap-1 px-2 py-0.5 bg-[#9CD5FF] rounded-[6px]">
              <Copy className="w-2.5 h-2.5 text-white" strokeWidth={1.5} />
              <span className="text-[10px] font-normal text-white uppercase tracking-wider">
                ×{orders.length}
              </span>
            </div>

            {/* Менеджеры */}
            {managers.map((manager, idx) => (
              <span key={idx} className="px-2 py-0.5 bg-[#f5f5f7] text-[#86868b] rounded-[6px] text-[10px] font-normal">
                {manager}
              </span>
            ))}
            
            {/* Категория */}
            <span className="px-2 py-0.5 bg-[#f5f5f7] text-[#86868b] rounded-[6px] text-[10px] font-normal uppercase tracking-wider truncate max-w-[140px]">
              {mainOrder.category.replace("Штучные стикеры ", "Шт. ").replace("Стикерпаки ", "Паки ")}
            </span>
          </div>

          {/* Кнопки действий */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(mainOrder);
                }}
                className="p-1.5 rounded-[8px] text-[#86868b] hover:bg-[#f5f5f7] transition-colors"
                title="Редактировать"
              >
                <Edit className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            )}
            
            {showDelete && onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Удалить все дубликаты этого заказа?")) {
                    orders.forEach(order => onDelete(order.id));
                  }
                }}
                className="p-1.5 rounded-[8px] text-[#86868b] hover:bg-[#f5f5f7] transition-colors"
                title="Удалить все"
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            )}
            
            {/* Кнопка раскрытия */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-[8px] text-[#86868b] hover:bg-[#f5f5f7] transition-all"
              title={isExpanded ? "Свернуть" : "Развернуть"}
            >
              <ChevronDown 
                className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} 
                strokeWidth={1.5} 
              />
            </button>
          </div>
        </div>
      </div>

      {/* Раскрываемая информация */}
      {isExpanded && (
        <div className="px-4 pb-3 pt-2 border-t border-[#d2d2d7]/20 space-y-2.5">
          {/* Распределение по менеджерам */}
          <div className="p-2.5 bg-[#f5f5f7]/50 rounded-[10px]">
            <div className="text-[10px] font-normal text-[#86868b] uppercase tracking-wider mb-2">
              Распределение
            </div>
            <div className="space-y-1.5">
              {orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between">
                  <span className="text-xs font-normal text-[#1d1d1f]">
                    {order.manager || "Без менеджера"}
                  </span>
                  <span className="text-xs font-normal text-[#1d1d1f]">
                    {order.price.toLocaleString("ru-RU")} ₽
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Информация о клиенте */}
          {(mainOrder.clientName || mainOrder.clientPhone || mainOrder.orderSource) && (
            <div className="grid grid-cols-2 gap-2 p-2.5 bg-[#f5f5f7]/50 rounded-[10px]">
              {mainOrder.clientName && (
                <div>
                  <div className="text-[10px] font-normal text-[#86868b] uppercase tracking-wider mb-0.5">
                    Клиент
                  </div>
                  <div className="text-xs font-normal text-[#1d1d1f]">
                    {mainOrder.clientName}
                  </div>
                </div>
              )}
              {mainOrder.clientPhone && (
                <div>
                  <div className="text-[10px] font-normal text-[#86868b] uppercase tracking-wider mb-0.5">
                    Телефон
                  </div>
                  <div className="text-xs font-normal text-[#1d1d1f]">
                    {mainOrder.clientPhone}
                  </div>
                </div>
              )}
              {mainOrder.orderSource && (
                <div className="col-span-2">
                  <div className="text-[10px] font-normal text-[#86868b] uppercase tracking-wider mb-0.5">
                    Источник
                  </div>
                  <div className="text-xs font-normal text-[#1d1d1f] truncate">
                    {mainOrder.orderSource}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Описание */}
          {mainOrder.fullDescription && (
            <div className="text-xs font-normal text-[#86868b] leading-relaxed whitespace-pre-wrap">
              {mainOrder.fullDescription}
            </div>
          )}
        </div>
      )}
    </div>
  );
}