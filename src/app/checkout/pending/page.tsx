"use client";

import Container from "@/components/ui/Container";
import { H1, Text } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";

export default function CheckoutPendingPage() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-yellow-50 to-white">
            <Container className="py-20">
                <div className="max-w-2xl mx-auto text-center">
                    <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg
                            className="w-10 h-10 text-yellow-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>

                    <H1 className="text-yellow-600 mb-4">Pagamento Pendente</H1>

                    <Text className="text-lg mb-6">
                        Seu pagamento está sendo processado.
                    </Text>

                    <div className="bg-white rounded-lg border border-yellow-200 p-6 mb-8">
                        <Text className="text-neutral-700 mb-4">
                            Isso pode acontecer quando:
                        </Text>
                        <ul className="space-y-2 text-left text-sm text-neutral-600">
                            <li>• Pagamento via boleto (aguardando compensação)</li>
                            <li>• Pagamento via Pix (aguardando confirmação)</li>
                            <li>• Transferência bancária em processamento</li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <Text className="text-neutral-700">
                            Você receberá um e-mail assim que o pagamento for confirmado.
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
