"use client";

import { useState, useEffect } from "react";

import {
  loadManageData,
  saveTask,
  removeTask,
  addSector,
  removeSector,
  checkAndRemoveSector,
} from "@/lib/services/manageService";

const ITEMS_PER_PAGE = 8;

export default function ManagePage() {
  const [filterUser, setFilterUser] = useState("");
  const [sectorError, setSectorError] = useState("");
  const [sectorSuccess, setSectorSuccess] = useState("");
  const [showDeleteSectorConfirm, setShowDeleteSectorConfirm] = useState(null);
  const [calendarMode, setCalendarMode] = useState("single");
  const [selectedDates, setSelectedDates] = useState([]);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [filterSector, setFilterSector] = useState("");
  const [newSector, setNewSector] = useState("");
  const [showSectorForm, setShowSectorForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    sector_id: "",
    assigned_to: "",
    assigned_users: [],
    date_start: "",
    date_end: "",
  });

  useEffect(() => {
    loadData();
  }, []);
  useEffect(() => {
    loadData();
  }, [currentPage]);

  async function loadData() {
    const result = await loadManageData(currentPage, ITEMS_PER_PAGE);
    if (!result) return;
    setCurrentProfile(result.profile);
    setTasks(result.tasks);
    setTotalCount(result.count);
    setUsers(result.users);
    setSectors(result.sectors);
  }

  function openNew() {
    setEditingTask(null);
    setCalendarMode("single");
    setSelectedDates([]);
    setForm({
      title: "",
      description: "",
      sector_id: "",
      assigned_to: "",
      assigned_users: [],
      date_start: "",
      date_end: "",
    });
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEdit(task) {
    setEditingTask(task);
    setCalendarMode("single");
    setSelectedDates([]);
    setForm({
      title: task.title,
      description: task.description || "",
      sector_id: task.sector_id || "",
      assigned_to: task.assigned_to || "",
      assigned_users: task.assigned_users || [],
      date_start: task.date_start || "",
      date_end: task.date_end || task.date_start || "",
    });
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function toggleAssignedUser(userId) {
    setForm((prev) => ({
      ...prev,
      assigned_users: (prev.assigned_users || []).includes(userId)
        ? (prev.assigned_users || []).filter((id) => id !== userId)
        : [...(prev.assigned_users || []), userId],
    }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (calendarMode === "multiple" && !editingTask) {
      if (selectedDates.length === 0) {
        setError("Selecione pelo menos um dia.");
        setLoading(false);
        return;
      }
      let hasError = false;
      for (const date of selectedDates.sort()) {
        const { error } = await saveTask(
          { ...form, date_start: date, date_end: date },
          null,
          currentProfile,
        );
        if (error) {
          hasError = true;
          break;
        }
      }
      if (hasError) {
        setError("Erro ao criar tarefas.");
        setLoading(false);
        return;
      }
      setSuccess(`${selectedDates.length} tarefa(s) criada(s) com sucesso!`);
      loadData();
      setShowForm(false);
      setLoading(false);
      return;
    }

    const { error } = await saveTask(form, editingTask, currentProfile);
    if (error) {
      setError(error);
      setLoading(false);
      return;
    }
    setSuccess(
      editingTask
        ? "Tarefa atualizada com sucesso!"
        : "Tarefa criada com sucesso!",
    );
    loadData();
    setShowForm(false);
    setLoading(false);
  }

  async function handleDelete(taskId) {
    setLoading(true);
    const { error } = await removeTask(taskId);
    if (!error) {
      setShowDeleteConfirm(null);
      loadData();
    }
    setLoading(false);
  }

  async function handleAddSector(e) {
    e.preventDefault();
    if (!newSector.trim()) return;
    setSectorError("");
    setSectorSuccess("");
    const { error } = await addSector(newSector.trim(), currentProfile.unit_id);
    if (error) {
      setSectorError("Erro ao criar setor.");
    } else {
      setSectorSuccess("Setor criado com sucesso!");
      setNewSector("");
      loadData();
      setTimeout(() => setSectorSuccess(""), 3000);
    }
  }

  async function handleDeleteSector(sectorId) {
    setLoading(true);
    const result = await checkAndRemoveSector(sectorId);
    if (result?.error) {
      setSectorError(result.error);
      setShowDeleteSectorConfirm(null);
    } else {
      setShowDeleteSectorConfirm(null);
      setShowSectorForm(false);
      setSectorSuccess("");
      await loadData();
      setShowSectorForm(true);
      setSectorSuccess("Setor excluído com sucesso!");
      setTimeout(() => setSectorSuccess(""), 3000);
    }
    setLoading(false);
  }

  function formatDate(date) {
    return date.toISOString().split("T")[0];
  }
  function formatDateBR(dateStr) {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  }

  function getCalendarDays(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  }

  function handleCalendarClick(dateStr) {
    if (calendarMode === "single") {
      setForm((prev) => ({ ...prev, date_start: dateStr, date_end: dateStr }));
    } else if (calendarMode === "period") {
      if (!form.date_start || (form.date_start && form.date_end)) {
        setForm((prev) => ({ ...prev, date_start: dateStr, date_end: "" }));
      } else {
        if (dateStr < form.date_start)
          setForm((prev) => ({ ...prev, date_start: dateStr, date_end: "" }));
        else setForm((prev) => ({ ...prev, date_end: dateStr }));
      }
    } else if (calendarMode === "multiple") {
      setSelectedDates((prev) =>
        prev.includes(dateStr)
          ? prev.filter((d) => d !== dateStr)
          : [...prev, dateStr],
      );
    }
  }

  const filteredTasks = tasks.filter((task) => {
    if (filterSector && task.sector_id !== filterSector) return false;
    if (
      filterUser &&
      !task.assigned_users?.includes(filterUser) &&
      task.assigned_to !== filterUser
    )
      return false;
    return true;
  });

  const statusBadge = (status) => {
    if (status === "completed") return "bg-green-100 text-green-700";
    if (status === "not_completed") return "bg-red-100 text-red-700";
    return "bg-yellow-100 text-yellow-700";
  };

  const statusLabel = (status) => {
    if (status === "completed") return "Concluída";
    if (status === "not_completed") return "Não concluída";
    return "Pendente";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gerenciar Tarefas</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSectorForm(!showSectorForm)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            + Setor
          </button>
          <button
            onClick={openNew}
            className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            + Nova tarefa
          </button>
        </div>
      </div>
      {showSectorForm && (
        <form
          onSubmit={handleAddSector}
          className="bg-white rounded-2xl shadow-sm p-4 mb-4"
        >
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do setor
              </label>
              <input
                type="text"
                value={newSector}
                onChange={(e) => setNewSector(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Administrativo, Limpeza..."
                required
              />
            </div>
            <button
              type="submit"
              className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={() => {
                setShowSectorForm(false);
                setSectorError("");
                setSectorSuccess("");
              }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-2.5 rounded-lg text-sm transition"
            >
              Cancelar
            </button>
          </div>
          {sectorError && (
            <p className="text-red-500 text-sm mt-2">{sectorError}</p>
          )}
          {sectorSuccess && (
            <p className="text-green-600 text-sm mt-2">{sectorSuccess}</p>
          )}

          {/* Lista de setores com opção de excluir */}
          {sectors.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-2">
                Setores cadastrados:
              </p>
              <div className="flex flex-wrap gap-2">
                {sectors.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-1 bg-gray-100 rounded-lg px-3 py-1.5"
                  >
                    <span className="text-sm text-gray-700">{s.name}</span>
                    <button
                      type="button"
                      onClick={() => setShowDeleteSectorConfirm(s.id)}
                      className="text-red-400 hover:text-red-600 transition ml-1 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>
      )}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 mb-6">
          <h2 className="font-semibold text-gray-700 mb-4">
            {editingTask ? "Editar tarefa" : "Nova tarefa"}
          </h2>
          <form
            onSubmit={handleSave}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Setor
              </label>
              <select
                value={form.sector_id}
                onChange={(e) =>
                  setForm({ ...form, sector_id: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione um setor</option>
                {sectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Responsáveis
              </label>
              <div className="flex flex-wrap gap-2 max-h-28 sm:max-h-32 overflow-y-auto pr-1">
                {users.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleAssignedUser(u.id)}
                    className={`px-2 sm:px-3 py-1 rounded-md sm:rounded-lg text-[11px] sm:text-sm font-medium transition whitespace-nowrap ${(form.assigned_users || []).includes(u.id) ? "bg-blue-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  >
                    {u.full_name}
                  </button>
                ))}
              </div>
              {form.assigned_users?.length > 0 && (
                <p className="text-xs text-blue-600 mt-2">
                  {form.assigned_users.length} responsável(is) selecionado(s)
                </p>
              )}
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data(s) da tarefa
              </label>

              {/* Seletor de modo */}
              <div className="flex gap-1 mb-3">
                {[
                  { value: "single", label: "📅 Dia único" },
                  { value: "period", label: "📆 Período" },
                  { value: "multiple", label: "🗓️ Dias avulsos" },
                ].map((mode) => (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => {
                      setCalendarMode(mode.value);
                      setSelectedDates([]);
                      setForm((prev) => ({
                        ...prev,
                        date_start: "",
                        date_end: "",
                      }));
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      calendarMode === mode.value
                        ? "bg-blue-700 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              <div className="border border-gray-200 rounded-xl p-3 sm:p-4 bg-gray-50 overflow-x-auto">
                <div className="min-w-[300px] sm:min-w-full">
                  <div className="flex items-center justify-between mb-3">
                    <button
                      type="button"
                      onClick={() =>
                        setCalendarDate(
                          new Date(
                            calendarDate.getFullYear(),
                            calendarDate.getMonth() - 1,
                            1,
                          ),
                        )
                      }
                      className="p-1.5 hover:bg-gray-200 rounded-lg transition text-gray-600"
                    >
                      ←
                    </button>
                    <p className="text-xs sm:text-sm font-semibold text-gray-700 text-center">
                      {calendarDate.toLocaleString("pt-BR", {
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setCalendarDate(
                          new Date(
                            calendarDate.getFullYear(),
                            calendarDate.getMonth() + 1,
                            1,
                          ),
                        )
                      }
                      className="p-1.5 hover:bg-gray-200 rounded-lg transition text-gray-600"
                    >
                      →
                    </button>
                  </div>

                  <div className="grid grid-cols-7 mb-1">
                    {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(
                      (d) => (
                        <div
                          key={d}
                          className="text-center text-[10px] sm:text-xs font-medium text-gray-400 py-1"
                        >
                          {d}
                        </div>
                      ),
                    )}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {getCalendarDays(calendarDate).map((day, idx) => {
                      if (!day) return <div key={idx} />;
                      const dateStr = formatDate(day);
                      const isToday = dateStr === formatDate(new Date());

                      // Modo dias avulsos
                      const isSelected =
                        calendarMode === "multiple" &&
                        selectedDates.includes(dateStr);

                      // Modo dia único e período
                      const isStart =
                        calendarMode !== "multiple" &&
                        form.date_start === dateStr;
                      const isEnd =
                        calendarMode !== "multiple" &&
                        form.date_end === dateStr &&
                        form.date_end !== form.date_start;
                      const isInRange =
                        calendarMode === "period" &&
                        form.date_start &&
                        form.date_end &&
                        dateStr > form.date_start &&
                        dateStr < form.date_end;

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleCalendarClick(dateStr)}
                          className={`text-center text-[11px] sm:text-sm py-1 sm:py-1.5 rounded-md sm:rounded-lg transition font-medium
                ${isSelected ? "bg-green-600 text-white" : ""}
                ${isStart || isEnd ? "bg-blue-700 text-white" : ""}
                ${isInRange ? "bg-blue-100 text-blue-700" : ""}
                ${!isSelected && !isStart && !isEnd && !isInRange ? "hover:bg-gray-200 text-gray-700" : ""}
                ${isToday && !isSelected && !isStart && !isEnd ? "ring-1 sm:ring-2 ring-blue-400" : ""}`}
                        >
                          {day.getDate()}
                        </button>
                      );
                    })}
                  </div>

                  {/* Resumo */}
                  {calendarMode === "multiple" && selectedDates.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 text-[11px] sm:text-xs text-gray-600 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <span>
                        🗓️ {selectedDates.length} dia(s) selecionado(s)
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedDates([])}
                        className="text-red-400 hover:text-red-600 transition text-xs"
                      >
                        Limpar
                      </button>
                    </div>
                  )}

                  {calendarMode !== "multiple" && form.date_start && (
                    <div className="mt-3 pt-3 border-t border-gray-200 text-[11px] sm:text-xs text-gray-600 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <span>
                        {form.date_end && form.date_end !== form.date_start
                          ? `📅 ${formatDateBR(form.date_start)} até ${formatDateBR(form.date_end)}`
                          : `📅 ${formatDateBR(form.date_start)}`}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            date_start: "",
                            date_end: "",
                          }))
                        }
                        className="text-red-400 hover:text-red-600 transition text-xs"
                      >
                        Limpar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {error && (
              <p className="col-span-2 text-red-500 text-sm">{error}</p>
            )}
            {success && (
              <p className="col-span-2 text-green-600 text-sm">{success}</p>
            )}
            <div className="col-span-2 flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-50 w-full sm:w-auto"
              >
                {loading ? "Salvando..." : "Salvar"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-6 py-2.5 rounded-lg transition w-full sm:w-auto"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
      <div className="flex gap-3 mb-4 flex-wrap">
        <select
          value={filterSector}
          onChange={(e) => setFilterSector(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os setores</option>
          {sectors.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os responsáveis</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.full_name}
            </option>
          ))}
        </select>
      </div>
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full mx-4">
            <h3 className="font-bold text-gray-800 mb-2">Confirmar exclusão</h3>
            <p className="text-gray-500 text-sm mb-6">
              Tem certeza que deseja excluir esta tarefa?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition disabled:opacity-50"
              >
                {loading ? "Excluindo..." : "Excluir"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-2 rounded-lg text-sm transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      {showDeleteSectorConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full mx-4">
            <h3 className="font-bold text-gray-800 mb-2">Excluir setor</h3>
            <p className="text-gray-500 text-sm mb-6">
              Tem certeza? As tarefas vinculadas a este setor perderão o
              vínculo.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDeleteSector(showDeleteSectorConfirm)}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition disabled:opacity-50"
              >
                {loading ? "Excluindo..." : "Excluir"}
              </button>
              <button
                onClick={() => setShowDeleteSectorConfirm(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-2 rounded-lg text-sm transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-gray-50 text-gray-500 text-left">
            <tr>
              <th className="px-6 py-3 font-medium">Tarefa</th>
              <th className="px-6 py-3 font-medium">Data</th>
              <th className="px-6 py-3 font-medium">Setor</th>
              <th className="px-6 py-3 font-medium">Responsável</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredTasks.map((task) => (
              <tr key={task.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-800">{task.title}</p>
                  {task.description && (
                    <p className="text-gray-400 text-xs mt-0.5 truncate max-w-xs">
                      {task.description}
                    </p>
                  )}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {task.date_start
                    ? task.date_end && task.date_end !== task.date_start
                      ? `${formatDateBR(task.date_start)} até ${formatDateBR(task.date_end)}`
                      : formatDateBR(task.date_start)
                    : "—"}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {task.sectors?.name || "—"}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {task.profiles?.full_name || "—"}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${statusBadge(task.status)}`}
                  >
                    {statusLabel(task.status)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => openEdit(task)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(task.id)}
                      className="text-red-500 hover:underline text-sm"
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredTasks.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                  Nenhuma tarefa encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {totalCount > ITEMS_PER_PAGE && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Mostrando{" "}
            {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalCount)} a{" "}
            {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} de {totalCount}{" "}
            tarefas
          </p>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition disabled:opacity-40"
            >
              ← Anterior
            </button>

            {(() => {
              const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
              const pages = [];
              const delta = 2;

              const left = Math.max(2, currentPage - delta);
              const right = Math.min(totalPages - 1, currentPage + delta);

              pages.push(1);

              if (left > 2) pages.push("...");

              for (let i = left; i <= right; i++) pages.push(i);

              if (right < totalPages - 1) pages.push("...");

              if (totalPages > 1) pages.push(totalPages);

              return pages.map((page, idx) =>
                page === "..." ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-2 text-gray-400 text-sm"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition ${currentPage === page ? "bg-blue-700 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
                  >
                    {page}
                  </button>
                ),
              );
            })()}

            <button
              onClick={() =>
                setCurrentPage((p) =>
                  Math.min(Math.ceil(totalCount / ITEMS_PER_PAGE), p + 1),
                )
              }
              disabled={currentPage === Math.ceil(totalCount / ITEMS_PER_PAGE)}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition disabled:opacity-40"
            >
              Próxima →
            </button>
          </div>
        </div>
      )}{" "}
    </div>
  );
}
