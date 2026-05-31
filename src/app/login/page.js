"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const UNITS = [
  {
    id: "4bde7bb3-abc3-49df-949d-91cc21c53b69",
    name: "Campina Grande",
    short: "CG",
    color: "from-blue-950 to-blue-800",
    button: "bg-blue-700 hover:bg-blue-800",
    ring: "focus:ring-blue-500",
    badge: "bg-blue-100 text-blue-700",
  },
  {
    id: "566ce25b-76d8-4f9c-92cf-147323e4777d",
    name: "João Pessoa",
    short: "JP",
    color: "from-emerald-950 to-emerald-800",
    button: "bg-emerald-700 hover:bg-emerald-800",
    ring: "focus:ring-emerald-500",
    badge: "bg-emerald-100 text-emerald-700",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [selectedUnit, setSelectedUnit] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("E-mail ou senha incorretos.");
      setLoading(false);
      return;
    }

    // Verifica se o usuário pertence à unidade selecionada
    const { data: profile } = await supabase
      .from("profiles")
      .select("unit_id")
      .eq("id", data.user.id)
      .single();

    if (profile?.unit_id !== selectedUnit.id) {
      await supabase.auth.signOut();
      setError(`Este usuário não pertence à unidade ${selectedUnit.name}.`);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  async function handleReset(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError("Erro ao enviar e-mail. Verifique o endereço informado.");
      setLoading(false);
      return;
    }

    setResetSent(true);
    setLoading(false);
  }

  // Tela de seleção de unidade
  if (!selectedUnit) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 to-blue-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <img
                src="/login.png"
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-white">
              Plataforma de Rotinas
            </h1>
            <p className="text-blue-200 text-sm mt-1">
              Selecione sua unidade para continuar
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {UNITS.map((unit) => (
              <button
                key={unit.id}
                onClick={() => setSelectedUnit(unit)}
                className="bg-white rounded-2xl p-6 text-center hover:shadow-xl transition hover:scale-105 group"
              >
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${unit.color} flex items-center justify-center mx-auto mb-3`}
                >
                  <span className="text-white font-bold text-lg">
                    {unit.short}
                  </span>
                </div>
                <p className="font-bold text-gray-800 text-sm">IOA IOP</p>
                <p className="text-gray-500 text-xs mt-0.5">{unit.name}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Tela de login
  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${selectedUnit.color} flex items-center justify-center p-4`}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Logo / Título */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <img
              src="/login.png"
              alt="Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            Plataforma de Rotinas
          </h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${selectedUnit.badge}`}
            >
              📍 {selectedUnit.name}
            </span>
            <button
              onClick={() => {
                setSelectedUnit(null);
                setError("");
                setEmail("");
                setPassword("");
              }}
              className="text-xs text-gray-400 hover:text-gray-600 hover:underline"
            >
              Trocar
            </button>
          </div>
          {!resetMode && (
            <p className="text-gray-500 text-sm mt-2">
              Faça login para continuar
            </p>
          )}
          {resetMode && (
            <p className="text-gray-500 text-sm mt-2">Recuperação de senha</p>
          )}
        </div>

        {/* Formulário de Login */}
        {!resetMode && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${selectedUnit.ring}`}
                placeholder="seu@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${selectedUnit.ring}`}
                placeholder="••••••••"
                required
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className={`w-full ${selectedUnit.button} text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50`}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>

            <button
              type="button"
              onClick={() => {
                setResetMode(true);
                setError("");
              }}
              className="w-full text-sm text-gray-500 hover:underline text-center"
            >
              Esqueci minha senha
            </button>
          </form>
        )}

        {/* Formulário de Recuperação */}
        {resetMode && !resetSent && (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-mail cadastrado
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${selectedUnit.ring}`}
                placeholder="seu@email.com"
                required
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className={`w-full ${selectedUnit.button} text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50`}
            >
              {loading ? "Enviando..." : "Enviar link de recuperação"}
            </button>

            <button
              type="button"
              onClick={() => {
                setResetMode(false);
                setError("");
              }}
              className="w-full text-sm text-gray-500 hover:underline text-center"
            >
              Voltar ao login
            </button>
          </form>
        )}

        {/* Confirmação de envio */}
        {resetMode && resetSent && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-green-600 text-2xl">✓</span>
            </div>
            <p className="text-gray-700 text-sm">
              Link de recuperação enviado para <strong>{email}</strong>.
              Verifique sua caixa de entrada.
            </p>
            <button
              onClick={() => {
                setResetMode(false);
                setResetSent(false);
                setError("");
              }}
              className="w-full text-sm text-blue-600 hover:underline"
            >
              Voltar ao login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
