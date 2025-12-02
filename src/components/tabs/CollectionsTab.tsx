"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { isFirebaseEnabled, getFirebase, subscribeCollection, listCollection, saveDocument, uploadFile, existsByField, updateDocument, deleteDocument } from "@/lib/firebase";

type Product = { id: string; title?: string; price?: number; cover?: string };
type Collection = { id?: string; title?: string; slug?: string; description?: string; cover?: string; productIds?: string[] };

export default function CollectionsTab() {
  const enabled = isFirebaseEnabled();
  const { show } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<Collection>({ title: "", slug: "", description: "", cover: "", productIds: [] });
  const [uploading, setUploading] = useState(false);
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [editingProductsId, setEditingProductsId] = useState<string | null>(null);
  const [tempIds, setTempIds] = useState<string[]>([]);
  const [showPicker, setShowPicker] = useState<boolean>(false);

  useEffect(() => {
    let unC: (() => void) | null = null;
    let unP: (() => void) | null = null;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const fb = await getFirebase();
        if (!fb) { setError("Firebase não inicializou."); setLoading(false); return; }
        unC = await subscribeCollection("collections", (items) => { if (!mounted) return; setCollections(items as Collection[]); setLoading(false); });
        unP = await subscribeCollection("products", (items) => { if (!mounted) return; setProducts(items as Product[]); });
        const [rc, rp] = await Promise.all([listCollection("collections"), listCollection("products")]);
        if (mounted) {
          if ((rc as any).ok && Array.isArray((rc as any).items)) setCollections((rc as any).items as Collection[]);
          if ((rp as any).ok && Array.isArray((rp as any).items)) setProducts((rp as any).items as Product[]);
        }
      } catch (e: any) {
        if (!mounted) return; setError(e?.message || "Erro ao carregar coleções");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; if (unC) unC(); if (unP) unP(); };
  }, []);

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const inputEl = e.currentTarget;
    const file = inputEl.files?.[0];
    if (!file) { inputEl.value = ''; return; }
    if (!enabled) { show({ variant: 'warning', title: 'Firebase desativado' }); inputEl.value = ''; return; }
    try {
      setUploading(true);
      const up = await uploadFile(`collections/covers/${Date.now()}-${file.name}`, file);
      if ((up as any).ok) { setForm(f => ({ ...f, cover: (up as any).url })); show({ variant: 'success', title: 'Capa enviada' }); }
      else { show({ variant: 'error', title: 'Falha ao enviar' }); }
    } finally {
      setUploading(false);
      if (inputEl) inputEl.value = '';
    }
  }

  async function saveCollectionForm() {
    if (!enabled) { show({ variant: 'warning', title: 'Firebase desativado' }); return; }
    if (!form.title) { show({ variant: 'warning', title: 'Título obrigatório' }); return; }
    if (!form.slug) { show({ variant: 'warning', title: 'Slug obrigatório' }); return; }

    if (editingCollectionId) {
      // Update existing collection
      const existing = collections.find(c => String(c.id) === editingCollectionId);
      if (existing && existing.slug !== form.slug) {
        // Check if new slug already exists
        const chk = await existsByField('collections', 'slug', form.slug);
        if ((chk as any).ok && (chk as any).exists) { show({ variant: 'error', title: 'Slug já existe' }); return; }
      }
      await updateDocument('collections', editingCollectionId, { title: form.title, slug: form.slug, description: form.description, cover: form.cover });
      show({ variant: 'success', title: 'Coleção atualizada' });
      setEditingCollectionId(null);
    } else {
      // Create new collection
      const chk = await existsByField('collections', 'slug', form.slug);
      if ((chk as any).ok && (chk as any).exists) { show({ variant: 'error', title: 'Slug já existe' }); return; }
      await saveDocument('collections', { ...form });
      show({ variant: 'success', title: 'Coleção criada' });
    }
    setForm({ title: '', slug: '', description: '', cover: '', productIds: [] });
  }

  function startEditCollection(c: Collection) {
    setEditingCollectionId(String(c.id));
    setForm({ title: c.title || '', slug: c.slug || '', description: c.description || '', cover: c.cover || '', productIds: c.productIds || [] });
  }

  function cancelEditCollection() {
    setEditingCollectionId(null);
    setForm({ title: '', slug: '', description: '', cover: '', productIds: [] });
  }

  function openEditProducts(c: Collection) {
    setEditingProductsId(String(c.id));
    setTempIds(Array.isArray(c.productIds) ? [...c.productIds] : []);
    setShowPicker(false);
  }

  async function saveEditProducts() {
    if (!enabled || !editingProductsId) return;
    await updateDocument('collections', editingProductsId, { productIds: tempIds });
    show({ variant: 'success', title: 'Produtos atualizados' });
    setEditingProductsId(null);
    setTempIds([]);
  }

  async function removeCollection(id?: string) {
    if (!enabled || !id) return;
    await deleteDocument('collections', id);
    show({ variant: 'success', title: 'Coleção removida' });
  }

  return (
    <div>
      <h1 className="text-2xl font-display font-semibold mb-4">Coleções</h1>

      {/* Create/Edit collection */}
      <Card className="mb-6">
        <CardBody>
          <h2 className="text-lg font-semibold mb-3">{editingCollectionId ? 'Editar coleção' : 'Nova coleção'}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Título" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
            <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Slug" value={form.slug} onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))} />
            <textarea className="rounded-md border border-neutral-300 px-3 py-2 sm:col-span-2" placeholder="Descrição" rows={3} value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
            <input className="rounded-md border border-neutral-300 px-3 py-2 sm:col-span-2" placeholder="Capa (URL)" value={form.cover} onChange={(e) => setForm(f => ({ ...f, cover: e.target.value }))} />
            <div className="sm:col-span-2 flex items-center gap-3">
              <label className="inline-flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 cursor-pointer hover:bg-neutral-50">
                <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                {uploading ? 'Enviando...' : 'Enviar capa'}
              </label>
              {form.cover && <span className="text-xs text-neutral-600 truncate">{form.cover}</span>}
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <Button onClick={saveCollectionForm} disabled={!form.slug || !form.title}>{editingCollectionId ? 'Atualizar' : 'Criar'}</Button>
              {editingCollectionId && <Button variant="outline" onClick={cancelEditCollection}>Cancelar</Button>}
            </div>
          </div>
        </CardBody>
      </Card>

      {!enabled && <div className="text-sm text-neutral-600">Firebase desativado.</div>}
      {enabled && loading && <div className="text-sm text-neutral-600">Carregando coleções...</div>}
      {enabled && !!error && <div className="text-sm text-red-600">{error}</div>}

      {/* List collections */}
      <div className="grid gap-3">
        {collections.map((c) => (
          <div key={String(c.id)} className="rounded-md border border-neutral-200 p-3 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative h-12 w-12 rounded-md overflow-hidden bg-neutral-100 flex-shrink-0">
                {c.cover ? (
                  <Image src={c.cover} alt={c.title || 'Coleção'} fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-neutral-500">Sem capa</div>
                )}
              </div>
              <div className="min-w-0">
                <div className="font-medium truncate">{c.title || 'Coleção'}</div>
                {Array.isArray(c.productIds) && c.productIds.length > 0 && (
                  <div className="text-xs text-neutral-600 truncate">{c.productIds.length} produto(s)</div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => startEditCollection(c)}>Editar</Button>
              <Button size="sm" variant="outline" onClick={() => openEditProducts(c)}>Produtos</Button>
              <Button size="sm" variant="danger" onClick={() => removeCollection(String(c.id))}>Remover</Button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit products selection */}
      {editingProductsId && (
        <div className="mt-6 rounded-md border border-neutral-200 p-4">
          <div className="text-sm font-medium mb-2">Editar produtos da coleção: <span className="font-semibold">{(collections.find(c => String(c.id) === editingProductsId)?.title) || 'Coleção'}</span></div>

          {/* Selected products list */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tempIds.length === 0 && (
              <div className="text-sm text-neutral-600">Nenhum produto nesta coleção.</div>
            )}
            {tempIds.map(pid => {
              const p = products.find(pp => pp.id === pid);
              if (!p) return null;
              return (
                <div key={p.id} className="relative rounded-lg border border-neutral-200 overflow-hidden">
                  <div className="relative h-24 bg-neutral-100">
                    {p.cover ? (
                      <Image src={p.cover} alt={p.title || 'Produto'} fill className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-xs text-neutral-500">Sem imagem</div>
                    )}
                  </div>
                  <div className="p-2">
                    <div className="text-sm font-medium line-clamp-1">{p.title || 'Produto'}</div>
                    <div className="text-xs text-neutral-600">R$ {(p.price ?? 0).toFixed(2)}</div>
                  </div>
                  <div className="absolute right-2 top-2">
                    <button
                      type="button"
                      onClick={() => setTempIds(ids => ids.filter(id => id !== p.id))}
                      className="rounded-md bg-white/95 border border-neutral-200 px-2 py-1 text-xs hover:bg-white shadow-sm"
                      aria-label="Remover da coleção"
                    >Remover</button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add more button */}
          <div className="mt-3">
            <Button variant="outline" onClick={() => setShowPicker(v => !v)}>{showPicker ? 'Fechar seleção' : 'Adicionar mais'}</Button>
          </div>

          {/* Picker for unselected products */}
          {showPicker && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-h-80 overflow-auto pr-1">
              {products.filter(p => !tempIds.includes(p.id)).map((p) => (
                <button key={p.id} type="button" onClick={() => setTempIds(ids => [...ids, p.id])} className="group text-left rounded-lg border border-neutral-200 overflow-hidden">
                  <div className="relative h-24 bg-neutral-100">
                    {p.cover ? (
                      <Image src={p.cover} alt={p.title || 'Produto'} fill className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-xs text-neutral-500">Sem imagem</div>
                    )}
                  </div>
                  <div className="p-2">
                    <div className="text-sm font-medium line-clamp-1">{p.title || 'Produto'}</div>
                    <div className="text-xs text-neutral-600">R$ {(p.price ?? 0).toFixed(2)}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="mt-3 flex gap-2">
            <Button onClick={saveEditProducts}>Salvar</Button>
            <Button variant="outline" onClick={() => { setEditingProductsId(null); setTempIds([]); setShowPicker(false); }}>Cancelar</Button>
          </div>
        </div>
      )}
    </div>
  );
}
