"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "./Button";

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        await signIn(email, password);
      } else {
        await signUp(email, password, displayName);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      // Map Firebase error codes to user-friendly messages
      const errorMessage = err.message || err.code || "Ocorreu um erro";

      if (errorMessage.includes("email-already-in-use") || errorMessage.includes("auth/email-already-in-use")) {
        setError("Este e-mail já está cadastrado. Tente fazer login ou use outro e-mail.");
      } else if (errorMessage.includes("invalid-email") || errorMessage.includes("auth/invalid-email")) {
        setError("E-mail inválido. Verifique o endereço digitado.");
      } else if (errorMessage.includes("weak-password") || errorMessage.includes("auth/weak-password")) {
        setError("Senha muito fraca. Use pelo menos 6 caracteres.");
      } else if (errorMessage.includes("user-not-found") || errorMessage.includes("auth/user-not-found")) {
        setError("Usuário não encontrado. Verifique seu e-mail ou crie uma conta.");
      } else if (errorMessage.includes("wrong-password") || errorMessage.includes("auth/wrong-password")) {
        setError("Senha incorreta. Tente novamente.");
      } else if (errorMessage.includes("too-many-requests") || errorMessage.includes("auth/too-many-requests")) {
        setError("Muitas tentativas. Aguarde alguns minutos e tente novamente.");
      } else if (errorMessage.includes("network-request-failed")) {
        setError("Erro de conexão. Verifique sua internet e tente novamente.");
      } else {
        setError("Ocorreu um erro. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-display font-bold">
            {mode === "login" ? "Entrar" : "Criar conta"}
          </h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700 cursor-pointer">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Nome</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 outline-none focus:border-brand-primary"
                placeholder="Seu nome"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 outline-none focus:border-brand-primary"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 outline-none focus:border-brand-primary"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" className="w-full" disabled={loading}>
            {loading ? "Carregando..." : mode === "login" ? "Entrar" : "Criar conta"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          {mode === "login" ? (
            <p>
              Não tem uma conta?{" "}
              <button
                type="button"
                onClick={() => setMode("register")}
                className="text-brand-primary hover:underline font-medium"
              >
                Criar conta
              </button>
            </p>
          ) : (
            <p>
              Já tem uma conta?{" "}
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-brand-primary hover:underline font-medium"
              >
                Entrar
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
