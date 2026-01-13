import { useMemo, useState } from "react";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Order } from "../types/order";
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { TrendingUp, DollarSign, ShoppingCart, Users, Calendar as CalendarIcon } from "lucide-react";

interface ManagerProfileProps {
  orders: Order[];
}

export function ManagerProfile({ orders }: ManagerProfileProps) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filteredOrders = useMemo(() => {
    if (!dateFrom && !dateTo) return orders;

    return orders.filter((order) => {
      const orderDate = new Date(order.orderDate);
      const fromDate = dateFrom ? new Date(dateFrom) : null;
      const toDate = dateTo ? new Date(dateTo) : null;

      if (fromDate && orderDate < fromDate) return false;
      if (toDate && orderDate > new Date(toDate.getTime() + 24 * 60 * 60 * 1000 - 1)) return false;

      return true;
    });
  }, [orders, dateFrom, dateTo]);

  const analytics = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const paidOrders = filteredOrders.filter((o) => o.isPaid).length;
    const totalRevenue = filteredOrders.filter((o) => o.isPaid).reduce((sum, o) => sum + o.price, 0);
    const pendingRevenue = filteredOrders.filter((o) => !o.isPaid).reduce((sum, o) => sum + o.price, 0);

    // Выручка по категориям
    const categoryRevenue = filteredOrders
      .filter((o) => o.isPaid)
      .reduce((acc, order) => {
        acc[order.category] = (acc[order.category] || 0) + order.price;
        return acc;
      }, {} as Record<string, number>);

    const categoryData = Object.entries(categoryRevenue).map(([name, value]) => ({
      name: name.replace(" опт", "").replace(" розница", ""),
      value,
      fullName: name,
    }));

    // Статистика по сотрудникам
    const employeeStats = filteredOrders.reduce((acc, order) => {
      const emp = order.employee || "Не указан";
      if (!acc[emp]) {
        acc[emp] = { name: emp, orders: 0, revenue: 0, paid: 0 };
      }
      acc[emp].orders += 1;
      if (order.isPaid) {
        acc[emp].revenue += order.price;
        acc[emp].paid += 1;
      }
      return acc;
    }, {} as Record<string, { name: string; orders: number; revenue: number; paid: number }>);

    const employeeData = Object.values(employeeStats).sort((a, b) => b.revenue - a.revenue);

    return {
      totalOrders,
      paidOrders,
      totalRevenue,
      pendingRevenue,
      categoryData,
      employeeData,
    };
  }, [filteredOrders]);

  const COLORS = ["#0a0a0a", "#404040", "#737373", "#a3a3a3", "#d4d4d4"];

  return (
    <div className="space-y-6 pb-6">
      {/* Period Filter */}
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-3 mb-4">
          <CalendarIcon className="w-5 h-5 text-primary" />
          <h3 className="text-foreground">Выберите период</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dateFrom">Дата от</Label>
            <Input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateTo">Дата до</Label>
            <Input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-input"
            />
          </div>
        </div>
        {(dateFrom || dateTo) && (
          <p className="mt-3 text-sm text-muted-foreground">
            Показано заказов: {filteredOrders.length} из {orders.length}
          </p>
        )}
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Всего заказов</p>
              <p className="text-3xl text-foreground">{analytics.totalOrders}</p>
              <p className="text-xs text-muted-foreground">
                {analytics.paidOrders} оплачено
              </p>
            </div>
            <ShoppingCart className="w-10 h-10 text-muted-foreground opacity-30" />
          </div>
        </Card>

        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Выручка</p>
              <p className="text-3xl text-green-600">
                {analytics.totalRevenue.toLocaleString("ru-RU")} ₽
              </p>
              <p className="text-xs text-muted-foreground">Оплаченные</p>
            </div>
            <DollarSign className="w-10 h-10 text-green-600 opacity-30" />
          </div>
        </Card>

        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Ожидает оплаты</p>
              <p className="text-3xl text-amber-600">
                {analytics.pendingRevenue.toLocaleString("ru-RU")} ₽
              </p>
              <p className="text-xs text-muted-foreground">
                {analytics.totalOrders - analytics.paidOrders} заказов
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-amber-600 opacity-30" />
          </div>
        </Card>

        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Конверсия</p>
              <p className="text-3xl text-foreground">
                {analytics.totalOrders > 0
                  ? Math.round((analytics.paidOrders / analytics.totalOrders) * 100)
                  : 0}
                %
              </p>
              <p className="text-xs text-muted-foreground">Оплаченных заказов</p>
            </div>
            <TrendingUp className="w-10 h-10 text-muted-foreground opacity-30" />
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Category */}
        <Card className="p-6 bg-card border-border">
          <h3 className="mb-4 text-foreground">Выручка по категориям</h3>
          {analytics.categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `${value.toLocaleString("ru-RU")} ₽`}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Нет данных
            </div>
          )}
        </Card>

        {/* Category Stats Table */}
        <Card className="p-6 bg-card border-border">
          <h3 className="mb-4 text-foreground">Детали по категориям</h3>
          {analytics.categoryData.length > 0 ? (
            <div className="space-y-3">
              {analytics.categoryData.map((cat, index) => (
                <div
                  key={cat.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm">{cat.fullName}</span>
                  </div>
                  <span className="font-medium">{cat.value.toLocaleString("ru-RU")} ₽</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
              Нет данных
            </div>
          )}
        </Card>
      </div>

      {/* Employee Statistics */}
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="text-foreground">Статистика по сотрудникам</h3>
        </div>

        {analytics.employeeData.length > 0 ? (
          <>
            {/* Bar Chart */}
            <div className="mb-8">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.employeeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="name" stroke="#737373" />
                  <YAxis stroke="#737373" />
                  <Tooltip
                    formatter={(value: number) => `${value.toLocaleString("ru-RU")} ₽`}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e5e5e5",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#0a0a0a" name="Выручка" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Employee Details Table */}
            <div className="space-y-3">
              {analytics.employeeData.map((emp, index) => (
                <div
                  key={emp.name}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{emp.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {emp.orders} {emp.orders === 1 ? "заказ" : "заказов"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Выручка</p>
                      <p className="font-medium">{emp.revenue.toLocaleString("ru-RU")} ₽</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Оплачено</p>
                      <p className="font-medium">
                        {emp.paid} / {emp.orders}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Конверсия</p>
                      <p className="font-medium">
                        {emp.orders > 0 ? Math.round((emp.paid / emp.orders) * 100) : 0}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            Нет данных по сотрудникам
          </div>
        )}
      </Card>
    </div>
  );
}