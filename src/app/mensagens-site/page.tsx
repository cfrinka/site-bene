"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Container from "@/components/ui/Container";
import { H1 } from "@/components/ui/Typography";
import { Card } from "@/components/ui/Card";
import { subscribeCollection, updateDocument } from "@/lib/firebase";
import { useToast } from "@/components/ui/Toast";

type Message = {
    id: string;
    nome: string;
    email: string;
    assunto: string;
    mensagem: string;
    dataEnvio: string;
    lida: boolean;
};

export default function MensagensSitePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"todas" | "nao-lidas" | "lidas">("todas");
    const { show } = useToast();

    // Redirect non-admin users
    useEffect(() => {
        if (!authLoading && (!user || user.role !== "admin")) {
            router.push("/");
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (!user || user.role !== "admin") return;

        let unsubscribe: (() => void) | null = null;

        const loadMessages = async () => {
            try {
                unsubscribe = await subscribeCollection("mensagens-site", (items) => {
                    const msgs = items as Message[];
                    // Sort by date, newest first
                    msgs.sort((a, b) => new Date(b.dataEnvio).getTime() - new Date(a.dataEnvio).getTime());
                    setMessages(msgs);
                    setLoading(false);
                });
            } catch (error) {
                console.error("Erro ao carregar mensagens:", error);
                setLoading(false);
            }
        };

        loadMessages();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [user]);

    const toggleLida = async (messageId: string, currentStatus: boolean) => {
        try {
            const result = await updateDocument("mensagens-site", messageId, {
                lida: !currentStatus,
            });

            if (result.ok) {
                show({
                    description: !currentStatus ? "Mensagem marcada como lida" : "Mensagem marcada como não lida",
                    variant: "success"
                });
            }
        } catch (error) {
            console.error("Erro ao atualizar mensagem:", error);
            show({ description: "Erro ao atualizar mensagem", variant: "error" });
        }
    };

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Show nothing while checking auth
    if (authLoading || !user || user.role !== "admin") {
        return null;
    }

    if (loading) {
        return (
            <main className="min-h-screen">
                <Container className="py-20">
                    <H1>Mensagens do Site</H1>
                    <p className="mt-4 text-neutral-600">Carregando mensagens...</p>
                </Container>
            </main>
        );
    }

    // Filter messages based on active tab
    const filteredMessages = messages.filter((msg) => {
        if (activeTab === "nao-lidas") return !msg.lida;
        if (activeTab === "lidas") return msg.lida;
        return true; // "todas"
    });

    const naoLidasCount = messages.filter(m => !m.lida).length;
    const lidasCount = messages.filter(m => m.lida).length;

    return (
        <main className="min-h-screen bg-neutral-100">
            <Container className="py-20">
                <H1 className="mb-8 text-neutral-900">Mensagens do Site</H1>

                {/* Tabs */}
                <div className="border-b border-neutral-300 mb-8">
                    <div className="flex gap-8">
                        <button
                            onClick={() => setActiveTab("todas")}
                            className={`pb-4 px-2 font-medium transition-colors relative ${activeTab === "todas"
                                ? "text-brand-primary"
                                : "text-neutral-600 hover:text-neutral-900"
                                }`}
                        >
                            Todas
                            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-neutral-200 text-neutral-700">
                                {messages.length}
                            </span>
                            {activeTab === "todas" && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
                            )}
                        </button>

                        <button
                            onClick={() => setActiveTab("nao-lidas")}
                            className={`pb-4 px-2 font-medium transition-colors relative ${activeTab === "nao-lidas"
                                ? "text-brand-primary"
                                : "text-neutral-600 hover:text-neutral-900"
                                }`}
                        >
                            Não Lidas
                            {naoLidasCount > 0 && (
                                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-brand-primary text-white font-semibold">
                                    {naoLidasCount}
                                </span>
                            )}
                            {activeTab === "nao-lidas" && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
                            )}
                        </button>

                        <button
                            onClick={() => setActiveTab("lidas")}
                            className={`pb-4 px-2 font-medium transition-colors relative ${activeTab === "lidas"
                                ? "text-brand-primary"
                                : "text-neutral-600 hover:text-neutral-900"
                                }`}
                        >
                            Lidas
                            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-neutral-200 text-neutral-700">
                                {lidasCount}
                            </span>
                            {activeTab === "lidas" && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
                            )}
                        </button>
                    </div>
                </div>

                {filteredMessages.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-lg border border-neutral-200 shadow-sm">
                        <p className="text-neutral-600">
                            {activeTab === "todas" && "Nenhuma mensagem recebida ainda."}
                            {activeTab === "nao-lidas" && "Nenhuma mensagem não lida."}
                            {activeTab === "lidas" && "Nenhuma mensagem lida."}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredMessages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`p-6 rounded-lg border transition-colors ${msg.lida
                                    ? "bg-white border-neutral-200"
                                    : "bg-white border-brand-primary shadow-md"
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-display font-semibold text-lg text-neutral-900">{msg.assunto}</h3>
                                            {!msg.lida && (
                                                <span className="px-2 py-1 text-xs font-semibold bg-brand-primary text-white rounded">
                                                    Nova
                                                </span>
                                            )}
                                        </div>

                                        <div className="text-sm text-neutral-600 mb-3">
                                            <span className="font-medium text-neutral-900">{msg.nome}</span>
                                            {" • "}
                                            <a href={`mailto:${msg.email}`} className="hover:text-brand-primary transition-colors">
                                                {msg.email}
                                            </a>
                                            {" • "}
                                            <span>{formatDate(msg.dataEnvio)}</span>
                                        </div>

                                        <p className="text-neutral-700 whitespace-pre-wrap leading-relaxed">{msg.mensagem}</p>
                                    </div>

                                    <button
                                        onClick={() => toggleLida(msg.id, msg.lida)}
                                        className="px-4 py-2 text-sm rounded-md border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 transition-colors whitespace-nowrap"
                                    >
                                        {msg.lida ? "Marcar como não lida" : "Marcar como lida"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Container>
        </main>
    );
}
