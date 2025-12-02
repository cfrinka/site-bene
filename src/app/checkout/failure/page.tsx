"use client";

import Container from "@/components/ui/Container";
import { H1, Text } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";

export default function CheckoutFailurePage() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-red-50 to-white">
            <Container className="py-20">
                <div className="max-w-2xl mx-auto text-center">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg
                            className="w-10 h-10 text-red-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </div>

                    <H1 className="text-red-600 mb-4">Pagamento Não Aprovado</H1>

                    <Text className="text-lg mb-6">
                        Houve um problema ao processar seu pagamento.
                    </Text>

                    <div className="bg-white rounded-lg border border-red-200 p-6 mb-8">
                        <Text className="text-neutral-700">
                            Possíveis motivos:
                        </Text>
                        <ul className="mt-4 space-y-2 text-left text-sm text-neutral-600">
                            <li>• Saldo insuficiente</li>
                            <li>• Dados do cartão incorretos</li>
                            <li>• Limite de crédito excedido</li>
                            <li>• Problemas com a operadora</li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <Text className="text-neutral-700">
                            Não se preocupe, você pode tentar novamente com outro método de pagamento.
                        </Text>

                        <div className="flex gap-4 justify-center mt-8">
                            <Button href="/carrinho" variant="primary">
                                Voltar ao Carrinho
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
