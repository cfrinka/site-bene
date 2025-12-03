import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { items, shipping, shippingAddress, userId, orderData } = body;

        // Validar dados obrigatórios
        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: "Items são obrigatórios" },
                { status: 400 }
            );
        }

        if (!shippingAddress || !shippingAddress.name || !shippingAddress.phone) {
            return NextResponse.json(
                { error: "Endereço de entrega incompleto" },
                { status: 400 }
            );
        }

        if (!userId) {
            return NextResponse.json(
                { error: "Usuário não identificado" },
                { status: 400 }
            );
        }

        // Mercado Pago Access Token - deve ser configurado nas variáveis de ambiente
        const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

        if (!accessToken) {
            return NextResponse.json(
                { error: "Mercado Pago não configurado" },
                { status: 500 }
            );
        }

        // Preparar itens para o Mercado Pago
        const mpItems = items.map((item: any) => {
            // Validar campos obrigatórios do item
            if (!item.title || !item.quantity || !item.price) {
                throw new Error("Item com dados incompletos");
            }

            // Garantir que o preço seja um número válido e positivo
            const unitPrice = parseFloat(item.price.toString());
            if (isNaN(unitPrice) || unitPrice <= 0) {
                throw new Error(`Preço inválido para o item: ${item.title}`);
            }

            return {
                title: `${item.title}${item.size ? ` - ${item.size}` : ""}${item.color ? ` - ${item.color}` : ""}`,
                quantity: parseInt(item.quantity.toString()),
                unit_price: unitPrice,
                currency_id: "BRL",
            };
        });

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
        // Garantir que temos uma URL base válida
        let baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

        // Se não houver URL base configurada, tentar obter do request
        if (!baseUrl) {
            const host = request.headers.get("host");
            const protocol = request.headers.get("x-forwarded-proto") || "http";
            baseUrl = `${protocol}://${host}`;
        }

        console.log("Creating preference with baseUrl:", baseUrl);

        const preference: any = {
            items: mpItems,
            back_urls: {
                success: `${baseUrl}/checkout/success`,
                failure: `${baseUrl}/checkout/failure`,
                pending: `${baseUrl}/checkout/pending`,
            },
            auto_return: "approved",
            external_reference: userId,
            notification_url: `${baseUrl}/api/mercadopago/webhook`,
            statement_descriptor: "BENE BRASIL",
        };

        // Adicionar metadata apenas se houver dados
        if (orderData) {
            preference.metadata = {
                userId,
                orderData: JSON.stringify(orderData),
            };
        }

        // Adicionar informações do pagador se disponíveis
        if (shippingAddress.name) {
            preference.payer = {
                name: shippingAddress.name,
            };

            // Adicionar telefone se disponível
            if (shippingAddress.phone) {
                const phoneNumber = shippingAddress.phone.replace(/\D/g, "");
                if (phoneNumber.length >= 10) {
                    preference.payer.phone = {
                        area_code: phoneNumber.substring(0, 2),
                        number: phoneNumber.substring(2),
                    };
                }
            }

            // Adicionar endereço se disponível
            if (shippingAddress.street && shippingAddress.zipCode) {
                preference.payer.address = {
                    zip_code: shippingAddress.zipCode.replace(/\D/g, ""),
                };

                if (shippingAddress.street) {
                    preference.payer.address.street_name = shippingAddress.street;
                }

                if (shippingAddress.number) {
                    preference.payer.address.street_number = parseInt(shippingAddress.number.toString()) || 0;
                }
            }
        }

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
            console.error("Erro ao criar preferência no Mercado Pago:", {
                status: response.status,
                data,
                sentPreference: preference,
            });
            return NextResponse.json(
                {
                    error: "Erro ao criar preferência de pagamento",
                    details: data.message || data.error || "Erro desconhecido",
                    cause: data.cause || [],
                },
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
            {
                error: "Erro interno do servidor",
                details: error instanceof Error ? error.message : "Erro desconhecido"
            },
            { status: 500 }
        );
    }
}
