"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Container from "@/components/ui/Container";
import { H1, H2, Text } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { uploadFile, updateUserProfilePicture, getUserData, subscribeUserOrders } from "@/lib/firebase";
import { compressImage } from "@/lib/imageCompression";
import Image from "next/image";

export default function PerfilPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  // Subscribe to real-time order updates
  useEffect(() => {
    if (!user) return;

    let unsubscribe: (() => void) | null = null;

    setLoadingOrders(true);
    subscribeUserOrders(user.uid, (orders) => {
      setOrders(orders);
      setLoadingOrders(false);
    }).then((unsub) => {
      unsubscribe = unsub;
    }).catch((error) => {
      setLoadingOrders(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      const userData = await getUserData(user.uid);
      if ((userData as any).ok && (userData as any).data.photoURL) {
        setProfilePicture((userData as any).data.photoURL);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setUploading(true);

      // Compress image to max 1MB
      const compressedFile = await compressImage(file, 1, 1920);

      const result = await uploadFile(`users/${user.uid}/profile-${Date.now()}.jpg`, compressedFile);

      if ((result as any).ok) {
        const photoURL = (result as any).url;

        // Save profile picture URL to Firestore
        await updateUserProfilePicture(user.uid, photoURL);

        setProfilePicture(photoURL);
        alert("Foto de perfil atualizada!");
      } else {
        alert("Erro ao enviar foto");
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      alert("Erro ao enviar foto");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  if (authLoading) {
    return (
      <main className="min-h-screen">
        <Container className="py-20">
          <div className="text-center">
            <Text>Carregando...</Text>
          </div>
        </Container>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen">
      <Container className="py-20">
        <H1>Meu Perfil</H1>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Profile Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardBody>
                <div className="text-center">
                  {/* Profile Picture */}
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    {profilePicture ? (
                      <Image
                        src={profilePicture}
                        alt="Foto de perfil"
                        fill
                        className="object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-neutral-200 flex items-center justify-center text-4xl font-semibold text-neutral-600">
                        {(user.name?.[0] || user.email?.[0])?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>

                  {/* Upload Button */}
                  <label className="inline-block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                    <span className="cursor-pointer text-sm text-brand-primary hover:underline">
                      {uploading ? "Enviando..." : "Alterar foto"}
                    </span>
                  </label>

                  {/* User Info */}
                  <div className="mt-6 space-y-2">
                    <H2 size="text-xl">{user.name || user.displayName || "Usuário"}</H2>
                    <Text className="text-sm text-neutral-600">{user.email}</Text>
                    {user.role && (
                      <span className="inline-block px-2 py-1 text-xs bg-neutral-100 rounded">
                        {user.role === "admin" ? "Administrador" : "Usuário"}
                      </span>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Purchase History */}
          <div className="lg:col-span-2">
            <Card>
              <CardBody>
                <H2 size="text-xl" className="mb-4">Histórico de Compras</H2>

                {loadingOrders ? (
                  <div className="text-center py-8">
                    <Text>Carregando pedidos...</Text>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Text className="text-neutral-600 mb-4">Você ainda não fez nenhuma compra</Text>
                    <Button href="/produtos" variant="primary">
                      Ver produtos
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <Card key={order.id} className="border border-neutral-200">
                        <CardBody className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <Text className="font-semibold">Pedido #{order.orderNumber || order.id}</Text>
                              <Text className="text-sm text-neutral-600">
                                {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                              </Text>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded ${order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                                  order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                    order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-neutral-100 text-neutral-800'
                              }`}>
                              {order.status === 'delivered' ? 'Entregue' :
                                order.status === 'shipped' ? 'Enviado' :
                                  order.status === 'processing' ? 'Em processamento' :
                                    order.status === 'cancelled' ? 'Cancelado' :
                                      order.status === 'pending' ? 'Pendente' :
                                        order.status || 'Pendente'}
                            </span>
                          </div>
                          <div className="space-y-1">
                            {order.items?.map((item: any, idx: number) => (
                              <Text key={idx} className="text-sm">
                                {item.quantity}x {item.title} - R$ {item.price.toFixed(2)}
                              </Text>
                            ))}
                          </div>
                          <div className="mt-2 pt-2 border-t border-neutral-200">
                            <Text className="font-semibold">
                              Total: R$ {order.total.toFixed(2)}
                            </Text>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </Container>
    </main>
  );
}
