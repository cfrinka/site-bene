"use client";

import { useState, useEffect } from "react";
import Container from "@/components/ui/Container";
import { H1, Text } from "@/components/ui/Typography";
import ProductsGrid from "@/components/data/ProductsGrid";
import { listCollection, isFirebaseEnabled } from "@/lib/firebase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
            <Input
              type="text"
              placeholder="Buscar por título..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Sort */}
          <div className="min-w-[180px]">
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Ordenar
            </label>
            <Select
              value={sortOrder || "default"}
              onValueChange={(value) => setSortOrder(value === "default" ? "" : value as "asc" | "desc" | "price-asc" | "price-desc")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Padrão" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Padrão</SelectItem>
                <SelectItem value="asc">Nome: A-Z</SelectItem>
                <SelectItem value="desc">Nome: Z-A</SelectItem>
                <SelectItem value="price-asc">Preço: Menor para Maior</SelectItem>
                <SelectItem value="price-desc">Preço: Maior para Menor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Collection filter */}
          <div className="min-w-[180px]">
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Coleção
            </label>
            <Select
              value={selectedCollection || "all"}
              onValueChange={(value) => setSelectedCollection(value === "all" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as coleções" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as coleções</SelectItem>
                {collections.map((col) => (
                  <SelectItem key={col.id} value={col.id}>
                    {col.title || "Coleção"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Clear filters */}
          {(searchTerm || sortOrder || selectedCollection) && (
            <div>
              <Button
                variant="link"
                onClick={() => {
                  setSearchTerm("");
                  setSortOrder("");
                  setSelectedCollection("");
                }}
              >
                Limpar filtros
              </Button>
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
