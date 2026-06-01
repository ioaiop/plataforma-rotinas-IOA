"use client";

import { useState, useEffect } from "react";
import { loadProfile, saveProfile } from "@/lib/services/profileService";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    loadProfile().then((data) => {
      if (!data) return;
      setProfile(data);
      if (data?.avatar_url) setAvatarPreview(data.avatar_url);
    });
  }, []);

  function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    const { error, avatar_url } = await saveProfile(profile, avatarFile);
    if (error) {
      setError(error);
      setLoading(false);
      return;
    }
    setProfile((prev) => ({ ...prev, avatar_url }));
    setAvatarFile(null);
    setSuccess(true);
    setLoading(false);
  }

  if (!profile) return <p className="text-gray-500">Carregando...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Meu Perfil</h1>
      <div className="bg-white rounded-2xl shadow-sm p-8 max-w-2xl">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-24 h-24 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl font-bold text-blue-700">
                {profile.full_name?.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <label className="cursor-pointer bg-blue-700 hover:bg-blue-800 text-white text-sm px-4 py-2 rounded-lg transition">
              Alterar foto
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </label>
            <p className="text-gray-400 text-xs mt-2">
              JPG ou PNG. Máximo 2MB.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome completo
            </label>
            <input
              type="text"
              value={profile.full_name || ""}
              onChange={(e) =>
                setProfile({ ...profile, full_name: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-mail
            </label>
            <input
              type="text"
              value={profile.email || ""}
              disabled
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cargo / Função
            </label>
            <input
              type="text"
              value={profile.position || ""}
              onChange={(e) =>
                setProfile({ ...profile, position: e.target.value })
              }
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nível de acesso
            </label>
            <input
              type="text"
              value={
                profile.role === "admin"
                  ? "Administrador"
                  : profile.role === "supervisor"
                    ? "Supervisor"
                    : "Funcionário"
              }
              disabled
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && (
            <p className="text-green-600 text-sm">Perfil salvo com sucesso!</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-2.5 rounded-lg transition disabled:opacity-50"
          >
            {loading ? "Salvando..." : "Salvar alterações"}
          </button>
        </form>
      </div>
    </div>
  );
}
