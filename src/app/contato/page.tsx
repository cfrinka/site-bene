"use client";

import { useState } from "react";
import Container from "@/components/ui/Container";
import { H1, Text } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { saveDocument } from "@/lib/firebase";
import { useToast } from "@/components/ui/Toast";

export default function ContatoPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const { show } = useToast();

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação
    if (!nome.trim()) {
      show({ description: "Por favor, preencha seu nome", variant: "error" });
      return;
    }

    if (!email.trim()) {
      show({ description: "Por favor, preencha seu e-mail", variant: "error" });
      return;
    }

    if (!validateEmail(email)) {
      show({ description: "Por favor, insira um e-mail válido", variant: "error" });
      return;
    }

    if (!assunto.trim()) {
      show({ description: "Por favor, preencha o assunto", variant: "error" });
      return;
    }

    if (!mensagem.trim()) {
      show({ description: "Por favor, escreva sua mensagem", variant: "error" });
      return;
    }

    setEnviando(true);

    try {
      const messageData = {
        nome: nome.trim(),
        email: email.trim(),
        assunto: assunto.trim(),
        mensagem: mensagem.trim(),
        dataEnvio: new Date().toISOString(),
        lida: false,
      };

      const result = await saveDocument("mensagens-site", messageData);

      if (result.ok) {
        show({ description: "Mensagem enviada com sucesso! Responderemos em breve.", variant: "success" });
        // Limpar formulário
        setNome("");
        setEmail("");
        setAssunto("");
        setMensagem("");
      } else {
        show({ description: "Erro ao enviar mensagem. Tente novamente.", variant: "error" });
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      show({ description: "Erro ao enviar mensagem. Tente novamente.", variant: "error" });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="min-h-screen">
      <Container className="max-w-4xl py-20">
        <H1>Fale com a gente</H1>
        <Text className="mt-3">Dúvidas, parcerias ou imprensa? Manda um alô — respondemos rapidinho.</Text>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="rounded-md border border-neutral-300 px-3 py-2 outline-none placeholder:text-neutral-500 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              placeholder="Seu nome *"
              required
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md border border-neutral-300 px-3 py-2 outline-none placeholder:text-neutral-500 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
              placeholder="Seu e-mail *"
              required
            />
          </div>
          <input
            type="text"
            value={assunto}
            onChange={(e) => setAssunto(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 outline-none placeholder:text-neutral-500 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
            placeholder="Assunto *"
            required
          />
          <textarea
            rows={6}
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 outline-none placeholder:text-neutral-500 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
            placeholder="Mensagem *"
            required
          />
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={enviando}>
              {enviando ? "Enviando..." : "Enviar"}
            </Button>
            <span className="text-xs text-neutral-500">Ao enviar, você aceita nossa política de privacidade.</span>
          </div>
        </form>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          <Card className="p-5">
            <h3 className="font-display font-semibold">Atendimento</h3>
            <p className="mt-1 text-sm text-neutral-600">seg–sex, 9h às 18h</p>
          </Card>
          <Card className="p-5">
            <h3 className="font-display font-semibold">E-mail</h3>
            <p className="mt-1 text-sm text-neutral-600">contato@benebrasil.com</p>
          </Card>
          <Card className="p-5">
            <h3 className="font-display font-semibold">Redes</h3>
            <p className="mt-1 text-sm text-neutral-600">@benebrasiloficial</p>
          </Card>
        </div>
      </Container>
    </main>
  );
}
