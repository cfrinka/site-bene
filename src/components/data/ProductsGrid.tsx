"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { listCollection, isFirebaseEnabled } from "@/lib/firebase";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import AuthModal from "@/components/ui/AuthModal";
import VariantSelector from "@/components/product/VariantSelector";

function picsum(seed: string, w: number, h: number) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;
}

type Product = {
  id?: string;
  title?: string;
  price?: number;
  cover?: string;
  badge?: string;
  sizes?: string[];
  colors?: string[];
  colorImages?: Record<string, string>;
};

const ALL_COLORS = [
  { name: "Preto", value: "#000000" },
  { name: "Branco", value: "#FFFFFF" },
  { name: "Cinza", value: "#808080" },
  { name: "Azul", value: "#0000FF" },
  { name: "Vermelho", value: "#FF0000" },
  { name: "Verde", value: "#008000" },
  { name: "Amarelo", value: "#FFFF00" },
];

type Collection = { id: string; productIds?: string[] };

export default function ProductsGrid({
  limit,
  cols = "sm:grid-cols-2 lg:grid-cols-3",
  searchTerm = "",
  sortOrder = "",
  collectionId = ""
}: {
  limit?: number;
  cols?: string;
  searchTerm?: string;
  sortOrder?: "asc" | "desc" | "price-asc" | "price-desc" | "";
  collectionId?: string;
}) {
  const [items, setItems] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);
  const [hoveredColors, setHoveredColors] = useState<Record<string, string>>({});
  const enabled = isFirebaseEnabled();
  const { user } = useAuth();
  const { addItem } = useCart();
  const router = useRouter();

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        if (enabled) {
          const [productsRes, collectionsRes] = await Promise.all([
            listCollection("products"),
            listCollection("collections")
          ]);
          if (!cancel) {
            if (productsRes.ok) setItems(productsRes.items as any);
            if (collectionsRes.ok) setCollections(collectionsRes.items as Collection[]);
          }
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [enabled]);

  // Apply filters
  let filteredItems = [...items];

  // Filter by search term
  if (searchTerm) {
    const search = searchTerm.toLowerCase();
    filteredItems = filteredItems.filter(item =>
      item.title?.toLowerCase().includes(search)
    );
  }

  // Filter by collection
  if (collectionId) {
    const collection = collections.find(c => c.id === collectionId);
    if (collection && collection.productIds) {
      filteredItems = filteredItems.filter(item =>
        collection.productIds!.includes(item.id || "")
      );
    }
  }

  // Sort
  if (sortOrder === "asc") {
    // Alphabetically A-Z
    filteredItems.sort((a, b) =>
      (a.title || "").localeCompare(b.title || "")
    );
  } else if (sortOrder === "desc") {
    // Alphabetically Z-A
    filteredItems.sort((a, b) =>
      (b.title || "").localeCompare(a.title || "")
    );
  } else if (sortOrder === "price-asc") {
    // Price: Lowest to Highest
    filteredItems.sort((a, b) =>
      (a.price || 0) - (b.price || 0)
    );
  } else if (sortOrder === "price-desc") {
    // Price: Highest to Lowest
    filteredItems.sort((a, b) =>
      (b.price || 0) - (a.price || 0)
    );
  }

  // Apply limit if specified
  const data = limit ? filteredItems.slice(0, limit) : filteredItems;

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
      <div className={`grid gap-6 ${cols}`}>
        {Array.from({ length: limit || 6 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-600">Nenhum produto encontrado.</p>
      </div>
    );
  }

  return (
    <div className={`grid gap-6 ${cols}`}>
      {data.map((p: Product, i) => {
        const productId = p.id ?? `prod-${i}`;
        const hoveredColor = hoveredColors[productId];
        const displayImage = hoveredColor && p.colorImages?.[hoveredColor]
          ? p.colorImages[hoveredColor]
          : p.cover ?? picsum(`prod-${i}`, 800, 800);

        // Get available colors with their hex values
        const availableColors = p.colors
          ? ALL_COLORS.filter(c => p.colors!.includes(c.name))
          : [];

        return (
          <Card key={productId} className="overflow-hidden">
            <div className="relative h-56 bg-neutral-100">
              <Image
                src={displayImage}
                alt={p.title ?? "Produto"}
                fill
                className="object-cover transition-opacity duration-300"
              />
              {p.badge && (
                <div className="absolute left-3 top-3">
                  <Badge className="bg-brand-accent text-white">{p.badge}</Badge>
                </div>
              )}
            </div>
            <CardBody>
              <h3 className="font-display font-semibold text-xl tracking-wide">{p.title ?? "Produto"}</h3>
              <p className="mt-1 text-sm text-neutral-600">Algodão premium • Unissex</p>

              {/* Color swatches */}
              {availableColors.length > 0 && (
                <div className="mt-2 flex gap-2 items-center">
                  <span className="text-xs text-neutral-500">Cores:</span>
                  <div className="flex gap-1.5">
                    {availableColors.map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        onMouseEnter={() => setHoveredColors(prev => ({ ...prev, [productId]: color.name }))}
                        onMouseLeave={() => setHoveredColors(prev => ({ ...prev, [productId]: "" }))}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${hoveredColor === color.name
                          ? "border-neutral-800 scale-110"
                          : "border-neutral-300 hover:border-neutral-500"
                          }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                        aria-label={color.name}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-3 flex items-center justify-between">
                <span className="text-[#1f9d61] font-semibold">R$ {(p.price ?? 0).toFixed(2)}</span>
                <Button size="sm" onClick={() => handleAddToCart(p)}>Adicionar</Button>
              </div>
            </CardBody>
          </Card>
        );
      })}

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
    </div>
  );
}
