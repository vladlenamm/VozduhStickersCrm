import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import type { Order, Category, PaymentMethod, Manager, OrderSource } from "../types/order";
import { toast } from "sonner";

interface EditOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  onEditOrder: (orderId: string, updatedData: Partial<Order>) => void;
  managers: string[];
  orderSources: string[];
}

const categories: Category[] = [
  "Штучные стикеры опт",
  "Стикерпаки опт",
  "Штучные стикеры розница",
];

const paymentMethods: PaymentMethod[] = ["Карта", "Наличные", "Терминал", "РС"];

export function EditOrderModal({ order, open, onOpenChange, onEditOrder, managers, orderSources }: EditOrderModalProps) {
  const [title, setTitle] = useState(order.title);
  const [description, setDescription] = useState(order.fullDescription);
  const [price, setPrice] = useState(order.price.toString());
  const [orderDate, setOrderDate] = useState(
    new Date(order.orderDate).toISOString().split('T')[0]
  );
  const [category, setCategory] = useState<Category>(order.category);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(order.paymentMethod);
  const [isPaid, setIsPaid] = useState(order.isPaid);
  const [clientName, setClientName] = useState(order.clientName || "");
  const [clientPhone, setClientPhone] = useState(order.clientPhone || "");
  const [manager, setManager] = useState<Manager | undefined>(order.manager);
  const [orderSource, setOrderSource] = useState<OrderSource | undefined>(order.orderSource);

  // Update form when order changes
  useEffect(() => {
    setTitle(order.title);
    setDescription(order.fullDescription);
    setPrice(order.price.toString());
    setOrderDate(new Date(order.orderDate).toISOString().split('T')[0]);
    setCategory(order.category);
    setPaymentMethod(order.paymentMethod);
    setIsPaid(order.isPaid);
    setClientName(order.clientName || "");
    setClientPhone(order.clientPhone || "");
    setManager(order.manager);
    setOrderSource(order.orderSource);
  }, [order]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !price) return;

    const orderTimestamp = new Date(orderDate).getTime();

    onEditOrder(order.id, {
      title: title.trim(),
      fullDescription: description.trim(),
      price: parseFloat(price),
      category,
      paymentMethod,
      isPaid,
      orderDate: orderTimestamp,
      clientName: clientName.trim() || undefined,
      clientPhone: clientPhone.trim() || undefined,
      manager,
      orderSource,
    });

    onOpenChange(false);
    toast.success("Заказ обновлен");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[92vh] overflow-y-auto bg-white">
        <DialogHeader className="border-b border-[#d2d2d7]/20 pb-3 mb-4">
          <DialogTitle className="text-lg font-normal text-[#1d1d1f]">Редактировать заказ</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Описание - первое поле */}
          <div>
            <Label className="text-xs font-normal text-[#86868b] uppercase tracking-wider mb-1.5">
              Описание задачи
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Детальное описание заказа..."
              rows={4}
              className="bg-[#f5f5f7] border-0 rounded-[10px] text-sm resize-none focus-visible:ring-1 focus-visible:ring-[#1d1d1f]/20"
            />
          </div>

          {/* Название */}
          <div>
            <Label className="text-xs font-normal text-[#86868b] uppercase tracking-wider mb-1.5">
              Название заказа *
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Краткое название"
              required
              className="bg-[#f5f5f7] border-0 rounded-[10px] text-sm h-9 focus-visible:ring-1 focus-visible:ring-[#1d1d1f]/20"
            />
          </div>

          {/* Клиент - компактная секция */}
          <div className="p-3 bg-[#f5f5f7]/50 rounded-[12px] space-y-3">
            <div className="text-xs font-normal text-[#86868b] uppercase tracking-wider">
              Информация о клиенте
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Имя клиента"
                  className="bg-white border-0 rounded-[8px] text-sm h-8 focus-visible:ring-1 focus-visible:ring-[#1d1d1f]/20"
                />
              </div>
              <div>
                <Input
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="Телефон"
                  className="bg-white border-0 rounded-[8px] text-sm h-8 focus-visible:ring-1 focus-visible:ring-[#1d1d1f]/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Select value={manager} onValueChange={(value) => value && setManager(value as Manager)}>
                <SelectTrigger className="bg-white border-0 rounded-[8px] text-sm h-8 focus:ring-1 focus:ring-[#1d1d1f]/20">
                  <SelectValue placeholder="Менеджер" />
                </SelectTrigger>
                <SelectContent>
                  {managers?.map((mgr) => (
                    <SelectItem key={mgr} value={mgr}>{mgr}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={orderSource} onValueChange={(value) => value && setOrderSource(value as OrderSource)}>
                <SelectTrigger className="bg-white border-0 rounded-[8px] text-sm h-8 focus:ring-1 focus:ring-[#1d1d1f]/20">
                  <SelectValue placeholder="Источник" />
                </SelectTrigger>
                <SelectContent>
                  {orderSources.map((source) => (
                    <SelectItem key={source} value={source}>{source}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Дата и цена в одной строке */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-normal text-[#86868b] uppercase tracking-wider mb-1.5">
                Дата *
              </Label>
              <Input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                required
                className="bg-[#f5f5f7] border-0 rounded-[10px] text-sm h-9 focus-visible:ring-1 focus-visible:ring-[#1d1d1f]/20"
              />
            </div>
            
            <div>
              <Label className="text-xs font-normal text-[#86868b] uppercase tracking-wider mb-1.5">
                Сумма (₽) *
              </Label>
              <Input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                required
                className="bg-[#f5f5f7] border-0 rounded-[10px] text-sm h-9 focus-visible:ring-1 focus-visible:ring-[#1d1d1f]/20"
              />
            </div>
          </div>

          {/* Категория - компактные кнопки */}
          <div>
            <Label className="text-xs font-normal text-[#86868b] uppercase tracking-wider mb-2">
              Категория *
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-2 py-2 rounded-[8px] text-[10px] font-normal transition-all ${
                    category === cat
                      ? "bg-[#9CD5FF] text-white"
                      : "bg-[#f5f5f7] text-[#86868b] hover:bg-[#C1E5FF]/50"
                  }`}
                >
                  {cat.replace("Штучные стикеры ", "Шт. ").replace("Стикерпаки ", "Паки ")}
                </button>
              ))}
            </div>
          </div>

          {/* Способ оплаты - компактные кнопки */}
          <div>
            <Label className="text-xs font-normal text-[#86868b] uppercase tracking-wider mb-2">
              Способ оплаты *
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {paymentMethods.map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`px-2 py-2 rounded-[8px] text-[10px] font-normal transition-all ${
                    paymentMethod === method
                      ? "bg-[#9CD5FF] text-white"
                      : "bg-[#f5f5f7] text-[#86868b] hover:bg-[#C1E5FF]/50"
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Статус оплаты - компактный */}
          <div className="flex items-center justify-between px-3 py-2 bg-[#f5f5f7] rounded-[8px]">
            <span className="text-xs font-normal text-[#1d1d1f]">Оплачено</span>
            <Switch
              checked={isPaid}
              onCheckedChange={setIsPaid}
              className="data-[state=checked]:bg-[#1d1d1f]"
            />
          </div>

          {/* Кнопки - компактные */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-9 rounded-[10px] border-[#d2d2d7]/30 text-sm font-normal hover:bg-[#f5f5f7]"
            >
              Отмена
            </Button>
            <Button 
              type="submit" 
              className="flex-[2] h-9 bg-[#1d1d1f] hover:bg-[#1d1d1f]/90 text-white rounded-[10px] text-sm font-normal"
            >
              Сохранить
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
