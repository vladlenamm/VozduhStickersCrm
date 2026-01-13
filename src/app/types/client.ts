import type { Manager, OrderSource } from "./order";

export interface Client {
  id: string;
  name: string;
  phone: string;
  manager?: Manager;
  orderSource?: OrderSource;
  orderIds: string[]; // ID заказов этого клиента
  createdAt: number;
  lastOrderDate: number;
  totalOrders: number;
  totalRevenue: number;
}

export interface ClientMatch {
  client: Client;
  matchType: "name" | "phone" | "both";
}
