"use client";

import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import Container from "@/components/ui/Container";
import { H1, H2, Text } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import ShippingCalculator from "@/components/cart/ShippingCalculator";
import VariantSelector from "@/components/product/VariantSelector";
import { listCollection, createOrder, getUserData, subscribeUserOrders } from "@/lib/firebase";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function CarrinhoPage() {
  const { items, removeItem, updateQuantity, totalPrice, clearCart, addItem } = useCart();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [shippingOption, setShippingOption] = useState<{ name: string; price: number; days: number } | null>(null);
  const [variantSelectorOpen, setVariantSelectorOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    name: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
  });
  const [loadingCep, setLoadingCep] = useState(false);
  const [hasLoadedUserData, setHasLoadedUserData] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  // Carregar dados do usuário e último pedido para preencher automaticamente
  useEffect(() => {
    if (!user || hasLoadedUserData) return;

    const loadUserDataAndLastOrder = async () => {
      try {
        // Buscar dados do usuário
        const userData = await getUserData(user.uid);
        let userName = "";

        if ((userData as any).ok) {
          userName = (userData as any).data.name || user.displayName || "";
        } else {
          userName = user.displayName || "";
        }

        // Buscar último pedido com endereço
        const unsubscribe = await subscribeUserOrders(user.uid, (orders) => {
          if (orders.length > 0) {
            // Pegar o pedido mais recente que tenha endereço
            const lastOrderWithAddress = orders
              .filter(order => order.shippingAddress)
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

            if (lastOrderWithAddress?.shippingAddress) {
              const lastAddress = lastOrderWithAddress.shippingAddress;
              setShippingAddress(prev => ({
                name: userName || lastAddress.name || "",
                street: prev.street || lastAddress.street || "",
                number: prev.number || lastAddress.number || "",
                complement: prev.complement || lastAddress.complement || "",
                neighborhood: prev.neighborhood || lastAddress.neighborhood || "",
                city: prev.city || lastAddress.city || "",
                state: prev.state || lastAddress.state || "",
                zipCode: prev.zipCode || lastAddress.zipCode || "",
                phone: lastAddress.phone || "",
              }));
            } else {
              // Se não houver pedido anterior, apenas preencher o nome
              setShippingAddress(prev => ({
                ...prev,
                name: userName,
              }));
            }
          } else {
            // Se não houver pedidos, apenas preencher o nome
            setShippingAddress(prev => ({
              ...prev,
              name: userName,
            }));
          }
          setHasLoadedUserData(true);
        });

        // Cleanup
        return () => {
          if (unsubscribe) unsubscribe();
        };
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);
        setHasLoadedUserData(true);
      }
    };

    loadUserDataAndLastOrder();
  }, [user, hasLoadedUserData]);

  const handleCepChange = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    setShippingAddress({ ...shippingAddress, zipCode: cep });

    if (cleanCep.length === 8) {
      setLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();

        if (!data.erro) {
          setShippingAddress(prev => ({
            ...prev,
            street: data.logradouro || "",
            neighborhood: data.bairro || "",
            city: data.localidade || "",
            state: data.uf || "",
          }));
        } else {
          alert("CEP não encontrado");
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
        alert("Erro ao buscar CEP");
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const handleShippingCepCalculated = (cep: string, addressData: any) => {
    setShippingAddress(prev => ({
      ...prev,
      zipCode: cep,
      // Preencher apenas se estiver vazio, para não sobrescrever dados já carregados
      street: prev.street || addressData.logradouro || "",
      neighborhood: prev.neighborhood || addressData.bairro || "",
      city: prev.city || addressData.localidade || "",
      state: prev.state || addressData.uf || "",
    }));
  };

  const isAddressComplete = () => {
    return (
      shippingAddress.name.trim() !== "" &&
      shippingAddress.street.trim() !== "" &&
      shippingAddress.number.trim() !== "" &&
      shippingAddress.neighborhood.trim() !== "" &&
      shippingAddress.city.trim() !== "" &&
      shippingAddress.state.trim() !== "" &&
      shippingAddress.zipCode.trim() !== "" &&
      shippingAddress.phone.trim() !== ""
    );
  };

  const handleCheckout = async () => {
    if (!user || !shippingOption) return;

    if (!isAddressComplete()) {
      alert("Por favor, preencha todos os campos do endereço de entrega.");
      return;
    }

    setProcessingOrder(true);
    try {
      // Preparar dados do pedido
      const orderData = {
        items: items.map(item => ({
          productId: item.id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          cover: item.cover,
        })),
        shipping: shippingOption,
        shippingAddress,
      };

      // Criar preferência de pagamento no Mercado Pago
      const response = await fetch("/api/mercadopago/create-preference", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: orderData.items,
          shipping: shippingOption,
          shippingAddress,
          userId: user.uid,
          orderData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Erro na resposta da API:", data);
        const errorMessage = data.details
          ? `${data.error}: ${data.details}`
          : data.error || "Erro ao criar preferência de pagamento";
        throw new Error(errorMessage);
      }

      // Redirecionar para o checkout do Mercado Pago
      // Em produção, use initPoint. Em desenvolvimento/teste, use sandboxInitPoint
      const checkoutUrl = process.env.NODE_ENV === "production"
        ? data.initPoint
        : (data.sandboxInitPoint || data.initPoint);

      if (!checkoutUrl) {
        throw new Error("URL de checkout não foi retornada");
      }

      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Error creating checkout:", error);
      alert(error instanceof Error ? error.message : "Erro ao processar pagamento");
      setProcessingOrder(false);
    }
  };

  if (authLoading) {
    return (
      <main className="min-h-screen">
        <Container className="py-20">
          <div className="text-center">Carregando...</div>
        </Container>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen">
        <Container className="py-20">
          <H1>Carrinho</H1>
          <div className="mt-8 text-center">
            <Text>Seu carrinho está vazio</Text>
            <Button href="/produtos" className="mt-4">
              Ver produtos
            </Button>
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <Container className="py-20">
        <H1>Carrinho</H1>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, index) => {
              // Check if this is the first item of a product group
              const isFirstOfProduct = index === 0 || items[index - 1].id !== item.id;
              // Count how many variants of this product exist
              const productVariantCount = items.filter(i => i.id === item.id).length;

              return (
                <div key={item.variantKey || `${item.id}-${index}`}>
                  {isFirstOfProduct && productVariantCount > 1 && (
                    <div className="mb-2 flex items-center justify-between">
                      <Text className="text-sm font-medium text-neutral-700">
                        {item.title} - {productVariantCount} variantes
                      </Text>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          // Fetch product data from Firebase to get available sizes/colors
                          const result = await listCollection('products');
                          if ((result as any).ok) {
                            const products = (result as any).items;
                            const productData = products.find((p: any) => p.id === item.id);
                            setSelectedProduct({
                              id: item.id,
                              title: item.title,
                              price: item.price,
                              cover: item.cover,
                              sizes: productData?.sizes || [],
                              colors: productData?.colors || []
                            });
                            setVariantSelectorOpen(true);
                          }
                        }}
                        className="text-sm text-brand-primary hover:text-brand-primary/80"
                      >
                        + Adicionar outra variante
                      </Button>
                    </div>
                  )}
                  <Card className="overflow-hidden">
                    <CardBody className="flex gap-4 p-4">
                      <div className="relative w-24 h-24 bg-neutral-100 rounded-md overflow-hidden flex-shrink-0">
                        {item.cover ? (
                          <Image src={item.cover} alt={item.title} fill className="object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-xs text-neutral-500">
                            Sem imagem
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-semibold text-lg">{item.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {item.size && (
                            <span className="text-xs bg-neutral-100 px-2 py-1 rounded">
                              Tamanho: {item.size}
                            </span>
                          )}
                          {item.color && (
                            <span className="text-xs bg-neutral-100 px-2 py-1 rounded">
                              Cor: {item.color}
                            </span>
                          )}
                        </div>
                        <Text className="mt-1">R$ {item.price.toFixed(2)}</Text>

                        <div className="flex items-center gap-3 mt-3">
                          <div className="flex items-center gap-2 border border-neutral-300 rounded-md">
                            <button
                              onClick={() => {
                                const key = item.variantKey || `${item.id}-${item.size || 'default'}-${item.color || 'default'}`;
                                updateQuantity(key, item.quantity - 1);
                              }}
                              className="px-3 py-1 hover:bg-neutral-50"
                            >
                              −
                            </button>
                            <span className="px-2">{item.quantity}</span>
                            <button
                              onClick={() => {
                                const key = item.variantKey || `${item.id}-${item.size || 'default'}-${item.color || 'default'}`;
                                updateQuantity(key, item.quantity + 1);
                              }}
                              className="px-3 py-1 hover:bg-neutral-50"
                            >
                              +
                            </button>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const key = item.variantKey || `${item.id}-${item.size || 'default'}-${item.color || 'default'}`;
                              removeItem(key);
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            Remover
                          </Button>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-lg">
                          R$ {(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </CardBody>
                  </Card>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardBody>
                <H2 size="text-2xl">Resumo</H2>

                <div className="space-y-2 text-sm mt-4">
                  <div className="flex justify-between">
                    <Text className="text-sm">Subtotal</Text>
                    <span>R$ {totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <Text className="text-sm">Frete</Text>
                    {shippingOption ? (
                      <span>
                        {shippingOption.price === 0 ? (
                          <span className="text-green-600">Grátis</span>
                        ) : (
                          `R$ ${shippingOption.price.toFixed(2)}`
                        )}
                      </span>
                    ) : (
                      <span className="text-neutral-500 text-xs">Calcular</span>
                    )}
                  </div>
                </div>

                <div className="border-t border-neutral-200 my-4" />

                <ShippingCalculator
                  onShippingSelect={setShippingOption}
                  cartTotal={totalPrice}
                  onCepCalculated={handleShippingCepCalculated}
                />

                {/* Shipping Address Form - Only show after shipping is calculated */}
                {shippingOption && (
                  <>
                    <div className="border-t border-neutral-200 my-4" />

                    <div className="space-y-3">
                      <Text className="font-semibold text-sm">Endereço de Entrega</Text>

                      <input
                        type="text"
                        placeholder="Nome completo *"
                        value={shippingAddress.name}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      />

                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-1 relative">
                          <input
                            type="text"
                            placeholder="CEP *"
                            value={shippingAddress.zipCode}
                            onChange={(e) => handleCepChange(e.target.value)}
                            className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            maxLength={9}
                          />
                          {loadingCep && (
                            <span className="absolute right-2 top-2 text-xs text-neutral-500">
                              Buscando...
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          placeholder="Telefone *"
                          value={shippingAddress.phone}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                          className="col-span-2 px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        />
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        <input
                          type="text"
                          placeholder="Rua *"
                          value={shippingAddress.street}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                          className="col-span-3 px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        />
                        <input
                          type="text"
                          placeholder="Nº *"
                          value={shippingAddress.number}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, number: e.target.value })}
                          className="col-span-1 px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        />
                      </div>

                      <input
                        type="text"
                        placeholder="Complemento (opcional)"
                        value={shippingAddress.complement}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, complement: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      />

                      <input
                        type="text"
                        placeholder="Bairro *"
                        value={shippingAddress.neighborhood}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, neighborhood: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      />

                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Cidade *"
                          value={shippingAddress.city}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                          className="col-span-2 px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        />
                        <input
                          type="text"
                          placeholder="UF *"
                          value={shippingAddress.state}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                          className="col-span-1 px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                          maxLength={2}
                        />
                      </div>
                    </div>

                    <div className="border-t border-neutral-200 my-4" />

                    <div className="flex justify-between text-lg font-semibold mb-6">
                      <span>Total</span>
                      <span>R$ {(totalPrice + (shippingOption?.price || 0)).toFixed(2)}</span>
                    </div>

                    <Button
                      variant="primary"
                      className="w-full mb-3"
                      disabled={!shippingOption || !isAddressComplete() || processingOrder}
                      onClick={handleCheckout}
                    >
                      {processingOrder ? "Processando..." : "Finalizar compra"}
                    </Button>

                    {!isAddressComplete() && (
                      <Text className="text-xs text-red-600 text-center mb-2">
                        Preencha todos os campos obrigatórios (*)
                      </Text>
                    )}
                  </>
                )}

                <Button variant="outline" className="w-full" onClick={clearCart}>
                  Limpar carrinho
                </Button>
              </CardBody>
            </Card>
          </div>
        </div>
      </Container>

      {variantSelectorOpen && selectedProduct && (
        <VariantSelector
          availableSizes={selectedProduct.sizes}
          availableColors={selectedProduct.colors}
          onSelect={(size, color) => {
            addItem({
              id: selectedProduct.id,
              title: selectedProduct.title,
              price: selectedProduct.price,
              cover: selectedProduct.cover,
              size,
              color,
            });
            setVariantSelectorOpen(false);
          }}
          onCancel={() => setVariantSelectorOpen(false)}
        />
      )}
    </main>
  );
}
