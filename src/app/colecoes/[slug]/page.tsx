"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Container from "@/components/ui/Container";
import { H1, Text } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { getFirebase, isFirebaseEnabled, listCollection, subscribeCollection } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import AuthModal from "@/components/ui/AuthModal";
import VariantSelector from "@/components/product/VariantSelector";

function picsum(seed: string, w: number, h: number) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;
}

type Collection = {
  id: string;
  title?: string;
  slug?: string;
  cover?: string;
  description?: string;
  productIds?: string[]; // Array of product IDs
};

type Product = {
  id: string;
  title?: string;
  price?: number;
  cover?: string;
  badge?: string;
  sizes?: string[];
  colors?: string[];
};

export default function CollectionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const enabled = isFirebaseEnabled();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);
  const { user } = useAuth();
  const { addItem } = useCart();
  const router = useRouter();

  useEffect(() => {
    let unsubCol: (() => void) | null = null;
    let unsubProd: (() => void) | null = null;
    let mounted = true;

    (async () => {
      try {
        if (!enabled) { setLoading(false); return; }
        const fb = await getFirebase();
        if (!fb) { setLoading(false); return; }

        // Subscribe to collections
        unsubCol = await subscribeCollection("collections", (items) => {
          if (!mounted) return;
          const cols = items as Collection[];
          const found = cols.find(c => c.slug === slug || c.id === slug);
          setCollection(found || null);
        });

        // Subscribe to products
        unsubProd = await subscribeCollection("products", (items) => {
          if (!mounted) return;
          setProducts(items as Product[]);
        });

        // Initial fetch
        const [colRes, prodRes] = await Promise.all([
          listCollection("collections"),
          listCollection("products")
        ]);

        if (mounted) {
          if ((colRes as any).ok && Array.isArray((colRes as any).items)) {
            const cols = (colRes as any).items as Collection[];
            const found = cols.find(c => c.slug === slug || c.id === slug);
            setCollection(found || null);
          }
          if ((prodRes as any).ok && Array.isArray((prodRes as any).items)) {
            setProducts((prodRes as any).items as Product[]);
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      if (unsubCol) unsubCol();
      if (unsubProd) unsubProd();
    };
  }, [enabled, slug]);

  const collectionProducts = products.filter(p =>
    collection?.productIds?.includes(p.id)
  );

  const handleAddToCart = (product: Product) => {
    if (!user) {
      setPendingProduct(product);
      setAuthModalOpen(true);
      return;
    }

    // Check if product has variants configured
    if (!product.sizes || product.sizes.length === 0 || !product.colors || product.colors.length === 0) {
      alert("Este produto ainda não tem tamanhos e cores configurados. Entre em contato com o administrador.");
      return;
    }

    // Open variant selector
    setPendingProduct(product);
    setVariantModalOpen(true);
  };

  const handleVariantSelect = (size: string, color: string) => {
    if (pendingProduct) {
      addItem({
        id: pendingProduct.id || "",
        title: pendingProduct.title,
        price: pendingProduct.price,
        cover: pendingProduct.cover,
        size,
        color,
      });
      setPendingProduct(null);
      setVariantModalOpen(false);
      router.push("/carrinho");
    }
  };

  const handleAuthSuccess = () => {
    if (pendingProduct) {
      // After auth, open variant selector
      setVariantModalOpen(true);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/10 via-transparent to-transparent" />
          <Container className="relative py-16">
            <div className="h-10 w-32 bg-neutral-200 animate-pulse rounded mb-4" />
            <div className="h-12 w-64 bg-neutral-200 animate-pulse rounded" />
            <div className="h-6 w-96 bg-neutral-200 animate-pulse rounded mt-3" />
          </Container>
        </section>
        <Container className="pb-20">
          <div className="h-8 w-48 bg-neutral-200 animate-pulse rounded mb-6" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </Container>
      </main>
    );
  }

  if (!collection) {
    return (
      <main className="min-h-screen">
        <Container className="py-20">
          <H1>Coleção não encontrada</H1>
          <Button href="/colecoes" className="mt-4">Voltar para coleções</Button>
        </Container>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/10 via-transparent to-transparent" />
        <Container className="relative py-16">
          <Button href="/colecoes" variant="outline" className="mb-4">Voltar</Button>
          <H1>{collection.title ?? "Coleção"}</H1>
          {collection.description && <Text className="mt-3 max-w-2xl">{collection.description}</Text>}
        </Container>
      </section>

      {collection.cover && (
        <Container className="pb-8">
          <div className="relative h-64 w-full rounded-lg overflow-hidden bg-neutral-100">
            <Image src={collection.cover} alt={collection.title ?? "Coleção"} fill className="object-cover" />
          </div>
        </Container>
      )}

      <Container className="pb-20">
        <h2 className="text-2xl font-display font-semibold mb-6">
          Produtos ({collectionProducts.length})
        </h2>
        {collectionProducts.length === 0 ? (
          <Text>Nenhum produto nesta coleção.</Text>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {collectionProducts.map((p) => (
              <Card key={p.id} className="overflow-hidden">
                <div className="relative h-56 bg-neutral-100">
                  {p.cover ? (
                    <Image
                      src={p.cover}
                      alt={p.title ?? "Produto"}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-neutral-400 text-sm">
                      Sem imagem
                    </div>
                  )}
                  {p.badge && (
                    <div className="absolute left-3 top-3">
                      <Badge className="bg-brand-accent text-white">{p.badge}</Badge>
                    </div>
                  )}
                </div>
                <CardBody>
                  <h3 className="font-display font-semibold">{p.title ?? "Produto"}</h3>
                  <p className="mt-1 text-sm text-neutral-600">Algodão premium • Unissex</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[#1f9d61] font-semibold">R$ {(p.price ?? 0).toFixed(2)}</span>
                    <Button size="sm" className="cursor-pointer" onClick={() => handleAddToCart(p)}>Adicionar</Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </Container>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {variantModalOpen && pendingProduct && (
        <VariantSelector
          availableSizes={pendingProduct.sizes || []}
          availableColors={pendingProduct.colors || []}
          onSelect={handleVariantSelect}
          onCancel={() => {
            setVariantModalOpen(false);
            setPendingProduct(null);
          }}
        />
      )}
    </main>
  );
}
