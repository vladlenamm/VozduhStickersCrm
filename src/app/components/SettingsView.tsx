import { useState } from "react";
import { Trash2, Plus, UserCog, AlertCircle, Target, Database, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { UserRole } from "../types/order";
import { ManagerData } from "../types/manager";

interface SettingsViewProps {
  userRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  managers: ManagerData[];
  onAddManager: (name: string, percentage: number) => void;
  onUpdateManagerSalary: (name: string, percentage: number) => void;
  onDeleteManager: (name: string) => void;
  orderSources: string[];
  onAddOrderSource: (source: string) => void;
  onDeleteOrderSource: (source: string) => void;
  onClearAllData?: () => void;
}

export function SettingsView({ 
  userRole,
  onRoleChange,
  managers, 
  onAddManager, 
  onUpdateManagerSalary,
  onDeleteManager,
  orderSources,
  onAddOrderSource,
  onDeleteOrderSource,
  onClearAllData
}: SettingsViewProps) {
  const [newManagerName, setNewManagerName] = useState("");
  const [newManagerPercentage, setNewManagerPercentage] = useState("");
  const [newOrderSource, setNewOrderSource] = useState("");
  const [editingManager, setEditingManager] = useState<string | null>(null);
  const [editingPercentage, setEditingPercentage] = useState("");

  const handleAddManager = () => {
    const trimmedName = newManagerName.trim();
    const percentage = parseFloat(newManagerPercentage);
    
    if (!trimmedName) {
      toast.error("Введите имя менеджера");
      return;
    }

    if (managers.some(manager => manager.name === trimmedName)) {
      toast.error("Менеджер с таким именем уже существует");
      return;
    }

    if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
      toast.error("Введите корректный процент от 1 до 100");
      return;
    }

    onAddManager(trimmedName, percentage);
    setNewManagerName("");
    setNewManagerPercentage("");
    toast.success(`Менеджер "${trimmedName}" добавлен с процентом ${percentage}%`);
  };

  const handleDeleteManager = (name: string) => {
    if (managers.length === 1) {
      toast.error("Нельзя удалить последнего менеджера");
      return;
    }

    if (confirm(`Вы уверены, что хотите удалить менеджера "${name}"?`)) {
      onDeleteManager(name);
      toast.success(`Менеджер "${name}" удален`);
    }
  };

  const handleAddOrderSource = () => {
    const trimmedSource = newOrderSource.trim();
    
    if (!trimmedSource) {
      toast.error("Введите источник заказа");
      return;
    }

    if (orderSources.includes(trimmedSource)) {
      toast.error("Источник заказа с таким названием уже существует");
      return;
    }

    onAddOrderSource(trimmedSource);
    setNewOrderSource("");
    toast.success(`Источник заказа "${trimmedSource}" добавлен`);
  };

  const handleDeleteOrderSource = (source: string) => {
    if (orderSources.length === 1) {
      toast.error("Нельзя удалить последний источник заказа");
      return;
    }

    if (confirm(`Вы уверены, что хотите удалить источник заказа "${source}"?`)) {
      onDeleteOrderSource(source);
      toast.success(`Источник заказа "${source}" удален`);
    }
  };

  const handleEditManager = (name: string) => {
    setEditingManager(name);
    const manager = managers.find(m => m.name === name);
    if (manager) {
      setEditingPercentage(manager.salaryPercentage.toString());
    }
  };

  const handleSaveManager = () => {
    if (!editingManager) return;
    const percentage = parseFloat(editingPercentage);
    if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
      toast.error("Введите корректный процент от 1 до 100");
      return;
    }
    onUpdateManagerSalary(editingManager, percentage);
    setEditingManager(null);
    setEditingPercentage("");
    toast.success(`Процент менеджера "${editingManager}" обновлен на ${percentage}%`);
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="max-w-[1400px] mx-auto space-y-3">
          {/* Компактный заголовок */}
          <div>
            <h1 className="text-2xl font-normal text-[#1d1d1f] tracking-tight">Настройки</h1>
            <p className="text-xs text-[#86868b] mt-0.5">
              Управление менеджерами и источниками заказов
            </p>
          </div>

          {/* 2 колонки: Менеджеры и Источники */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Менеджеры */}
            <div className="bg-white border border-[#d2d2d7]/30 rounded-[12px] p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <UserCog className="w-4 h-4 text-[#86868b]" strokeWidth={1.5} />
                <span className="text-sm font-normal text-[#1d1d1f]">Менеджеры</span>
              </div>

              {/* Форма добавления менеджера */}
              <div className="space-y-2 mb-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Имя менеджера"
                    value={newManagerName}
                    onChange={(e) => setNewManagerName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddManager();
                      }
                    }}
                    className="flex-1 px-3 py-2 border-0 bg-[#f5f5f7] rounded-[8px] text-sm text-[#1d1d1f] placeholder:text-[#86868b] focus:ring-1 focus:ring-[#9CD5FF]"
                  />
                  <input
                    type="number"
                    placeholder="%"
                    value={newManagerPercentage}
                    onChange={(e) => setNewManagerPercentage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddManager();
                      }
                    }}
                    className="w-20 px-3 py-2 border-0 bg-[#f5f5f7] rounded-[8px] text-sm text-[#1d1d1f] placeholder:text-[#86868b] focus:ring-1 focus:ring-[#9CD5FF]"
                  />
                  <button
                    onClick={handleAddManager}
                    className="px-3 py-2 bg-[#9CD5FF] text-white rounded-[8px] hover:bg-[#C1E5FF] transition-colors inline-flex items-center gap-1.5 text-sm font-normal"
                  >
                    <Plus className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              {/* Список менеджеров */}
              {managers.length === 0 ? (
                <p className="text-xs text-[#86868b] text-center py-6">
                  Нет менеджеров
                </p>
              ) : (
                <div className="space-y-1.5">
                  {managers.map((manager) => (
                    <div
                      key={manager.name}
                      className="flex items-center justify-between p-2 rounded-[8px] bg-[#f5f5f7] hover:bg-[#e8e8ed] transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center">
                          <span className="text-xs font-normal text-[#1d1d1f]">
                            {manager.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-normal text-[#1d1d1f]">{manager.name}</p>
                          <p className="text-[10px] text-[#86868b]">{manager.salaryPercentage || 0}%</p>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditManager(manager.name)}
                          className="p-1.5 rounded-[6px] text-[#86868b] hover:bg-[#d2d2d7] transition-colors"
                          title="Редактировать"
                        >
                          <Edit2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                        <button
                          onClick={() => handleDeleteManager(manager.name)}
                          className="p-1.5 rounded-[6px] text-[#ff3b30] hover:bg-red-50 transition-colors"
                          title="Удалить"
                        >
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Форма редактирования */}
              {editingManager && (
                <div className="mt-3 p-2 rounded-[8px] bg-[#C1E5FF]/20 border border-[#9CD5FF]">
                  <p className="text-xs text-[#1d1d1f] mb-2">Изменить процент для {editingManager}</p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Процент"
                      value={editingPercentage}
                      onChange={(e) => setEditingPercentage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSaveManager();
                        }
                      }}
                      className="flex-1 px-3 py-2 border-0 bg-white rounded-[8px] text-sm text-[#1d1d1f] focus:ring-1 focus:ring-[#9CD5FF]"
                    />
                    <button
                      onClick={handleSaveManager}
                      className="px-3 py-2 bg-[#9CD5FF] text-white rounded-[8px] hover:bg-[#C1E5FF] transition-colors text-sm font-normal"
                    >
                      Сохранить
                    </button>
                    <button
                      onClick={() => setEditingManager(null)}
                      className="px-3 py-2 bg-[#e8e8ed] text-[#1d1d1f] rounded-[8px] hover:bg-[#d2d2d7] transition-colors text-sm font-normal"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              )}

              {/* Warning */}
              {managers.length > 0 && (
                <div className="mt-3 p-2 rounded-[8px] bg-[#FFF4E6] border border-[#FFE4CC] flex gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-[#FF9500] flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                  <p className="text-[10px] text-[#1d1d1f] leading-relaxed">
                    При удалении менеджера существующие заказы сохранят его имя в истории
                  </p>
                </div>
              )}
            </div>

            {/* Источники заказов */}
            <div className="bg-white border border-[#d2d2d7]/30 rounded-[12px] p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-[#86868b]" strokeWidth={1.5} />
                <span className="text-sm font-normal text-[#1d1d1f]">Источники заказов</span>
              </div>

              {/* Форма добавления источника */}
              <div className="space-y-2 mb-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Название источника"
                    value={newOrderSource}
                    onChange={(e) => setNewOrderSource(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddOrderSource();
                      }
                    }}
                    className="flex-1 px-3 py-2 border-0 bg-[#f5f5f7] rounded-[8px] text-sm text-[#1d1d1f] placeholder:text-[#86868b] focus:ring-1 focus:ring-[#9CD5FF]"
                  />
                  <button
                    onClick={handleAddOrderSource}
                    className="px-3 py-2 bg-[#9CD5FF] text-white rounded-[8px] hover:bg-[#C1E5FF] transition-colors inline-flex items-center gap-1.5 text-sm font-normal"
                  >
                    <Plus className="w-4 h-4" strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              {/* Список источников */}
              {orderSources.length === 0 ? (
                <p className="text-xs text-[#86868b] text-center py-6">
                  Нет источников
                </p>
              ) : (
                <div className="space-y-1.5">
                  {orderSources.map((source) => (
                    <div
                      key={source}
                      className="flex items-center justify-between p-2 rounded-[8px] bg-[#f5f5f7] hover:bg-[#e8e8ed] transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center">
                          <Target className="w-3.5 h-3.5 text-[#86868b]" strokeWidth={1.5} />
                        </div>
                        <p className="text-sm font-normal text-[#1d1d1f]">{source}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteOrderSource(source)}
                        className="p-1.5 rounded-[6px] text-[#ff3b30] hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                        title="Удалить"
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Warning */}
              {orderSources.length > 0 && (
                <div className="mt-3 p-2 rounded-[8px] bg-[#FFF4E6] border border-[#FFE4CC] flex gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-[#FF9500] flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                  <p className="text-[10px] text-[#1d1d1f] leading-relaxed">
                    При удалении источника существующие заказы сохранят его имя в истории
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Очистка данных */}
          {onClearAllData && (
            <div className="bg-white border border-[#d2d2d7]/30 rounded-[12px] p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-4 h-4 text-[#86868b]" strokeWidth={1.5} />
                <span className="text-sm font-normal text-[#1d1d1f]">Очистка всех данных</span>
              </div>

              <div className="p-3 rounded-[8px] bg-[#FFF4E6] border border-[#FFE4CC]">
                <div className="flex items-start gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-[#FF9500] flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                  <p className="text-xs text-[#1d1d1f] leading-relaxed">
                    Эта функция удалит все данные из системы, включая заказы, клиентов и менеджеров. 
                    Используйте с осторожностью.
                  </p>
                </div>
                
                <button
                  onClick={onClearAllData}
                  className="w-full px-4 py-2 bg-[#1d1d1f] text-white rounded-[8px] hover:bg-[#2d2d2f] transition-colors inline-flex items-center justify-center gap-2 text-sm font-normal"
                >
                  <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                  Очистить все данные
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
