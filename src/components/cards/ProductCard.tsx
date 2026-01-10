"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Card, CardBody, CardMedia } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { isFirebaseEnabled, saveDocument, updateDocument, deleteDocument, listCollection } from "@/lib/firebase";
import EditProductModal from "@/components/modals/EditProductModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Star, Trash2, FolderPlus } from "lucide-react";

export type Product = { id: string; title?: string; price?: number; cover?: string; sizes?: string[]; colors?: string[]; colorImages?: Record<string, string> };

type Collection = { id: string; title?: string; productIds?: string[] };

export default function ProductCard({ product, inHighlights = false, collectionsCount = 0, collectionNames = [] }: { product: Product; inHighlights?: boolean; collectionsCount?: number; collectionNames?: string[] }) {
  const p = product || ({} as Product);
  const enabled = isFirebaseEnabled();
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
  }

  async function addToCollection(collectionId: string) {
    if (!enabled) return;
    const col = collections.find((c) => c.id === collectionId);
    const ids = Array.isArray(col?.productIds) ? [...(col!.productIds as string[])] : [];
    if (!ids.includes(p.id)) ids.push(p.id);
    await updateDocument("collections", collectionId, { productIds: ids });
  }

  async function removeProduct() {
    if (!enabled) return;
    await deleteDocument("products", p.id);
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <MoreHorizontal className="h-4 w-4 mr-1" />
                Ações
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={() => setEditModalOpen(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar produto
              </DropdownMenuItem>
              <DropdownMenuItem onClick={addToHighlights}>
                <Star className="h-4 w-4 mr-2" />
                Adicionar aos destaques
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                <FolderPlus className="h-3 w-3 mr-1 inline" />
                Adicionar à coleção
              </DropdownMenuLabel>
              {collections.length === 0 ? (
                <DropdownMenuItem disabled>Nenhuma coleção</DropdownMenuItem>
              ) : (
                collections.map((c) => (
                  <DropdownMenuItem key={c.id} onClick={() => addToCollection(c.id)}>
                    {c.title || "Coleção"}
                  </DropdownMenuItem>
                ))
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={removeProduct} className="text-destructive focus:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir produto
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex flex-wrap items-center gap-1">
            {inHighlights && <Badge className="bg-brand-primary text-white">Destaque</Badge>}
            {collectionNames.map((name, idx) => (
              <Badge key={`${p.id}-col-${idx}`} variant="secondary">{name}</Badge>
            ))}
          </div>
        </div>
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
