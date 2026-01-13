export type Category = "Штучные стикеры опт" | "Стикерпаки опт" | "Штучные стикеры розница";
export type PaymentMethod = "Карта" | "Наличные" | "Терминал" | "РС";
export type Manager = "Софа" | "Лена";
export type OrderSource = string; // Теперь это просто строка, так как источники могут быть динамическими

export interface Order {
  id: string;
  title: string;
  fullDescription: string;
  price: number;
  category: Category;
  paymentMethod: PaymentMethod;
  isPaid: boolean;
  orderDate: number; // Дата заказа
  createdAt: number; // Дата создания в системе
  // Карточка клиента
  clientName?: string; // Имя клиента
  clientPhone?: string; // Номер телефона клиента
  manager?: Manager; // Менеджер
  orderSource?: OrderSource; // Источник заказа
  // Дубликаты заказов
  duplicateGroupId?: string; // ID группы дублированных заказов
  isDuplicate?: boolean; // Флаг дубликата
}

export type UserRole = "Менеджер" | "Софа" | "Лена";