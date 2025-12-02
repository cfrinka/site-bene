import { NextRequest, NextResponse } from "next/server";
import { createOrder } from "@/lib/firebase";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Mercado Pago envia notificações de diferentes tipos
        // Vamos processar apenas notificações de pagamento
        if (body.type === "payment") {
            const paymentId = body.data.id;
            const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

            if (!accessToken) {
                return NextResponse.json({ error: "Configuração inválida" }, { status: 500 });
            }

            // Buscar informações do pagamento
            const paymentResponse = await fetch(
                `https://api.mercadopago.com/v1/payments/${paymentId}`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            const payment = await paymentResponse.json();

            // Se o pagamento foi aprovado, criar o pedido no Firebase
            if (payment.status === "approved") {
                const metadata = payment.metadata;
                const userId = metadata.user_id || payment.external_reference;

                if (metadata.order_data) {
                    try {
                        const orderData = JSON.parse(metadata.order_data);

                        // Criar pedido no Firebase
                        await createOrder({
                            userId,
                            items: orderData.items,
                            total: payment.transaction_amount,
                            shipping: orderData.shipping,
                            shippingAddress: orderData.shippingAddress,
                            paymentId: payment.id.toString(),
                            paymentStatus: payment.status,
                            paymentMethod: payment.payment_method_id,
                        });
                    } catch (error) {
                        console.error("Erro ao criar pedido:", error);
                    }
                }
            }
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("Erro no webhook:", error);
        return NextResponse.json({ error: "Erro ao processar webhook" }, { status: 500 });
    }
}
