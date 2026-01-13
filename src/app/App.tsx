import { useEffect, useState } from "react";
import { Order, UserRole } from "./types/order";
import { OrdersList } from "./components/OrdersList";
import { DirectorDashboard } from "./components/DirectorDashboard";
import { AddOrderModal } from "./components/AddOrderModal";
import { EditOrderModal } from "./components/EditOrderModal";
import { ClientsView } from "./components/ClientsView";
import { SettingsView } from "./components/SettingsView";
import { MyStats } from "./components/MyStats";
import { FinancesView } from "./components/FinancesView";
import { Client } from "./types/client";
import { Expense, Salary } from "./types/finance";
import { ManagerData } from "./types/manager";
import { LayoutDashboard, ShoppingBag, Users, Menu, X, Settings, Calculator, Wallet } from "lucide-react";
import { toast } from "sonner";

// Type for client match result
interface ClientMatch {
  client: Client;
  matchType: "both" | "name" | "phone";
}

// LocalStorage helpers
const STORAGE_KEY = "sticker-crm-orders";
const CLIENTS_STORAGE_KEY = "sticker-crm-clients";
const MANAGERS_STORAGE_KEY = "sticker-crm-managers";
const ORDER_SOURCES_STORAGE_KEY = "sticker-crm-order-sources";
const EXPENSES_STORAGE_KEY = "sticker-crm-expenses";
const SALARIES_STORAGE_KEY = "sticker-crm-salaries";
const USER_ROLE_STORAGE_KEY = "sticker-crm-user-role";

function loadOrders(): Order[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveOrders(orders: Order[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

function loadClients(): Client[] {
  const stored = localStorage.getItem(CLIENTS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveClients(clients: Client[]): void {
  localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
}

function loadManagers(): ManagerData[] {
  const stored = localStorage.getItem(MANAGERS_STORAGE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    // Поддержка старого формата (массив строк)
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
      return parsed.map((name: string) => ({ name, salaryPercentage: 22 }));
    }
    // Поддержка старого формата с salary вместо salaryPercentage
    if (Array.isArray(parsed) && parsed.length > 0 && 'salary' in parsed[0]) {
      return parsed.map((manager: any) => ({ 
        name: manager.name, 
        salaryPercentage: manager.salary || 22 
      }));
    }
    return parsed;
  }
  return [
    { name: "Софа", salaryPercentage: 22 },
    { name: "Лена", salaryPercentage: 22 }
  ]; // Default managers
}

function saveManagers(managers: ManagerData[]): void {
  localStorage.setItem(MANAGERS_STORAGE_KEY, JSON.stringify(managers));
}

function loadOrderSources(): string[] {
  const stored = localStorage.getItem(ORDER_SOURCES_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [
    "По совету знакомых",
    "Инстаграм",
    "Вконтакте",
    "Наши друзья",
    "Знакомые",
    "Повторный клиент"
  ]; // Default order sources
}

function saveOrderSources(sources: string[]): void {
  localStorage.setItem(ORDER_SOURCES_STORAGE_KEY, JSON.stringify(sources));
}

function loadExpenses(): Expense[] {
  const stored = localStorage.getItem(EXPENSES_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveExpenses(expenses: Expense[]): void {
  localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
}

function loadSalaries(): Salary[] {
  const stored = localStorage.getItem(SALARIES_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveSalaries(salaries: Salary[]): void {
  localStorage.setItem(SALARIES_STORAGE_KEY, JSON.stringify(salaries));
}

function loadUserRole(): UserRole {
  const stored = localStorage.getItem(USER_ROLE_STORAGE_KEY);
  return stored ? JSON.parse(stored) : "Менеджер"; // Default user role
}

function saveUserRole(role: UserRole): void {
  localStorage.setItem(USER_ROLE_STORAGE_KEY, JSON.stringify(role));
}

export default function App() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [managers, setManagers] = useState<ManagerData[]>([]);
  const [orderSources, setOrderSources] = useState<string[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [currentView, setCurrentView] = useState<"dashboard" | "orders" | "clients" | "mystats" | "settings" | "finances">("dashboard");
  const [userRole, setUserRole] = useState<UserRole>(loadUserRole());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Load data on mount
  useEffect(() => {
    setOrders(loadOrders());
    const loadedClients = loadClients();
    const loadedOrders = loadOrders();
    
    // Фильтруем клиентов, у которых есть хотя бы один заказ
    const validClients = loadedClients.filter(client => {
      // Проверяем, что у клиента есть orderIds и они действительно существуют в заказах
      const hasValidOrders = client.orderIds.some(orderId => 
        loadedOrders.some(order => order.id === orderId)
      );
      return hasValidOrders && client.totalOrders > 0;
    });
    
    // Если были удалены клиенты без заказов, сохраняем обновленный список
    if (validClients.length !== loadedClients.length) {
      saveClients(validClients);
    }
    
    setOrders(loadedOrders);
    setClients(validClients);
    setManagers(loadManagers());
    setOrderSources(loadOrderSources());
    setExpenses(loadExpenses());
    setSalaries(loadSalaries());
  }, []);

  // Автоматическое обновление базы клиентов при изменении заказов
  useEffect(() => {
    if (orders.length === 0) return; // Не пересчитываем если нет заказов
    
    const clientsMap = new Map<string, Client>();
    const processedDuplicates = new Set<string>();
    
    orders.forEach((order) => {
      if (!order.clientName || !order.clientPhone) return;

      const key = `${order.clientName}_${order.clientPhone}`;
      
      let orderPrice = order.price;
      
      if (order.duplicateGroupId) {
        if (processedDuplicates.has(order.duplicateGroupId)) {
          return;
        }
        
        const duplicateGroupOrders = orders.filter(
          o => o.duplicateGroupId === order.duplicateGroupId
        );
        
        orderPrice = duplicateGroupOrders.reduce((sum, o) => sum + o.price, 0);
        processedDuplicates.add(order.duplicateGroupId);
        
        if (clientsMap.has(key)) {
          const client = clientsMap.get(key)!;
          duplicateGroupOrders.forEach(o => {
            if (!client.orderIds.includes(o.id)) {
              client.orderIds.push(o.id);
            }
          });
          client.totalOrders += 1;
          client.totalRevenue += orderPrice;
          if (new Date(order.orderDate) > new Date(client.lastOrderDate)) {
            client.lastOrderDate = order.orderDate;
          }
        } else {
          clientsMap.set(key, {
            id: `client_${order.clientName}_${order.clientPhone}`,
            name: order.clientName,
            phone: order.clientPhone,
            manager: order.manager,
            orderIds: duplicateGroupOrders.map(o => o.id),
            totalOrders: 1,
            totalRevenue: orderPrice,
            lastOrderDate: order.orderDate,
            source: order.orderSource,
          });
        }
      } else {
        if (clientsMap.has(key)) {
          const client = clientsMap.get(key)!;
          client.orderIds.push(order.id);
          client.totalOrders += 1;
          client.totalRevenue += order.price;
          if (new Date(order.orderDate) > new Date(client.lastOrderDate)) {
            client.lastOrderDate = order.orderDate;
          }
        } else {
          clientsMap.set(key, {
            id: `client_${order.clientName}_${order.clientPhone}`,
            name: order.clientName,
            phone: order.clientPhone,
            manager: order.manager,
            orderIds: [order.id],
            totalOrders: 1,
            totalRevenue: order.price,
            lastOrderDate: order.orderDate,
            source: order.orderSource,
          });
        }
      }
    });

    const rebuiltClients = Array.from(clientsMap.values());
    setClients(rebuiltClients);
    saveClients(rebuiltClients);
  }, [orders]); // Пересчитываем клиентов каждый раз когда меняются заказы

  const findMatchingClient = (order: Order): ClientMatch | null => {
    if (!order.clientName || !order.clientPhone) return null;

    for (const client of clients) {
      const nameMatch = client.name.toLowerCase() === order.clientName.toLowerCase();
      const phoneMatch = client.phone === order.clientPhone;

      if (nameMatch && phoneMatch) {
        return { client, matchType: "both" };
      } else if (nameMatch) {
        return { client, matchType: "name" };
      } else if (phoneMatch) {
        return { client, matchType: "phone" };
      }
    }

    return null;
  };

  const handleAddOrder = (newOrder: Order) => {
    // Добавляем createdAt и id если их нет
    const orderWithMetadata = {
      ...newOrder,
      id: newOrder.id || `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(), // Устанавливем время создания
    };
    
    setOrders((prevOrders) => {
      const updatedOrders = [...prevOrders, orderWithMetadata];
      saveOrders(updatedOrders);
      return updatedOrders;
    });
    // Клиенты обновятся автоматически через useEffect
  };

  const handleTogglePaid = (id: string) => {
    setOrders((prevOrders) => {
      const orderToToggle = prevOrders.find((order) => order.id === id);
      if (!orderToToggle) return prevOrders;

      if (orderToToggle.duplicateGroupId) {
        // Для дублированных заказов - переключаем всю группу
        const updatedOrders = prevOrders.map((order) =>
          order.duplicateGroupId === orderToToggle.duplicateGroupId
            ? { ...order, isPaid: !orderToToggle.isPaid }
            : order
        );
        saveOrders(updatedOrders);
        return updatedOrders;
      } else {
        // Для обычных заказов - переключаем только оди
        const updatedOrders = prevOrders.map((order) =>
          order.id === id ? { ...order, isPaid: !order.isPaid } : order
        );
        saveOrders(updatedOrders);
        return updatedOrders;
      }
    });
  };

  const handleDeleteOrder = (id: string) => {
    const updatedOrders = orders.filter((order) => order.id !== id);
    setOrders(updatedOrders);
    saveOrders(updatedOrders);
    // Клиенты обновятся автоматически через useEffect
  };

  const handleEditOrder = (orderId: string, updatedData: Partial<Order>) => {
    const updatedOrders = orders.map((order) =>
      order.id === orderId ? { ...order, ...updatedData } : order
    );
    setOrders(updatedOrders);
    saveOrders(updatedOrders);
  };

  const openEditModal = (order: Order) => {
    setEditingOrder(order);
  };

  const handleAddManager = (name: string, salary: number = 0) => {
    const updatedManagers = [...managers, { name, salaryPercentage: salary }];
    setManagers(updatedManagers);
    saveManagers(updatedManagers);
  };

  const handleUpdateManagerSalary = (name: string, salary: number) => {
    const updatedManagers = managers.map((m) =>
      m.name === name ? { ...m, salaryPercentage: salary } : m
    );
    setManagers(updatedManagers);
    saveManagers(updatedManagers);
  };

  const handleDeleteManager = (name: string) => {
    const updatedManagers = managers.filter((m) => m.name !== name);
    setManagers(updatedManagers);
    saveManagers(updatedManagers);
  };

  const handleAddOrderSource = (source: string) => {
    const updatedSources = [...orderSources, source];
    setOrderSources(updatedSources);
    saveOrderSources(updatedSources);
  };

  const handleDeleteOrderSource = (source: string) => {
    const updatedSources = orderSources.filter((s) => s !== source);
    setOrderSources(updatedSources);
    saveOrderSources(updatedSources);
  };

  const handleClearAllData = () => {
    if (confirm("⚠️ ВНИМАНИЕ! Вы уврены, что хотите удалить ВСЕ заказы и клиентов? Это действие нельзя отменить!")) {
      // Очищаем все данные из localStorage
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(CLIENTS_STORAGE_KEY);
      
      // Обновляем состояние
      setOrders([]);
      setClients([]);
      
      toast.success("Все данные успшно очищены!");
    }
  };

  // Обработчики финансов
  const handleAddExpense = (expense: Expense) => {
    const updatedExpenses = [...expenses, expense];
    setExpenses(updatedExpenses);
    saveExpenses(updatedExpenses);
  };

  const handleDeleteExpense = (id: string) => {
    const updatedExpenses = expenses.filter((e) => e.id !== id);
    setExpenses(updatedExpenses);
    saveExpenses(updatedExpenses);
  };

  const handleAddSalary = (salary: Salary) => {
    const updatedSalaries = [...salaries, salary];
    setSalaries(updatedSalaries);
    saveSalaries(updatedSalaries);
  };

  const handleDeleteSalary = (id: string) => {
    const updatedSalaries = salaries.filter((s) => s.id !== id);
    setSalaries(updatedSalaries);
    saveSalaries(updatedSalaries);
  };

  const handleToggleSalaryPaid = (id: string) => {
    const updatedSalaries = salaries.map((salary) =>
      salary.id === id
        ? {
            ...salary,
            isPaid: !salary.isPaid,
            paidDate: !salary.isPaid ? new Date().toISOString().split("T")[0] : undefined,
          }
        : salary
    );
    setSalaries(updatedSalaries);
    saveSalaries(updatedSalaries);
  };

  // Навигация
  const menuItems = [
    { id: "dashboard" as const, label: "Дашборд", icon: LayoutDashboard, roles: ["Менеджер"] as UserRole[] },
    { id: "orders" as const, label: "Заказы", icon: ShoppingBag, roles: ["Менеджер", "Софа", "Лена"] as UserRole[] },
    { id: "clients" as const, label: "Клиенты", icon: Users, roles: ["Менеджер"] as UserRole[] },
    { 
      id: "mystats" as const, 
      label: userRole === "Софа" || userRole === "Лена" ? "Зарплата" : "Менеджеры", 
      icon: Calculator, 
      roles: ["Менеджер", "Софа", "Лена"] as UserRole[] 
    },
    { id: "settings" as const, label: "Настройки", icon: Settings, roles: ["Менеджер"] as UserRole[] },
    { id: "finances" as const, label: "Финансы", icon: Wallet, roles: ["Менеджер"] as UserRole[] },
  ];

  const filteredNavItems = menuItems.filter((item) => {
    return item.roles.includes(userRole);
  });

  const toggleUserRole = () => {
    let newRole: UserRole;
    
    // Циклическое переключение: Менеджер -> Софа -> Лена -> Менеджер
    if (userRole === "Менеджер") {
      newRole = "Софа";
    } else if (userRole === "Софа") {
      newRole = "Лена";
    } else {
      newRole = "Менеджер";
    }
    
    setUserRole(newRole);
    saveUserRole(newRole);
    
    // Если текущая вкладка недоступна для новой роли, переходим на первую доступную
    const isCurrentViewAvailable = menuItems.find(item => item.id === currentView)?.roles.includes(newRole);
    if (!isCurrentViewAvailable) {
      setCurrentView(newRole === "Менеджер" ? "dashboard" : "orders");
    }
    
    toast.success(`Переключено на роль: ${newRole}`);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Header */}
      <header className="bg-white border-b border-[#e5e5ea] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-5 h-5 text-[#9CD5FF]" />
              <h1 className="text-xl font-semibold text-[#1d1d1f] text-[15px]">vozduh stickers</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      currentView === item.id
                        ? "bg-neutral-100 text-neutral-900"
                        : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
              
              {/* Тестовая кнопка переключения роли */}
              <button
                onClick={toggleUserRole}
                className="ml-3 px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-[#9CD5FF] text-white hover:bg-[#C1E5FF]"
                title="Тестовая кнопка переключения роли"
              >
                {userRole}
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-neutral-900" />
              ) : (
                <Menu className="w-6 h-6 text-neutral-900" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <nav className="md:hidden py-4 border-t border-neutral-200">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      currentView === item.id
                        ? "bg-neutral-100 text-neutral-900"
                        : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === "dashboard" && (
          <DirectorDashboard
            orders={orders}
            clients={clients}
            onNavigateToOrders={() => setCurrentView("orders")}
          />
        )}

        {currentView === "orders" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-[#1d1d1f]">Заказы</h1>
                <p className="text-[#86868b] mt-1">Управление заказами стикеров</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2.5 bg-[#9CD5FF] text-white rounded-xl hover:bg-[#C1E5FF] transition-colors font-normal text-sm"
              >
                + Новый заказ
              </button>
            </div>

            <OrdersList
              orders={orders}
              onTogglePaid={handleTogglePaid}
              onDelete={userRole === "Менеджер" ? handleDeleteOrder : undefined}
              onEdit={openEditModal}
              showDelete={userRole === "Менеджер"}
              managers={managers.map(m => m.name)}
            />
          </div>
        )}

        {currentView === "clients" && (
          <ClientsView 
            clients={clients} 
            orders={orders}
            managers={managers.map(m => m.name)}
            orderSources={orderSources}
            onEditOrder={handleEditOrder}
          />
        )}

        {currentView === "mystats" && (
          <MyStats orders={orders} managers={managers.map(m => m.name)} currentUser={userRole} />
        )}

        {currentView === "settings" && (
          <SettingsView
            userRole={userRole}
            onRoleChange={setUserRole}
            managers={managers}
            onAddManager={handleAddManager}
            onUpdateManagerSalary={handleUpdateManagerSalary}
            onDeleteManager={handleDeleteManager}
            orderSources={orderSources}
            onAddOrderSource={handleAddOrderSource}
            onDeleteOrderSource={handleDeleteOrderSource}
            onClearAllData={handleClearAllData}
          />
        )}

        {currentView === "finances" && (
          <FinancesView
            orders={orders}
            managersData={managers}
            expenses={expenses}
            salaries={salaries}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
            onAddSalary={handleAddSalary}
            onDeleteSalary={handleDeleteSalary}
            onToggleSalaryPaid={handleToggleSalaryPaid}
          />
        )}
      </main>

      {/* Modals */}
      <AddOrderModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddOrder}
        managers={managers.map(m => m.name)}
        orderSources={orderSources}
      />

      {editingOrder && (
        <EditOrderModal
          open={!!editingOrder}
          onOpenChange={(open) => {
            if (!open) setEditingOrder(null);
          }}
          onEditOrder={(orderId, updatedData) => {
            handleEditOrder(orderId, updatedData);
            setEditingOrder(null);
          }}
          order={editingOrder}
          managers={managers.map(m => m.name)}
          orderSources={orderSources}
        />
      )}
    </div>
  );
}