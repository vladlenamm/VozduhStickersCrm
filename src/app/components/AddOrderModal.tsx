import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Copy, Users } from "lucide-react";
import type { Category, PaymentMethod, Manager, OrderSource } from "../types/order";
import type { Client, ClientMatch } from "../types/client";
import { toast } from "sonner";

interface AddOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (order: {
    title: string;
    fullDescription: string;
    price: number;
    category: Category;
    paymentMethod: PaymentMethod;
    isPaid: boolean;
    orderDate: number;
    clientName?: string;
    clientPhone?: string;
    manager?: string;
    orderSource?: OrderSource;
    duplicateGroupId?: string;
    isDuplicate?: boolean;
  }) => void;
  managers: string[];
  orderSources: string[];
}

const categories: Category[] = [
  "Штучные стикеры опт",
  "Стикерпаки опт",
  "Штучные стикеры розница",
];

const paymentMethods: PaymentMethod[] = ["Карта", "Наличные", "Терминал", "РС"];

export function AddOrderModal({ isOpen, onClose, onAdd, managers, orderSources }: AddOrderModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<Category | undefined>(undefined);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | undefined>(undefined);
  const [isPaid, setIsPaid] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [manager, setManager] = useState<string | undefined>(undefined);
  const [orderSource, setOrderSource] = useState<OrderSource | undefined>(undefined);
  
  const [showRepeatClientDialog, setShowRepeatClientDialog] = useState(false);
  const [matchedClient, setMatchedClient] = useState<ClientMatch | null>(null);
  const [pendingOrderData, setPendingOrderData] = useState<any>(null);

  const [isDuplicateMode, setIsDuplicateMode] = useState(false);
  const [duplicateManager, setDuplicateManager] = useState<string | undefined>(undefined);
  const [duplicatePrice, setDuplicatePrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");

  const parseDescription = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length > 0 && !title) {
      setTitle(lines[0].trim());
    }

    const clientNameMatch = text.match(/@(\S+)/);
    if (clientNameMatch && !clientName) {
      setClientName(clientNameMatch[1].trim());
    }

    const phoneMatch = text.match(/(?:\+7|8)[\s\-]?\(?(\d{3})\)?[\s\-]?(\d{3})[\s\-]?(\d{2})[\s\-]?(\d{2})/);
    if (phoneMatch && !clientPhone) {
      setClientPhone(phoneMatch[0].trim());
    }

    const priceMatch = text.match(/(\d+(?:\s?\d+)*)\s*[₽Рр]/);
    if (priceMatch && !price) {
      const parsedPrice = priceMatch[1].replace(/\s/g, '');
      setPrice(parsedPrice);
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDescription = e.target.value;
    setDescription(newDescription);
    parseDescription(newDescription);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Введите название заказа");
      return;
    }
    
    if (!isDuplicateMode) {
      if (!price || parseFloat(price) <= 0) {
        toast.error("Введите корректную цену");
        return;
      }
    }
    
    if (!category) {
      toast.error("Выберите категорию");
      return;
    }
    if (!paymentMethod) {
      toast.error("Выберите способ оплаты");
      return;
    }

    if (isDuplicateMode) {
      if (!manager) {
        toast.error("Выберите первого менеджера");
        return;
      }
      if (!duplicateManager) {
        toast.error("Выберите второго менеджера");
        return;
      }
      if (!originalPrice || parseFloat(originalPrice) <= 0) {
        toast.error("Укажите сумму для первого менеджера");
        return;
      }
      if (!duplicatePrice || parseFloat(duplicatePrice) <= 0) {
        toast.error("Укажите сумму для второго менеджера");
        return;
      }
    }

    const orderTimestamp = new Date(orderDate).getTime();

    if (isDuplicateMode) {
      const groupId = crypto.randomUUID();

      onAdd({
        title: title.trim(),
        fullDescription: description.trim(),
        price: parseFloat(originalPrice),
        category,
        paymentMethod,
        isPaid,
        orderDate: orderTimestamp,
        clientName: clientName.trim() || undefined,
        clientPhone: clientPhone.trim() || undefined,
        manager,
        orderSource,
        duplicateGroupId: groupId,
        isDuplicate: true,
      });

      onAdd({
        title: title.trim(),
        fullDescription: description.trim(),
        price: parseFloat(duplicatePrice),
        category,
        paymentMethod,
        isPaid,
        orderDate: orderTimestamp,
        clientName: clientName.trim() || undefined,
        clientPhone: clientPhone.trim() || undefined,
        manager: duplicateManager,
        orderSource,
        duplicateGroupId: groupId,
        isDuplicate: true,
      });

      toast.success("Дублированный заказ создан");
    } else {
      onAdd({
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

      toast.success("Заказ создан");
    }

    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPrice("");
    setOrderDate(new Date().toISOString().split('T')[0]);
    setCategory(undefined);
    setPaymentMethod(undefined);
    setIsPaid(false);
    setClientName("");
    setClientPhone("");
    setManager(undefined);
    setOrderSource(undefined);
    setIsDuplicateMode(false);
    setDuplicateManager(undefined);
    setDuplicatePrice("");
    setOriginalPrice("");
  };

  const handleAddOrderWithRepeatClient = () => {
    if (pendingOrderData && matchedClient) {
      onAdd({
        ...pendingOrderData,
        clientName: matchedClient.client.name,
        clientPhone: matchedClient.client.phone,
      });
    }
    
    resetForm();
    setShowRepeatClientDialog(false);
    setMatchedClient(null);
    setPendingOrderData(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto bg-white w-[calc(100%-32px)] max-w-[calc(100%-32px)] sm:w-full sm:max-w-[640px]">
        <DialogHeader className="border-b border-[#d2d2d7]/20 pb-2 mb-3">
          <DialogTitle className="text-base sm:text-lg font-normal text-[#1d1d1f]">Новый заказ</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* Описание - первое поле */}
          <div>
            <Label className="text-[10px] sm:text-xs font-normal text-[#86868b] uppercase tracking-wider mb-1">
              Описание задачи
            </Label>
            <Textarea
              value={description}
              onChange={handleDescriptionChange}
              placeholder="Вставьте описание заказа..."
              rows={3}
              className="bg-[#f5f5f7] border-0 rounded-[10px] text-xs sm:text-sm resize-none focus-visible:ring-1 focus-visible:ring-[#1d1d1f]/20"
            />
          </div>

          {/* Название */}
          <div>
            <Label className="text-[10px] sm:text-xs font-normal text-[#86868b] uppercase tracking-wider mb-1">
              Название заказа *
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Краткое название"
              required
              className="bg-[#f5f5f7] border-0 rounded-[10px] text-xs sm:text-sm h-8 sm:h-9 focus-visible:ring-1 focus-visible:ring-[#1d1d1f]/20"
            />
          </div>

          {/* Клиент - компактная секция */}
          <div className="p-2.5 sm:p-3 bg-[#f5f5f7]/50 rounded-[12px] space-y-2 sm:space-y-3">
            <div className="text-[10px] sm:text-xs font-normal text-[#86868b] uppercase tracking-wider">
              Информация о клиенте
            </div>
            
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              <div>
                <Input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Имя клиента"
                  className="bg-white border-0 rounded-[8px] text-xs sm:text-sm h-7 sm:h-8 focus-visible:ring-1 focus-visible:ring-[#1d1d1f]/20"
                />
              </div>
              <div>
                <Input
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="Телефон"
                  className="bg-white border-0 rounded-[8px] text-xs sm:text-sm h-7 sm:h-8 focus-visible:ring-1 focus-visible:ring-[#1d1d1f]/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              <Select value={manager} onValueChange={(value) => value && setManager(value as string)}>
                <SelectTrigger className="bg-white border-0 rounded-[8px] text-xs sm:text-sm h-7 sm:h-8 focus:ring-1 focus:ring-[#1d1d1f]/20">
                  <SelectValue placeholder="Менеджер" />
                </SelectTrigger>
                <SelectContent>
                  {managers.map((mgr) => (
                    <SelectItem key={mgr} value={mgr}>{mgr}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={orderSource} onValueChange={(value) => value && setOrderSource(value as OrderSource)}>
                <SelectTrigger className="bg-white border-0 rounded-[8px] text-xs sm:text-sm h-7 sm:h-8 focus:ring-1 focus:ring-[#1d1d1f]/20">
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

          {/* Дата и цен в одной строке */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div>
              <Label className="text-[10px] sm:text-xs font-normal text-[#86868b] uppercase tracking-wider mb-1">
                Дата *
              </Label>
              <Input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                required
                className="bg-[#f5f5f7] border-0 rounded-[10px] text-xs sm:text-sm h-8 sm:h-9 focus-visible:ring-1 focus-visible:ring-[#1d1d1f]/20"
              />
            </div>
            
            {!isDuplicateMode && (
              <div>
                <Label className="text-[10px] sm:text-xs font-normal text-[#86868b] uppercase tracking-wider mb-1">
                  Сумма (₽) *
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0"
                  required
                  className="bg-[#f5f5f7] border-0 rounded-[10px] text-xs sm:text-sm h-8 sm:h-9 focus-visible:ring-1 focus-visible:ring-[#1d1d1f]/20"
                />
              </div>
            )}
          </div>

          {/* Категория - компактные кнопки */}
          <div>
            <Label className="text-[10px] sm:text-xs font-normal text-[#86868b] uppercase tracking-wider mb-1.5 sm:mb-2">
              Категория *
            </Label>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {categories.map((cat) => {
                let displayName = cat;
                if (cat === "Штучные стикеры опт") displayName = "штучные";
                else if (cat === "Стикерпаки опт") displayName = "стикерпаки";
                else if (cat === "Штучные стикеры розница") displayName = "розница";
                
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-1.5 sm:px-2 py-1.5 sm:py-2 rounded-[8px] text-[9px] sm:text-[10px] font-normal transition-all ${
                      category === cat
                        ? "bg-[#9CD5FF] text-white"
                        : "bg-[#f5f5f7] text-[#86868b] hover:bg-[#C1E5FF]/50"
                    }`}
                  >
                    {displayName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Способ оплаты - компактные кнопки */}
          <div>
            <Label className="text-[10px] sm:text-xs font-normal text-[#86868b] uppercase tracking-wider mb-1.5 sm:mb-2">
              Способ платы *
            </Label>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {paymentMethods.map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`px-1.5 sm:px-2 py-1.5 sm:py-2 rounded-[8px] text-[9px] sm:text-[10px] font-normal transition-all ${
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

          {/* Переключатели - компактные */}
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
            <div className="flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 bg-[#f5f5f7] rounded-[8px]">
              <span className="text-[10px] sm:text-xs font-normal text-[#1d1d1f]">Оплачено</span>
              <Switch
                checked={isPaid}
                onCheckedChange={setIsPaid}
                className="data-[state=checked]:bg-[#1d1d1f] scale-75 sm:scale-100"
              />
            </div>

            <div className="flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 bg-[#f5f5f7] rounded-[8px]">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <Copy className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-[#86868b]" strokeWidth={1.5} />
                <span className="text-[10px] sm:text-xs font-normal text-[#1d1d1f]">Дубль</span>
              </div>
              <Switch
                checked={isDuplicateMode}
                onCheckedChange={(checked) => {
                  setIsDuplicateMode(checked);
                  if (checked && price) {
                    const halfPrice = parseFloat(price) / 2;
                    setOriginalPrice(halfPrice.toString());
                    setDuplicatePrice(halfPrice.toString());
                    const otherManager = managers.find(m => m !== manager);
                    setDuplicateManager(otherManager);
                  }
                }}
                className="data-[state=checked]:bg-[#1d1d1f] scale-75 sm:scale-100"
              />
            </div>
          </div>

          {/* Секция дублирования */}
          {isDuplicateMode && (
            <div className="space-y-2 p-2.5 sm:p-3 bg-[#f5f5f7]/50 rounded-[12px]">
              <div className="text-[10px] sm:text-xs font-normal text-[#86868b] uppercase tracking-wider mb-1.5 sm:mb-2">
                Распределение заказа
              </div>
              
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                {/* Первый менеджер */}
                <div className="p-2 sm:p-2.5 bg-white rounded-[8px] space-y-1.5 sm:space-y-2">
                  <div className="text-[9px] sm:text-[10px] text-[#86868b] uppercase tracking-wider">Менеджер 1</div>
                  <div className="text-[10px] sm:text-xs font-normal text-[#1d1d1f] px-1.5 sm:px-2 py-1 sm:py-1.5 bg-[#f5f5f7] rounded-[6px]">
                    {manager || "Не выбран"}
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="Сумма"
                    className="bg-[#f5f5f7] border-0 rounded-[6px] text-xs sm:text-sm h-7 sm:h-8"
                  />
                </div>

                {/* Второй менеджер */}
                <div className="p-2 sm:p-2.5 bg-white rounded-[8px] space-y-1.5 sm:space-y-2">
                  <div className="text-[9px] sm:text-[10px] text-[#86868b] uppercase tracking-wider">Менеджер 2</div>
                  <Select value={duplicateManager} onValueChange={(value) => value && setDuplicateManager(value as string)}>
                    <SelectTrigger className="bg-[#f5f5f7] border-0 rounded-[6px] text-[10px] sm:text-xs h-7 sm:h-8">
                      <SelectValue placeholder="Выбрать" />
                    </SelectTrigger>
                    <SelectContent>
                      {managers.map((mgr) => (
                        <SelectItem key={mgr} value={mgr}>{mgr}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    step="0.01"
                    value={duplicatePrice}
                    onChange={(e) => setDuplicatePrice(e.target.value)}
                    placeholder="Сумма"
                    className="bg-[#f5f5f7] border-0 rounded-[6px] text-xs sm:text-sm h-7 sm:h-8"
                  />
                </div>
              </div>

              {/* Итого */}
              <div className="flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 bg-[#1d1d1f] rounded-[8px] text-white">
                <span className="text-[10px] sm:text-xs font-normal uppercase tracking-wider">Итого</span>
                <span className="text-xs sm:text-sm font-normal">
                  {((parseFloat(originalPrice) || 0) + (parseFloat(duplicatePrice) || 0)).toLocaleString("ru-RU")} ₽
                </span>
              </div>
            </div>
          )}

          {/* Кнопки - компактные */}
          <div className="flex gap-1.5 sm:gap-2 pt-1 sm:pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose()}
              className="flex-1 h-8 sm:h-9 rounded-[10px] border-[#d2d2d7]/30 text-xs sm:text-sm font-normal hover:bg-[#f5f5f7]"
            >
              Отмена
            </Button>
            <Button 
              type="submit" 
              className="flex-[2] h-8 sm:h-9 bg-[#1d1d1f] hover:bg-[#1d1d1f]/90 text-white rounded-[10px] text-xs sm:text-sm font-normal"
            >
              Создать заказ
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* Диалог повторного клиента */}
      <AlertDialog open={showRepeatClientDialog} onOpenChange={setShowRepeatClientDialog}>
        <AlertDialogContent className="bg-white rounded-[16px]">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-[#f5f5f7] flex items-center justify-center">
                <Users className="w-5 h-5 text-[#1d1d1f]" strokeWidth={1.5} />
              </div>
              <AlertDialogTitle className="text-base font-normal text-[#1d1d1f]">
                Повторный клиент
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              {matchedClient && (
                <div className="space-y-3">
                  <p className="text-sm text-[#86868b]">
                    Клиент найден по {matchedClient.matchType === "both" ? "имени и телефону" : matchedClient.matchType === "name" ? "имени" : "телефону"}.
                  </p>
                  
                  <div className="p-3 rounded-[10px] bg-[#f5f5f7] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-normal text-[#1d1d1f]">{matchedClient.client.name}</span>
                      <span className="text-xs text-[#86868b]">{matchedClient.client.phone}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#d2d2d7]/20">
                      <div>
                        <p className="text-xs text-[#86868b]">Заказов</p>
                        <p className="text-sm font-normal text-[#1d1d1f]">{matchedClient.client.totalOrders}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#86868b]">Выручка</p>
                        <p className="text-sm font-normal text-[#1d1d1f]">
                          {Math.round(matchedClient.client.totalRevenue).toLocaleString("ru-RU")} ₽
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-[10px] border-[#d2d2d7]/30">
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleAddOrderWithRepeatClient}
              className="bg-[#1d1d1f] hover:bg-[#1d1d1f]/90 rounded-[10px]"
            >
              Добавить заказ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}