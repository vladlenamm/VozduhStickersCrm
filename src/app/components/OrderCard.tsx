import { useState } from "react";
import { Order } from "../types/order";
import { ChevronDown, Trash2, Edit, Copy } from "lucide-react";

interface OrderCardProps {
  order: Order;
  orderNumber: number;
  onTogglePaid: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (order: Order) => void;
  showDelete: boolean;
}

export function OrderCard({ order, orderNumber, onTogglePaid, onDelete, onEdit, showDelete }: OrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div 
      className={`bg-white rounded-[16px] border border-[#d2d2d7]/30 transition-all ${
        isExpanded 
          ? "shadow-[0_4px_20px_rgba(0,0,0,0.08)]" 
          : "shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
      }`}
    >
      {/* Основная информация - компактная */}
      <div className="px-4 py-2 md:py-2.5">
        {/* Номер, название и цена в одной строке */}
        <div className="flex items-start justify-between gap-3 mb-1.5 md:mb-2">
          <div className="flex items-baseline gap-2 flex-1 min-w-0">
            <span className="flex-shrink-0 text-xs font-normal text-[#86868b]">
              #{orderNumber}
            </span>
            <h3 className="flex-1 font-normal text-[#1d1d1f] text-sm break-words leading-tight">
              {order.title}
            </h3>
          </div>
          <div className="flex-shrink-0 text-base font-normal text-[#1d1d1f] tracking-tight">
            {order.price.toLocaleString("ru-RU")} ₽
          </div>
        </div>
      </div>

      {/* Баннеры и кнопки действий - растянуты на всю ширину экрана в мобильной версии */}
      <div className="md:px-4 md:pb-2.5">
        <div className="px-4 py-2 bg-[#f5f5f7]/40 md:bg-transparent md:py-0 flex items-start justify-between gap-3">
          {/* Баннеры - одна строка в десктопе, две в мобильной */}
          <div className="flex flex-wrap items-center gap-1.5 flex-1">
            {/* Статус оплаты */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePaid(order.id);
              }}
              className={`px-2 py-0.5 rounded-[6px] text-[10px] font-normal uppercase tracking-wider transition-all ${
                order.isPaid 
                  ? "bg-[#9CD5FF] text-white" 
                  : "bg-[#f5f5f7] text-[#86868b] hover:bg-[#e8e8ed]"
              }`}
            >
              {order.isPaid ? "✓" : "○"}
            </button>
            
            {/* Дата */}
            <span className="px-2 py-0.5 bg-[#f5f5f7] text-[#86868b] rounded-[6px] text-[10px] font-normal">
              {new Date(order.orderDate).toLocaleDateString("ru-RU", {
                day: "2-digit",
                month: "2-digit",
              })}
            </span>
            
            {/* Способ оплаты */}
            <span className="px-2 py-0.5 bg-[#f5f5f7] text-[#86868b] rounded-[6px] text-[10px] font-normal uppercase tracking-wider">
              {order.paymentMethod === "Расчетный счет" ? "РС" : order.paymentMethod}
            </span>

            {/* Менеджер */}
            {order.manager && (
              <span className="px-2 py-0.5 bg-[#f5f5f7] text-[#86868b] rounded-[6px] text-[10px] font-normal">
                {order.manager}
              </span>
            )}
            
            {/* Категория */}
            <span className="px-2 py-0.5 bg-[#f5f5f7] text-[#86868b] rounded-[6px] text-[10px] font-normal uppercase tracking-wider truncate max-w-[140px]">
              {order.category.replace("Штучные стикеры ", "Шт. ").replace("Стикерпаки ", "Паки ")}
            </span>

            {/* Дубликат */}
            {order.duplicateGroupId && (
              <span className="px-2 py-0.5 bg-[#f5f5f7] text-[#86868b] rounded-[6px] text-[10px] font-normal flex items-center gap-1">
                <Copy className="w-2.5 h-2.5" strokeWidth={2} />
                Дубль
              </span>
            )}
          </div>

          {/* Кнопки действий */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(order);
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
                  if (confirm("Удалить этот заказ?")) {
                    onDelete(order.id);
                  }
                }}
                className="p-1.5 rounded-[8px] text-[#86868b] hover:bg-[#f5f5f7] transition-colors"
                title="Удалить"
              >
                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            )}
            
            {/* Кнопка раскрытия */}
            {(order.fullDescription || order.clientName || order.clientPhone || order.orderSource) && (
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
            )}
          </div>
        </div>
      </div>

      {/* Раскрываемая информация */}
      {isExpanded && (
        <div className="px-4 pb-3 pt-2 border-t border-[#d2d2d7]/20 space-y-2.5">
          {/* Информация о киенте */}
          {(order.clientName || order.clientPhone || order.orderSource) && (
            <div className="grid grid-cols-2 gap-2 p-2.5 bg-[#f5f5f7]/50 rounded-[10px]">
              {order.clientName && (
                <div>
                  <div className="text-[10px] font-normal text-[#86868b] uppercase tracking-wider mb-0.5">
                    Клиент
                  </div>
                  <div className="text-xs font-normal text-[#1d1d1f]">
                    {order.clientName}
                  </div>
                </div>
              )}
              {order.clientPhone && (
                <div>
                  <div className="text-[10px] font-normal text-[#86868b] uppercase tracking-wider mb-0.5">
                    Телефон
                  </div>
                  <div className="text-xs font-normal text-[#1d1d1f]">
                    {order.clientPhone}
                  </div>
                </div>
              )}
              {order.orderSource && (
                <div className="col-span-2">
                  <div className="text-[10px] font-normal text-[#86868b] uppercase tracking-wider mb-0.5">
                    Источник
                  </div>
                  <div className="text-xs font-normal text-[#1d1d1f] truncate">
                    {order.orderSource}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Описание */}
          {order.fullDescription && (
            <div className="text-xs font-normal text-[#86868b] leading-relaxed whitespace-pre-wrap">
              {order.fullDescription}
            </div>
          )}
        </div>
      )}
    </div>
  );
}