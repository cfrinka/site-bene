"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Container from "@/components/ui/Container";
import { H1, Text } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/contexts/CartContext";

function SearchParamsWrapper() {
    const searchParams = useSearchParams();
    return <SearchParamsContent searchParams={searchParams} />;
}

function SearchParamsContent({ searchParams }: { searchParams: ReturnType<typeof useSearchParams> }) {
    const router = useRouter();
    const { clearCart } = useCart();

    const paymentId = searchParams.get("payment_id");
    const status = searchParams.get("status");

    useEffect(() => {
        // Limpar carrinho após pagamento aprovado
        if (status === "approved") {
            clearCart();
        }
    }, [status, clearCart]);

    return (
        <main className="min-h-screen bg-gradient-to-br from-green-50 to-white">
            <Container className="py-20">
                <div className="max-w-2xl mx-auto text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg
                            className="w-10 h-10 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </div>

                    <H1 className="text-green-600 mb-4">Pagamento Aprovado!</H1>

                    <Text className="text-lg mb-6">
                        Seu pedido foi confirmado e está sendo processado.
                    </Text>

                    {paymentId && (
                        <div className="bg-white rounded-lg border border-green-200 p-6 mb-8">
                            <Text className="text-sm text-neutral-600 mb-2">ID do Pagamento</Text>
                            <Text className="font-mono text-lg font-semibold">{paymentId}</Text>
                        </div>
                    )}

                    <div className="space-y-4">
                        <Text className="text-neutral-700">
                            Você receberá um e-mail com os detalhes do seu pedido e informações de rastreamento assim que ele for enviado.
                        </Text>

                        <div className="flex gap-4 justify-center mt-8">
                            <Button href="/perfil" variant="primary">
                                Ver Meus Pedidos
                            </Button>
                            <Button href="/produtos" variant="outline">
                                Continuar Comprando
                            </Button>
                        </div>
                    </div>
                </div>
            </Container>
        </main>
    );
}

export default function CheckoutSuccessPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SearchParamsWrapper />
        </Suspense>
    );
}
