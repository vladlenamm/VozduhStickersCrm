import { useMemo } from "react";
import { Order } from "../types/order";
import { Card } from "./ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, PieChartIcon } from "lucide-react";

interface DashboardProps {
  orders: Order[];
}

export function Dashboard({ orders }: DashboardProps) {
  const analytics = useMemo(() => {
    const totalRevenue = orders.filter(o => o.isPaid).reduce((sum, o) => sum + o.price, 0);
    const pendingPayments = orders.filter(o => !o.isPaid).reduce((sum, o) => sum + o.price, 0);

    // Revenue by category
    const categoryRevenue = orders
      .filter(o => o.isPaid)
      .reduce((acc, order) => {
        acc[order.category] = (acc[order.category] || 0) + order.price;
        return acc;
      }, {} as Record<string, number>);

    const categoryData = Object.entries(categoryRevenue).map(([name, value]) => ({
      name,
      value,
    }));

    // Revenue by payment method
    const paymentRevenue = orders
      .filter(o => o.isPaid)
      .reduce((acc, order) => {
        acc[order.paymentMethod] = (acc[order.paymentMethod] || 0) + order.price;
        return acc;
      }, {} as Record<string, number>);

    const paymentData = Object.entries(paymentRevenue).map(([name, value]) => ({
      name,
      value,
    }));

    return {
      totalRevenue,
      pendingPayments,
      categoryData,
      paymentData,
      totalOrders: orders.length,
      paidOrders: orders.filter(o => o.isPaid).length,
    };
  }, [orders]);

  const COLORS = ['#ededed', '#a3a3a3', '#737373', '#525252', '#404040'];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm text-foreground">{payload[0].name}</p>
          <p className="text-sm text-primary">
            {payload[0].value.toLocaleString('ru-RU')} ₽
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-5 sm:p-6 bg-gradient-to-br from-[#cdd629]/10 to-[#cdd629]/5 border-[#cdd629]/30 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Общая выручка</p>
              <p className="text-2xl sm:text-3xl text-[#cdd629]">
                {analytics.totalRevenue.toLocaleString('ru-RU')} ₽
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {analytics.paidOrders} из {analytics.totalOrders} заказов оплачено
              </p>
            </div>
            <div className="p-3 bg-neutral-100 rounded-xl">
              <TrendingUp className="w-5 h-5 text-neutral-900" />
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-6 bg-white border-neutral-200 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Средний чек</p>
              <p className="text-2xl sm:text-3xl text-neutral-900">
                {analytics.paidOrders > 0
                  ? Math.round(analytics.totalRevenue / analytics.paidOrders).toLocaleString('ru-RU')
                  : 0}{' '}
                ₽
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                На основе оплаченных заказов
              </p>
            </div>
            <div className="p-3 bg-neutral-100 rounded-xl">
              <DollarSign className="w-5 h-5 text-neutral-900" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue by Category */}
        <Card className="p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <PieChartIcon className="w-5 h-5 text-[#86868b]" />
            <span className="text-foreground">Выручка по категориям</span>
          </div>
          {analytics.categoryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={analytics.categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${Math.round((entry.value / analytics.totalRevenue) * 100)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    style={{ fontSize: '12px', fontWeight: 500 }}
                  >
                    {analytics.categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {analytics.categoryData.map((category, index) => (
                  <div
                    key={category.name}
                    className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-xs">{category.name}</span>
                    </div>
                    <span className="text-xs font-medium">
                      {category.value.toLocaleString("ru-RU")} ₽
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
              Нет оплаченных заказов
            </div>
          )}
        </Card>

        {/* Revenue by Payment Method */}
        <Card className="p-5 sm:p-6 shadow-sm">
          <h3 className="mb-4 text-foreground">Выручка по способам оплаты</h3>
          {analytics.paymentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.paymentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#86868b', fontSize: 12 }}
                  stroke="rgba(0,0,0,0.1)"
                />
                <YAxis 
                  tick={{ fill: '#86868b', fontSize: 12 }}
                  stroke="rgba(0,0,0,0.1)"
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#5558af" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
              Нет оплаченных заказов
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}