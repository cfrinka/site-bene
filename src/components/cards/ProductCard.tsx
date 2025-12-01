"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Card, CardBody, CardMedia } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { isFirebaseEnabled, saveDocument, updateDocument, deleteDocument, listCollection } from "@/lib/firebase";
import EditProductModal from "@/components/modals/EditProductModal";

export type Product = { id: string; title?: string; price?: number; cover?: string; sizes?: string[]; colors?: string[]; colorImages?: Record<string, string> };

type Collection = { id: string; title?: string; productIds?: string[] };

export default function ProductCard({ product, inHighlights = false, collectionsCount = 0, collectionNames = [] }: { product: Product; inHighlights?: boolean; collectionsCount?: number; collectionNames?: string[] }) {
  const p = product || ({} as Product);
  const enabled = isFirebaseEnabled();
  const [open, setOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
    (async () => {
      const r = await listCollection("collections");
      if ((r as any).ok && Array.isArray((r as any).items)) setCollections((r as any).items as Collection[]);
    })();
  }, []);

  async function addToHighlights() {
    if (!enabled) return;
    await saveDocument("highlights", { productId: p.id, title: p.title || "", subtitle: "", cover: p.cover || "" });
    setOpen(false);
  }

  async function addToCollection(collectionId: string) {
    if (!enabled) return;
    const col = collections.find((c) => c.id === collectionId);
    const ids = Array.isArray(col?.productIds) ? [...(col!.productIds as string[])] : [];
    if (!ids.includes(p.id)) ids.push(p.id);
    await updateDocument("collections", collectionId, { productIds: ids });
    setOpen(false);
  }

  async function removeProduct() {
    if (!enabled) return;
    await deleteDocument("products", p.id);
    setOpen(false);
  }

  return (
    <Card className="overflow-hidden relative">
      <CardMedia className="h-48 bg-neutral-100">
        {p.cover ? (
          <Image src={p.cover} alt={p.title || "Produto"} fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-neutral-500">Sem imagem</div>
        )}
      </CardMedia>
      <CardBody>
        <div className="font-medium truncate">{p.title || "Produto"}</div>
        <div className="text-sm text-neutral-600">R$ {(p.price ?? 0).toFixed(2)}</div>

        {/* Variants info */}
        {(p.sizes && p.sizes.length > 0) || (p.colors && p.colors.length > 0) ? (
          <div className="mt-2 flex flex-wrap gap-1 text-xs">
            {p.sizes && p.sizes.length > 0 && (
              <span className="bg-neutral-100 px-2 py-0.5 rounded">
                {p.sizes.join(", ")}
              </span>
            )}
            {p.colors && p.colors.length > 0 && (
              <span className="bg-neutral-100 px-2 py-0.5 rounded">
                {p.colors.join(", ")}
              </span>
            )}
          </div>
        ) : (
          <div className="mt-2 text-xs text-amber-600">
            ⚠️ Sem variantes configuradas
          </div>
        )}

        <div className="mt-3 flex items-center justify-between gap-2">
          <Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>Ações</Button>
          <div className="flex flex-wrap items-center gap-2">
            {inHighlights && <Badge className="bg-brand-primary text-white">Destaque</Badge>}
            {collectionNames.map((name, idx) => (
              <Badge key={`${p.id}-col-${idx}`} className="bg-neutral-900/80 text-white">{name}</Badge>
            ))}
          </div>
        </div>
        {open && (
          <div className="mt-3 rounded-md border border-neutral-200 text-sm">
            <button
              className="w-full text-left px-3 py-2 hover:bg-neutral-50"
              onClick={() => {
                setEditModalOpen(true);
                setOpen(false);
              }}
            >
              Editar tamanhos e cores
            </button>
            <div className="border-t" />
            <button className="w-full text-left px-3 py-2 hover:bg-neutral-50" onClick={addToHighlights}>Adicionar aos destaques</button>
            <div className="border-t" />
            <div className="px-3 py-2 text-xs text-neutral-600">Adicionar à coleção</div>
            <div className="max-h-40 overflow-auto">
              {collections.length === 0 && (
                <div className="px-3 py-2 text-neutral-500">Nenhuma coleção</div>
              )}
              {collections.map((c) => (
                <button key={c.id} className="w-full text-left px-3 py-2 hover:bg-neutral-50" onClick={() => addToCollection(c.id)}>
                  {c.title || "Coleção"}
                </button>
              ))}
            </div>
            <div className="border-t" />
            <button className="w-full text-left px-3 py-2 text-[#BE1622] hover:bg-neutral-50" onClick={removeProduct}>Excluir produto</button>
          </div>
        )}
      </CardBody>

      {editModalOpen && (
        <EditProductModal
          product={p}
          onClose={() => setEditModalOpen(false)}
          onSave={() => {
            // Modal will close itself after save
          }}
        />
      )}
    </Card>
  );
}
