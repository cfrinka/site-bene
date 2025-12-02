"use client";

import { useState, useEffect } from "react";
import Container from "@/components/ui/Container";
import { H1, Text } from "@/components/ui/Typography";
import ProductsGrid from "@/components/data/ProductsGrid";
import { listCollection, isFirebaseEnabled } from "@/lib/firebase";

type Collection = { id: string; title?: string; slug?: string };

export default function ProdutosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | "price-asc" | "price-desc" | "">("");
  const [selectedCollection, setSelectedCollection] = useState<string>("");
  const [collections, setCollections] = useState<Collection[]>([]);
  const enabled = isFirebaseEnabled();

  useEffect(() => {
    (async () => {
      if (enabled) {
        const res = await listCollection("collections");
        if (res.ok) setCollections(res.items as Collection[]);
      }
    })();
  }, [enabled]);

  return (
    <main className="min-h-screen">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/10 via-transparent to-transparent" />
        <Container className="relative py-16">
          <H1>Todos os produtos</H1>
          <Text className="mt-3 max-w-2xl">Explore todas as peças que a Benê criou com muito carinho para você!</Text>
        </Container>
      </section>

      <Container className="pb-20">
        {/* Filters */}
        <div className="mb-8 flex flex-wrap items-end gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[240px]">
            <input
              type="text"
              placeholder="Buscar por título..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-neutral-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
            />
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Ordenar
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc" | "price-asc" | "price-desc" | "")}
              className="rounded-md border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
            >
              <option value="">Padrão</option>
              <option value="asc">Nome: A-Z</option>
              <option value="desc">Nome: Z-A</option>
              <option value="price-asc">Preço: Menor para Maior</option>
              <option value="price-desc">Preço: Maior para Menor</option>
            </select>
          </div>

          {/* Collection filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Coleção
            </label>
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="rounded-md border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
            >
              <option value="">Todas as coleções</option>
              {collections.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.title || "Coleção"}
                </option>
              ))}
            </select>
          </div>

          {/* Clear filters */}
          {(searchTerm || sortOrder || selectedCollection) && (
            <div>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSortOrder("");
                  setSelectedCollection("");
                }}
                className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 underline"
              >
                Limpar filtros
              </button>
            </div>
          )}
        </div>

        <ProductsGrid
          searchTerm={searchTerm}
          sortOrder={sortOrder}
          collectionId={selectedCollection}
        />
      </Container>
    </main>
  );
}
