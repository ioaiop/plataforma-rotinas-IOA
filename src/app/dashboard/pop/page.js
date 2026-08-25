"use client";

import { useState, useEffect } from "react";
import { getUser, getProfile } from "@/lib/auth";
import {
  loadPopData,
  loadPopUsers,
  savePopCategory,
  removePopCategory,
  savePopArticle,
  removePopArticle,
  uploadArticlePdf,
  removeArticlePdf,
} from "@/lib/services/popService";

const ICONS = [
  // Saúde e Clínica
  "🏥",
  "🦷",
  "💊",
  "🩺",
  "🧠",
  // Administrativo e Financeiro
  "💰",
  "💵",
  "📊",
  "📈",
  "💳",
  "🏦",
  "📋",
  "📁",

  // Limpeza e Manutenção
  "🧹",
  "🧺",
  "🧽",
  "🔧",
  "⚙️",
  // Comunicação e Marketing
  "📢",
  "📱",
  "💻",
  "📸",
  "🎯",
  "✉️",
  "🌐",
  // Educação e Acadêmico
  "🎓",
  "📚",
  "✏️",
  "📝",
  "🔬",
  "🧪",
  "📐",
  // Recepção e Atendimento
  "👥",
  "☎️",
  "🛎️",
  "👋",
  "🗣️",
  "📞",
  // Comercial e Vendas
  "🛒",
  "🏪",
  "💲",
  "🚚",
  "🏷️",
  "💼",
  "🤝",
  // Segurança e Portaria
  "🔐",
  "🔒",
  "🛡️",
  "🚨",
  "📹",
  "🔑",
  "🚧",
  "⚠️",
  // Geral
  "⭐",
  "✅",
  "❗",
  "💡",
  "🏆",
  "📌",
  "🔔",
  "🗓️",
];

export default function PopPage() {
  const [pdfFile, setPdfFile] = useState(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [profile, setProfile] = useState(null);
  const [isAdminOrSupervisor, setIsAdminOrSupervisor] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [articles, setArticles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingArticle, setEditingArticle] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    icon: "📋",
    userIds: [],
  });
  const [articleForm, setArticleForm] = useState({
    title: "",
    content: "",
    category_id: "",
  });

  useEffect(() => {
    init();
  }, []);

  function toggleCategoryUser(userId) {
    setCategoryForm((prev) => ({
      ...prev,
      userIds: (prev.userIds || []).includes(userId)
        ? (prev.userIds || []).filter((id) => id !== userId)
        : [...(prev.userIds || []), userId],
    }));
  }

  async function init() {
    const user = await getUser();
    if (!user) return;
    const profileData = await getProfile(user.id);
    setProfile(profileData);
    const adminOrSupervisor =
      profileData?.role === "admin" || profileData?.role === "supervisor";
    setIsAdminOrSupervisor(adminOrSupervisor);

    if (adminOrSupervisor) {
      const usersList = await loadPopUsers(
        profileData.unit_id,
        profileData.sector_id,
        profileData.role,
      );
      setUsers(usersList);
      if (usersList.length > 0) {
        setSelectedUser(usersList[0]);
        await loadData(usersList[0].id);
      }
    } else {
      await loadData(user.id);
    }
  }

  async function loadData(userId) {
    const result = await loadPopData(userId);
    if (!result) return;
    setCategories(result.categories);
    setArticles(result.articles);
    if (result.categories.length > 0) setSelectedCategory(result.categories[0]);
    else setSelectedCategory(null);
    setSelectedArticle(null);
  }

  async function handleSelectUser(user) {
    setSelectedUser(user);
    setSelectedCategory(null);
    setSelectedArticle(null);
    await loadData(user.id);
  }

  async function handleSaveCategory(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!categoryForm.userIds || categoryForm.userIds.length === 0) {
      setError("Selecione pelo menos um funcionário.");
      setLoading(false);
      return;
    }

    const { error } = await savePopCategory(
      categoryForm,
      editingCategory,
      categoryForm.userIds,
    );
    if (error) {
      setError(error);
      setLoading(false);
      return;
    }
    setSuccess(editingCategory ? "Categoria atualizada!" : "Categoria criada!");
    setShowCategoryForm(false);
    setEditingCategory(null);
    setCategoryForm({ name: "", icon: "📋", userIds: [] });
    setLoading(false);
    loadData(selectedUser?.id);
  }

  async function handleDeleteCategory(id) {
    if (!confirm("Excluir categoria e todos os artigos dela?")) return;
    const targetId = isAdminOrSupervisor ? selectedUser?.id : profile?.id;
    await removePopCategory(id);
    setSelectedCategory(null);
    loadData(targetId);
  }

  async function handleSaveArticle(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    const targetId = isAdminOrSupervisor ? selectedUser?.id : profile?.id;
    const { error } = await savePopArticle(
      articleForm,
      editingArticle,
      selectedCategory?.id,
      targetId,
    );
    if (error) {
      setError(error);
      setLoading(false);
      return;
    }

    // Upload do PDF se houver
    if (pdfFile && editingArticle) {
      setUploadingPdf(true);
      const { error: pdfError } = await uploadArticlePdf(
        editingArticle.id,
        pdfFile,
      );
      if (pdfError) {
        setError(pdfError);
        setUploadingPdf(false);
        setLoading(false);
        return;
      }
      setUploadingPdf(false);
      setPdfFile(null);
    }

    setSuccess(editingArticle ? "Artigo atualizado!" : "Artigo criado!");
    setShowArticleForm(false);
    setEditingArticle(null);
    setArticleForm({ title: "", content: "", category_id: "" });
    setPdfFile(null);
    setLoading(false);
    loadData(targetId);
  }

  async function handleDeleteArticle(id) {
    if (!confirm("Excluir este artigo?")) return;
    const targetId = isAdminOrSupervisor ? selectedUser?.id : profile?.id;
    await removePopArticle(id);
    setSelectedArticle(null);
    loadData(targetId);
  }

  const filteredArticles = articles.filter(
    (a) => a.category_id === selectedCategory?.id,
  );

  return (
    <div className="p-4 lg:p-3 max-w-6xl mx-auto">
      {/* Banner institucional */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-2xl p-5 mb-6 text-white">
        <p className="font-bold text-lg mb-1">Cuidamos de Pessoas</p>
        <p className="text-blue-100 text-sm leading-relaxed">
          Antes de formar grandes profissionais, construímos grandes relações.
          Promovemos um ambiente de confiança, respeito, colaboração e empatia,
          onde cada pessoa é valorizada e cada atitude contribui para o sucesso
          de toda a equipe.
        </p>
      </div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-800">
            📄 POPs
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Procedimentos Operacionais Padrão
          </p>
        </div>
        {isAdminOrSupervisor && selectedUser && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowCategoryForm(true);
                setEditingCategory(null);
                setCategoryForm({ name: "", icon: "📋" });
              }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-3 py-2 rounded-xl transition"
            >
              + Categoria
            </button>
            <button
              onClick={() => {
                setShowArticleForm(true);
                setEditingArticle(null);
                setArticleForm({
                  title: "",
                  content: "",
                  category_id: selectedCategory?.id || "",
                });
              }}
              className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-3 py-2 rounded-xl transition"
            >
              + Artigo
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 text-green-600 text-sm px-4 py-3 rounded-xl mb-4">
          {success}
        </div>
      )}

      {/* Seletor de funcionário — só admin/supervisor */}
      {isAdminOrSupervisor && (
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">
            Selecione o funcionário:
          </p>
          <div className="flex flex-wrap gap-2">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => handleSelectUser(u)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition ${selectedUser?.id === u.id ? "bg-blue-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {u.avatar_url ? (
                    <img
                      src={u.avatar_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-blue-700 text-xs font-bold">
                      {u.full_name?.charAt(0)}
                    </span>
                  )}
                </div>
                {u.full_name}
              </button>
            ))}
            {users.length === 0 && (
              <p className="text-gray-400 text-sm">
                Nenhum funcionário encontrado.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Busca */}
      {selectedUser && (
        <div className="flex items-center gap-2 bg-white rounded-2xl shadow-sm px-4 py-3 mb-6">
          <span className="text-gray-400">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar nos POPs por título ou conteúdo..."
            className="flex-1 text-sm text-gray-700 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-red-400 hover:text-red-600 transition"
            >
              Limpar
            </button>
          )}
        </div>
      )}

      {/* Modal Categoria */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="font-bold text-gray-800 mb-4">
              {editingCategory ? "Editar Categoria" : "Nova Categoria"}
            </h2>
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <input
                  value={categoryForm.name}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, name: e.target.value })
                  }
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Atendimento, Limpeza..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ícone
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-gray-50 rounded-lg border border-gray-200">
                  {ICONS.map((icon, idx) => (
                    <button
                      key={`${icon}-${idx}`}
                      type="button"
                      onClick={() => setCategoryForm({ ...categoryForm, icon })}
                      className={`text-xl p-1.5 rounded-lg transition ${
                        categoryForm.icon === icon
                          ? "bg-blue-100 ring-2 ring-blue-500"
                          : "hover:bg-gray-200"
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    Ou digite/cole um emoji:
                  </span>
                  <input
                    type="text"
                    value={categoryForm.icon}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || val.length <= 2) {
                        setCategoryForm({ ...categoryForm, icon: val });
                      }
                    }}
                    className="w-16 text-center text-xl border border-gray-300 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="😀"
                  />
                  <span className="text-xs text-gray-400">
                    Selecionado: {categoryForm.icon}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Funcionários
                </label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleCategoryUser(u.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                        (categoryForm.userIds || []).includes(u.id)
                          ? "bg-blue-700 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {u.avatar_url ? (
                          <img
                            src={u.avatar_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-blue-700 text-xs font-bold">
                            {u.full_name?.charAt(0)}
                          </span>
                        )}
                      </div>
                      {u.full_name}
                    </button>
                  ))}
                </div>
                {categoryForm.userIds?.length > 0 && (
                  <p className="text-xs text-blue-600 mt-2">
                    {categoryForm.userIds.length} funcionário(s) selecionado(s)
                  </p>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryForm(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold py-2.5 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold py-2.5 rounded-xl transition disabled:opacity-50"
                >
                  {loading ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Artigo */}
      {showArticleForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h2 className="font-bold text-gray-800 mb-4">
              {editingArticle ? "Editar Artigo" : "Novo Artigo"}
            </h2>
            <form onSubmit={handleSaveArticle} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <select
                  value={articleForm.category_id || selectedCategory?.id}
                  onChange={(e) =>
                    setArticleForm({
                      ...articleForm,
                      category_id: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título
                </label>
                <input
                  value={articleForm.title}
                  onChange={(e) =>
                    setArticleForm({ ...articleForm, title: e.target.value })
                  }
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Como realizar o atendimento inicial"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conteúdo
                </label>
                <textarea
                  value={articleForm.content}
                  onChange={(e) =>
                    setArticleForm({ ...articleForm, content: e.target.value })
                  }
                  required
                  rows={6}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Descreva o passo a passo..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PDF anexo (opcional)
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setPdfFile(e.target.files[0])}
                  className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {pdfFile && (
                  <p className="text-xs text-blue-600 mt-1">
                    📎 {pdfFile.name}
                  </p>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowArticleForm(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold py-2.5 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold py-2.5 rounded-xl transition disabled:opacity-50"
                >
                  {loading ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      {isAdminOrSupervisor && !selectedUser ? (
        <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
          <p className="text-4xl mb-3">👤</p>
          <p className="text-gray-500 text-sm">
            Selecione um funcionário para ver os POPs.
          </p>
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
          <p className="text-4xl mb-3">📄</p>
          <p className="text-gray-500 text-sm">Nenhum POP cadastrado ainda.</p>
          {isAdminOrSupervisor && (
            <p className="text-gray-400 text-xs mt-1">
              Clique em "+ Categoria" para começar.
            </p>
          )}
        </div>
      ) : (
        <div className="flex gap-6">
          {/* Sidebar categorias */}
          <div className="w-40 lg:w-56 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {categories.map((cat) => (
                <div key={cat.id}>
                  <button
                    onClick={() => {
                      setSelectedCategory(cat);
                      setSelectedArticle(null);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm font-medium transition flex items-center gap-2 ${selectedCategory?.id === cat.id ? "bg-blue-700 text-white" : "text-gray-700 hover:bg-gray-50"}`}
                  >
                    <span>{cat.icon}</span>
                    <span className="truncate">{cat.name}</span>
                  </button>
                  {isAdminOrSupervisor && selectedCategory?.id === cat.id && (
                    <div className="flex border-t border-blue-600">
                      <button
                        onClick={() => {
                          setEditingCategory(cat);
                          setCategoryForm({
                            name: cat.name,
                            icon: cat.icon,
                            userIds: cat.user_ids || [],
                          });
                          setShowCategoryForm(true);
                        }}
                        className="flex-1 text-xs text-blue-500 hover:bg-blue-800 py-1.5 transition"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="flex-1 text-xs text-blue-500 hover:bg-blue-800 py-1.5 transition border-l border-blue-600"
                      >
                        🗑️ Excluir
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Artigos */}
          <div className="flex-1">
            {selectedArticle ? (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="text-sm text-blue-600 hover:underline mb-4 flex items-center gap-1"
                >
                  ← Voltar
                </button>
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-800">
                    {selectedArticle.title}
                  </h2>
                  {isAdminOrSupervisor && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => {
                          setEditingArticle(selectedArticle);
                          setArticleForm({
                            title: selectedArticle.title,
                            content: selectedArticle.content,
                            category_id: selectedArticle.category_id,
                          });
                          setShowArticleForm(true);
                        }}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg transition"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleDeleteArticle(selectedArticle.id)}
                        className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg transition"
                      >
                        🗑️ Excluir
                      </button>
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {selectedArticle.content}
                </div>

                {/* PDF anexo */}
                {selectedArticle.pdf_url && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <a
                      href={selectedArticle.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2.5 rounded-xl transition w-fit"
                    >
                      <span>📄</span>
                      <span className="text-sm font-medium">
                        {selectedArticle.pdf_name || "Ver PDF"}
                      </span>
                    </a>
                    {isAdminOrSupervisor && (
                      <button
                        onClick={async () => {
                          await removeArticlePdf(selectedArticle.id);
                          loadData(
                            isAdminOrSupervisor
                              ? selectedUser?.id
                              : profile?.id,
                          );
                          setSelectedArticle({
                            ...selectedArticle,
                            pdf_url: null,
                            pdf_name: null,
                          });
                        }}
                        className="text-xs text-red-400 hover:text-red-600 mt-2 block transition"
                      >
                        Remover PDF
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {isAdminOrSupervisor && (
                  <button
                    onClick={() => {
                      setShowArticleForm(true);
                      setEditingArticle(null);
                      setArticleForm({
                        title: "",
                        content: "",
                        category_id: selectedCategory?.id || "",
                      });
                    }}
                    className="w-full bg-white border-2 border-dashed border-blue-200 hover:border-blue-400 text-blue-500 text-sm font-medium py-3 rounded-2xl transition"
                  >
                    + Novo artigo em {selectedCategory?.icon}{" "}
                    {selectedCategory?.name}
                  </button>
                )}
                {filteredArticles.filter(
                  (a) =>
                    !searchQuery ||
                    a.title
                      ?.toLowerCase()
                      .includes(searchQuery.toLowerCase()) ||
                    a.content
                      ?.toLowerCase()
                      .includes(searchQuery.toLowerCase()),
                ).length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
                    <p className="text-gray-400 text-sm">
                      Nenhum artigo nesta categoria ainda.
                    </p>
                  </div>
                ) : (
                  filteredArticles
                    .filter(
                      (a) =>
                        !searchQuery ||
                        a.title
                          ?.toLowerCase()
                          .includes(searchQuery.toLowerCase()) ||
                        a.content
                          ?.toLowerCase()
                          .includes(searchQuery.toLowerCase()),
                    )
                    .map((article) => (
                      <button
                        key={article.id}
                        onClick={() => setSelectedArticle(article)}
                        className="w-full bg-white rounded-2xl shadow-sm p-4 text-left hover:shadow-md transition"
                      >
                        <p className="font-semibold text-gray-800 text-sm">
                          {article.title}
                        </p>
                        <p className="text-gray-400 text-xs mt-1 line-clamp-2">
                          {article.content}
                        </p>
                      </button>
                    ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
