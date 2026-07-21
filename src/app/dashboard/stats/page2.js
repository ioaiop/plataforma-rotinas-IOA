"use client";

import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { loadStatsData } from "@/lib/services/statsService";

function formatDate(date) {
  return date.toISOString().split("T")[0];
}
function formatDateBR(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

const STATUS_COLORS = {
  completed: "#22c55e",
  pending: "#eab308",
  not_completed: "#ef4444",
  in_progress: "#9333ea",
  waiting_approval: "#3b82f6",
};

export default function StatsPage() {
  const [showReportMenu, setShowReportMenu] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterSector, setFilterSector] = useState("");
  const [period, setPeriod] = useState("month");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  useEffect(() => {
    initDates("month");
  }, []);

  function initDates(p) {
    const today = new Date();
    let start, end;
    if (p === "week") {
      const day = today.getDay();
      start = new Date(today);
      start.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
      end = new Date(start);
      end.setDate(start.getDate() + 6);
    } else if (p === "month") {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (p === "quarter") {
      const q = Math.floor(today.getMonth() / 3);
      start = new Date(today.getFullYear(), q * 3, 1);
      end = new Date(today.getFullYear(), q * 3 + 3, 0);
    }
    const s = formatDate(start);
    const e = formatDate(end);
    setDateStart(s);
    setDateEnd(e);
    loadData(s, e, filterSector);
  }

  async function loadData(start, end, sector) {
    setLoading(true);
    const result = await loadStatsData(start, end, sector || null);
    setData(result);
    setLoading(false);
  }

  function handlePeriod(p) {
    setPeriod(p);
    if (p !== "custom") initDates(p);
  }

  function handleSectorFilter(sectorId) {
    setFilterSector(sectorId);
    loadData(dateStart, dateEnd, sectorId);
  }

  function handleCustomApply() {
    if (customStart && customEnd) {
      setDateStart(customStart);
      setDateEnd(customEnd);
      loadData(customStart, customEnd, filterSector);
    }
  }

  if (loading || !data)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400 text-sm">Carregando estatísticas...</p>
      </div>
    );

  const {
    tasks,
    sectors,
    employees,
    isAdmin,
    isSupervisor,
    isEmployee,
    profile,
  } = data;

  // Totais
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const pending = tasks.filter((t) => t.status === "pending").length;
  const notCompleted = tasks.filter((t) => t.status === "not_completed").length;
  const waitingApproval = tasks.filter(
    (t) => t.status === "waiting_approval",
  ).length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Gráfico pizza
  const pieData = [
    { name: "Concluídas", value: completed, color: STATUS_COLORS.completed },
    { name: "Pendentes", value: pending, color: STATUS_COLORS.pending },
    {
      name: "Não concluídas",
      value: notCompleted,
      color: STATUS_COLORS.not_completed,
    },
    {
      name: "Em andamento",
      value: inProgress,
      color: STATUS_COLORS.in_progress,
    },
    {
      name: "Aguard. aprovação",
      value: waitingApproval,
      color: STATUS_COLORS.waiting_approval,
    },
  ].filter((d) => d.value > 0);

  // Gráfico por setor (admin)
  const sectorChartData = sectors.map((sector) => {
    const sectorTasks = tasks.filter((t) => t.sector_id === sector.id);
    return {
      name: sector.name,
      Concluídas: sectorTasks.filter((t) => t.status === "completed").length,
      Pendentes: sectorTasks.filter((t) => t.status === "pending").length,
      "Não concluídas": sectorTasks.filter((t) => t.status === "not_completed")
        .length,
      "Em andamento": sectorTasks.filter((t) => t.status === "in_progress")
        .length,
    };
  });

  // Ranking de funcionários (admin/supervisor)
  const employeeRanking = employees
    .map((emp) => {
      const empTasks = tasks.filter(
        (t) => t.assigned_users?.includes(emp.id) || t.assigned_to === emp.id,
      );
      const empTotal = empTasks.length;
      const empCompleted = empTasks.filter(
        (t) => t.status === "completed",
      ).length;
      const rate =
        empTotal > 0 ? Math.round((empCompleted / empTotal) * 100) : 0;
      return {
        ...emp,
        total: empTotal,
        completed: empCompleted,
        pending: empTasks.filter((t) => t.status === "pending").length,
        not_completed: empTasks.filter((t) => t.status === "not_completed")
          .length,
        in_progress: empTasks.filter((t) => t.status === "in_progress").length,
        rate,
      };
    })
    .sort((a, b) => b.completed - a.completed);

  // Evolução diária
  const daysRange = [];
  const start = new Date(dateStart + "T12:00:00");
  const end = new Date(dateEnd + "T12:00:00");
  const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
  const maxDays = Math.min(diffDays + 1, 31);
  for (let i = 0; i < maxDays; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    daysRange.push(formatDate(d));
  }

  const evolutionData = daysRange.map((dateStr) => {
    const dayTasks = tasks.filter(
      (t) => t.date_start <= dateStr && t.date_end >= dateStr,
    );
    const [y, m, dd] = dateStr.split("-");
    return {
      day: `${dd}/${m}`,
      Concluídas: dayTasks.filter((t) => t.status === "completed").length,
      Pendentes: dayTasks.filter((t) => t.status === "pending").length,
      "Não concluídas": dayTasks.filter((t) => t.status === "not_completed")
        .length,
    };
  });

  async function generatePDF(tipo) {
    const doc = new jsPDF({ orientation: "landscape" });

    let tituloTipo =
      tipo === "diario"
        ? `Relatório do dia — ${formatDateBR(formatDate(new Date()))}`
        : tipo === "semanal"
          ? `Relatório semanal — ${formatDateBR(dateStart)} a ${formatDateBR(dateEnd)}`
          : `Relatório mensal — ${formatDateBR(dateStart)} a ${formatDateBR(dateEnd)}`;

    // Cabeçalho
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, doc.internal.pageSize.width, 35, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("IOA IOP - Plataforma de Rotinas", 14, 15);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(tituloTipo, 14, 25);

    // Resumo
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Resumo do período", 14, 48);

    autoTable(doc, {
      startY: 53,
      head: [
        [
          "Total",
          "Concluídas",
          "Em andamento",
          "Pendentes",
          "Não concluídas",
          "Taxa de conclusão",
        ],
      ],
      body: [
        [
          total,
          completed,
          inProgress,
          pending,
          notCompleted,
          `${completionRate}%`,
        ],
      ],
      headStyles: { fillColor: [30, 58, 138], fontSize: 10 },
      bodyStyles: { fontSize: 11, halign: "center" },
      margin: { left: 14, right: 14 },
    });

    // Ranking de funcionários
    if ((isAdmin || isSupervisor) && employeeRanking.length > 0) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Ranking de funcionários", 14, doc.lastAutoTable.finalY + 15);
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [
          [
            "#",
            "Funcionário",
            "Concluídas",
            "Em andamento",
            "Pendentes",
            "Não concluídas",
            "Total",
            "Taxa",
          ],
        ],
        body: employeeRanking.map((emp, idx) => [
          `${idx + 1}º`,
          emp.full_name,
          emp.completed,
          emp.in_progress,
          emp.pending,
          emp.not_completed,
          emp.total,
          `${emp.rate}%`,
        ]),
        headStyles: { fillColor: [30, 58, 138], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
      });
    }

    // Desempenho por setor
    if (isAdmin && !filterSector && sectorChartData.length > 0) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Desempenho por setor", 14, doc.lastAutoTable.finalY + 15);
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [
          [
            "Setor",
            "Concluídas",
            "Em andamento",
            "Pendentes",
            "Não concluídas",
          ],
        ],
        body: sectorChartData.map((s) => [
          s.name,
          s.Concluídas,
          s["Em andamento"],
          s.Pendentes,
          s["Não concluídas"],
        ]),
        headStyles: { fillColor: [30, 58, 138], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
      });
    }

    // Rodapé
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Gerado em ${new Date().toLocaleString("pt-BR")} — Página ${i} de ${pageCount}`,
        14,
        doc.internal.pageSize.height - 10,
      );
    }

    doc.save(`relatorio-${tipo}-${formatDate(new Date())}.pdf`);
    setShowReportMenu(false);
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Cabeçalho */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-800">
            📊 Estatísticas
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isEmployee
              ? "Seu desempenho pessoal"
              : isSupervisor
                ? "Desempenho do seu setor"
                : "Visão geral da unidade"}
          </p>
        </div>
        {(isAdmin || isSupervisor) && (
          <div className="relative">
            <button
              onClick={() => setShowReportMenu(!showReportMenu)}
              className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition flex items-center gap-2"
            >
              📄 Baixar Relatório ▾
            </button>
            {showReportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
                <button
                  onClick={() => generatePDF("diario")}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  📄 Diário
                </button>
                <button
                  onClick={() => generatePDF("semanal")}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition border-t border-gray-50"
                >
                  📅 Semanal
                </button>
                <button
                  onClick={() => generatePDF("mensal")}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition border-t border-gray-50"
                >
                  🗓️ Mensal
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Período */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Período</p>
            <div className="flex gap-1">
              {[
                { value: "week", label: "Semana" },
                { value: "month", label: "Mês" },
                { value: "quarter", label: "Trimestre" },
                { value: "custom", label: "Personalizado" },
              ].map((p) => (
                <button
                  key={p.value}
                  onClick={() => handlePeriod(p.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${period === p.value ? "bg-blue-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Datas customizadas */}
          {period === "custom" && (
            <div className="flex gap-2 items-end">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">De</p>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Até</p>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleCustomApply}
                className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition"
              >
                Aplicar
              </button>
            </div>
          )}

          {/* Filtro setor — só admin */}
          {isAdmin && sectors.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Setor</p>
              <select
                value={filterSector}
                onChange={(e) => handleSectorFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos os setores</option>
                {sectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="ml-auto text-xs text-gray-400">
            {formatDateBR(dateStart)} a {formatDateBR(dateEnd)}
          </div>
        </div>
      </div>

      {/* Cards de totais */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
        {[
          {
            label: "Total",
            value: total,
            color: "bg-blue-50 text-blue-700",
            icon: "📋",
          },
          {
            label: "Concluídas",
            value: completed,
            color: "bg-green-50 text-green-700",
            icon: "✅",
          },
          {
            label: "Em andamento",
            value: inProgress,
            color: "bg-purple-50 text-purple-700",
            icon: "🔄",
          },
          {
            label: "Pendentes",
            value: pending,
            color: "bg-yellow-50 text-yellow-700",
            icon: "⏳",
          },
          {
            label: "Não concluídas",
            value: notCompleted,
            color: "bg-red-50 text-red-700",
            icon: "❌",
          },
          {
            label: "Taxa de conclusão",
            value: `${completionRate}%`,
            color: "bg-gray-50 text-gray-700",
            icon: "🎯",
          },
        ].map((card) => (
          <div key={card.label} className={`rounded-2xl p-4 ${card.color}`}>
            <div className="text-xl mb-1">{card.icon}</div>
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-xs mt-1 opacity-80">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Gráfico pizza */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-700 mb-4">
            🥧 Distribuição por status
          </h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm text-center py-10">
              Nenhum dado no período.
            </p>
          )}
        </div>

        {/* Evolução diária */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-700 mb-4">
            📈 Evolução no período
          </h2>
          {evolutionData.some((d) => d.Concluídas > 0 || d.Pendentes > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart
                data={evolutionData}
                margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
              >
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Concluídas"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Pendentes"
                  stroke="#eab308"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Não concluídas"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm text-center py-10">
              Nenhum dado no período.
            </p>
          )}
        </div>
      </div>

      {/* Gráfico por setor — só admin com todos os setores */}
      {isAdmin && !filterSector && sectorChartData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
          <h2 className="font-semibold text-gray-700 mb-4">
            🏢 Desempenho por setor
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={sectorChartData}
              margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
            >
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Concluídas" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar
                dataKey="Em andamento"
                fill="#9333ea"
                radius={[4, 4, 0, 0]}
              />
              <Bar dataKey="Pendentes" fill="#eab308" radius={[4, 4, 0, 0]} />
              <Bar
                dataKey="Não concluídas"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Ranking de funcionários — admin/supervisor */}
      {(isAdmin || isSupervisor) && employeeRanking.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
          <h2 className="font-semibold text-gray-700 mb-4">
            🏆 Ranking de funcionários
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-left border-b border-gray-100">
                  <th className="pb-3 font-medium">#</th>
                  <th className="pb-3 font-medium">Funcionário</th>
                  <th className="pb-3 font-medium text-center">✅</th>
                  <th className="pb-3 font-medium text-center">🔄</th>
                  <th className="pb-3 font-medium text-center">⏳</th>
                  <th className="pb-3 font-medium text-center">❌</th>
                  <th className="pb-3 font-medium text-center">Total</th>
                  <th className="pb-3 font-medium text-center">Taxa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {employeeRanking.map((emp, idx) => (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="py-3 text-gray-400 font-medium">
                      {idx === 0
                        ? "🥇"
                        : idx === 1
                          ? "🥈"
                          : idx === 2
                            ? "🥉"
                            : `${idx + 1}º`}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {emp.avatar_url ? (
                            <img
                              src={emp.avatar_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-blue-700 text-xs font-bold">
                              {emp.full_name?.charAt(0)}
                            </span>
                          )}
                        </div>
                        <span className="font-medium text-gray-800">
                          {emp.full_name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-center text-green-600 font-semibold">
                      {emp.completed}
                    </td>
                    <td className="py-3 text-center text-purple-600 font-semibold">
                      {emp.in_progress}
                    </td>
                    <td className="py-3 text-center text-yellow-600 font-semibold">
                      {emp.pending}
                    </td>
                    <td className="py-3 text-center text-red-500 font-semibold">
                      {emp.not_completed}
                    </td>
                    <td className="py-3 text-center text-gray-500">
                      {emp.total}
                    </td>
                    <td className="py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${emp.rate >= 80 ? "bg-green-100 text-green-700" : emp.rate >= 50 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}
                      >
                        {emp.rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Estatísticas pessoais — funcionário */}
      {isEmployee && (
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
          <h2 className="font-semibold text-gray-700 mb-4">
            👤 Minhas tarefas no período
          </h2>
          {tasks.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">
              Nenhuma tarefa no período selecionado.
            </p>
          ) : (
            <div className="space-y-2">
              {tasks.map((task, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-3 bg-gray-50 rounded-xl"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {task.title}
                    </p>
                    {task.sectors?.name && (
                      <p className="text-xs text-gray-400">
                        {task.sectors.name}
                      </p>
                    )}
                  </div>
                  <span
                    className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      task.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : task.status === "not_completed"
                          ? "bg-red-100 text-red-700"
                          : task.status === "in_progress"
                            ? "bg-purple-100 text-purple-700"
                            : task.status === "waiting_approval"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {task.status === "completed"
                      ? "Concluída"
                      : task.status === "not_completed"
                        ? "Não concluída"
                        : task.status === "in_progress"
                          ? "Em andamento"
                          : task.status === "waiting_approval"
                            ? "Aguard. aprovação"
                            : "Pendente"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {total === 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-gray-500 text-sm">
            Nenhuma tarefa encontrada no período selecionado.
          </p>
        </div>
      )}
    </div>
  );
}
