"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "./Button";
import { Input } from "./input";
import { Label } from "./label";
import { Alert, AlertDescription } from "./alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./dialog";

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

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display">
            {mode === "login" ? "Entrar" : "Criar conta"}
          </DialogTitle>
          <DialogDescription>
            {mode === "login" 
              ? "Entre com sua conta para continuar"
              : "Crie sua conta para começar a comprar"
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="displayName">Nome</Label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Seu nome"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Carregando..." : mode === "login" ? "Entrar" : "Criar conta"}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <p>
              Não tem uma conta?{" "}
              <button
                type="button"
                onClick={() => setMode("register")}
                className="text-primary hover:underline font-medium"
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
                className="text-primary hover:underline font-medium"
              >
                Entrar
              </button>
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
