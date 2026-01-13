import { Order } from "../types/order";

const ORDERS_KEY = "sticker_crm_orders";

export const loadOrders = (): Order[] => {
  try {
    const data = localStorage.getItem(ORDERS_KEY);
    const orders = data ? JSON.parse(data) : [];
    
    // Миграция старых заказов: добавляем orderDate если его нет, employee может быть undefined
    return orders.map((order: Order) => ({
      ...order,
      orderDate: order.orderDate || order.createdAt, // Используем createdAt как дату заказа, если orderDate отсутствует
      employee: order.employee || undefined, // employee опциональный
    }));
  } catch (error) {
    console.error("Failed to load orders:", error);
    return [];
  }
};

export const saveOrders = (orders: Order[]): void => {
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch (error) {
    console.error("Failed to save orders:", error);
  }
};