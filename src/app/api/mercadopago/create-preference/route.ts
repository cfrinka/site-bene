import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { items, shipping, shippingAddress, userId, orderData } = body;

        // Mercado Pago Access Token - deve ser configurado nas variáveis de ambiente
        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

        if (!accessToken) {
            return NextResponse.json(
                { error: "Mercado Pago não configurado" },
                { status: 500 }
            );
        }

        // Preparar itens para o Mercado Pago
        const mpItems = items.map((item: any) => ({
            title: `${item.title}${item.size ? ` - ${item.size}` : ""}${item.color ? ` - ${item.color}` : ""}`,
            quantity: item.quantity,
            unit_price: item.price,
            currency_id: "BRL",
        }));

        // Adicionar frete como item separado se houver custo
        if (shipping && shipping.price > 0) {
            mpItems.push({
                title: `Frete - ${shipping.name}`,
                quantity: 1,
                unit_price: shipping.price,
                currency_id: "BRL",
            });
        }

        // Criar preferência no Mercado Pago
        const preference = {
            items: mpItems,
            payer: {
                name: shippingAddress.name,
                phone: {
                    number: shippingAddress.phone,
                },
                address: {
                    street_name: shippingAddress.street,
                    street_number: shippingAddress.number,
                    zip_code: shippingAddress.zipCode,
                },
            },
            back_urls: {
                success: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/checkout/success`,
                failure: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/checkout/failure`,
                pending: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/checkout/pending`,
            },
            auto_return: "approved" as const,
            external_reference: userId, // Referência para identificar o pedido
            notification_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/mercadopago/webhook`,
            metadata: {
                userId,
                orderData: JSON.stringify(orderData),
            },
        };

        // Fazer requisição para API do Mercado Pago
        const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(preference),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Erro ao criar preferência:", data);
            return NextResponse.json(
                { error: "Erro ao criar preferência de pagamento" },
                { status: response.status }
            );
        }

        return NextResponse.json({
            preferenceId: data.id,
            initPoint: data.init_point,
            sandboxInitPoint: data.sandbox_init_point,
        });
    } catch (error) {
        console.error("Erro na API de preferência:", error);
        return NextResponse.json(
            { error: "Erro interno do servidor" },
            { status: 500 }
        );
    }
}
