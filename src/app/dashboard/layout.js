"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { getUser, getProfile, signOut } from "@/lib/auth";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/db/notifications";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (!profile) return;
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [profile]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  async function loadProfile() {
    const user = await getUser();
    if (!user) return;
    const data = await getProfile(user.id);
    setProfile(data);
  }

  async function loadNotifications() {
    const user = await getUser();
    if (!user) return;
    const data = await getNotifications(user.id);
    setNotifications(data);
  }

  async function markAsRead(notif) {
    await markNotificationRead(notif.id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)),
    );
    setShowNotifications(false);
    router.push(`/dashboard/tasks?task=${notif.task_id}`);
  }

  async function markAllAsRead() {
    const user = await getUser();
    if (!user) return;
    await markAllNotificationsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  async function handleLogout() {
    await signOut();
    router.push("/login");
  }

  const unreadCount = notifications.filter((n) => !n.read).length;
  const isAdmin = profile?.role === "admin" || profile?.role === "supervisor";
  const w = sidebarCollapsed ? "lg:w-16" : "lg:w-64";

  const navGroups = [
    {
      label: "Principal",
      links: [
        { href: "/dashboard", label: "Início", icon: "🏠" },
        { href: "/dashboard/tasks", label: "Tarefas", icon: "✅" },
        { href: "/dashboard/stats", label: "Estatísticas", icon: "📊" },
      ],
    },
    {
      label: "Gestão",
      adminOnly: true,
      links: [
        { href: "/dashboard/manage", label: "Gerenciar", icon: "⚙️" },
        { href: "/dashboard/users", label: "Usuários", icon: "👥" },
        { href: "/dashboard/history", label: "Histórico", icon: "📋" },
        { href: "/dashboard/estoque", label: "Estoque", icon: "📦" },
      ],
    },
    {
      label: "Conteúdo",
      links: [
        { href: "/dashboard/manual", label: "Manual", icon: "📖" },
        { href: "/dashboard/pop", label: "POPs", icon: "📄" },
      ],
    },
    {
      label: "Geral",
      links: [
        { href: "/dashboard/guia", label: "Guia de Uso", icon: "🎓" },
        { href: "/dashboard/instalar", label: "Instalar App", icon: "📲" },
        { href: "/dashboard/profile", label: "Meu Perfil", icon: "👤" },
      ],
    },
  ];

  const notifIcon = (type) => {
    if (type === "comment") return "💬";
    if (type === "completed") return "✅";
    if (type === "not_completed") return "❌";
    if (type === "approved") return "🎉";
    if (type === "mention") return "📣";
    return "🔔";
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
    fixed h-full z-30 bg-blue-950 text-white flex flex-col transition-all duration-300 overflow-y-auto pt-2
    w-64 ${w}
    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
    lg:translate-x-0
  `}
      >
        {/* Header */}
        <div className="border-b border-blue-800 flex-shrink-0">
          {/* Botão minimizar */}
          <div className="flex justify-end px-3 pt-3">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex w-6 h-6 rounded-full bg-blue-800 hover:bg-blue-700 items-center justify-center transition"
            >
              <span className="text-xs">{sidebarCollapsed ? "→" : "←"}</span>
            </button>
          </div>
          {/* Logo */}
          <div
            className={`px-4 pb-4 ${sidebarCollapsed ? "flex justify-center" : "flex items-center gap-3"}`}
          >
            <img
              src="/logo.png"
              alt="logo"
              className="w-8 h-8 rounded-xl object-cover flex-shrink-0"
            />
            {!sidebarCollapsed && (
              <div>
                <p className="font-bold text-sm">Plataforma</p>
                <p className="text-blue-300 text-xs">de Rotinas</p>
              </div>
            )}
          </div>
        </div>

        {/* Profile */}
        {profile && !sidebarCollapsed && (
          <div className="p-4 border-b border-blue-800 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-sm">
                    {profile.full_name?.charAt(0)}
                  </span>
                )}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold truncate">
                  {profile.full_name}
                </p>
                <p className="text-blue-300 text-xs truncate">
                  {profile.position}
                </p>
              </div>
            </div>
          </div>
        )}

        {profile && sidebarCollapsed && (
          <div className="p-3 border-b border-blue-800 flex justify-center flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center overflow-hidden">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-xs">
                  {profile.full_name?.charAt(0)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-4">
          {navGroups.map((group) => {
            if (group.adminOnly && !isAdmin) return null;
            return (
              <div key={group.label}>
                {!sidebarCollapsed && (
                  <p className="text-blue-400 text-xs font-semibold uppercase tracking-wider px-2 mb-1">
                    {group.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {group.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      title={sidebarCollapsed ? link.label : undefined}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                        pathname === link.href
                          ? "bg-blue-700 text-white font-semibold"
                          : "text-blue-200 hover:bg-blue-800"
                      } ${sidebarCollapsed ? "justify-center" : ""}`}
                    >
                      <span className="text-base flex-shrink-0">
                        {link.icon}
                      </span>
                      {!sidebarCollapsed && <span>{link.label}</span>}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-blue-800 flex-shrink-0">
          <button
            onClick={handleLogout}
            title={sidebarCollapsed ? "Sair" : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-blue-200 hover:bg-blue-800 transition ${sidebarCollapsed ? "justify-center" : ""}`}
          >
            <span className="text-base">🚪</span>
            {!sidebarCollapsed && <span>Sair</span>}
          </button>
          {!sidebarCollapsed && (
            <div className="mt-3 text-center">
              <p className="text-blue-400 text-xs">Desenvolvido por</p>
              <a
                href="https://www.instagram.com/ivelcod"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-300 hover:text-white text-xs font-semibold transition"
              >
                Ivel Cod
              </a>
            </div>
          )}
        </div>
      </aside>

      <main
        className={`flex-1 min-w-0 transition-all duration-300 ${sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"}`}
      >
        <div className="flex items-center justify-between p-4 lg:p-6 lg:pb-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center hover:bg-gray-50 transition"
          >
            <span className="text-xl">☰</span>
          </button>
          <div className="flex-1" />
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center hover:bg-gray-50 transition"
            >
              <span className="text-xl">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <p className="font-semibold text-gray-800">Notificações</p>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Marcar todas como lidas
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
                  {notifications.length === 0 && (
                    <p className="text-gray-400 text-sm text-center py-8">
                      Nenhuma notificação.
                    </p>
                  )}
                  {notifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => markAsRead(notif)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition ${!notif.read ? "bg-blue-50" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg mt-0.5">
                          {notifIcon(notif.type)}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm text-gray-700">
                            {notif.message}
                          </p>
                          {notif.tasks?.title && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              "{notif.tasks.title}"
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(notif.created_at).toLocaleString("pt-BR")}
                          </p>
                        </div>
                        {!notif.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
