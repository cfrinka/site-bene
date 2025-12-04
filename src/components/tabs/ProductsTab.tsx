"use client";

import { useEffect, useState } from "react";
import { isFirebaseEnabled, subscribeCollection, listCollection, getFirebase, saveDocument, uploadFile } from "@/lib/firebase";
import { compressImage } from '@/lib/imageCompression';
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import ProductCard, { Product } from "@/components/cards/ProductCard";

export default function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const enabled = isFirebaseEnabled();
  const [inHighlights, setInHighlights] = useState<Set<string>>(new Set());
  const [collectionsCountByProduct, setCollectionsCountByProduct] = useState<Record<string, number>>({});
  const [collectionTitlesByProduct, setCollectionTitlesByProduct] = useState<Record<string, string[]>>({});
  const { show } = useToast();
  const [form, setForm] = useState({
    title: "",
    price: "",
    cover: "",
    sizes: [] as string[],
    colors: [] as string[],
    colorImages: {} as Record<string, string>
  });
  const [uploading, setUploading] = useState(false);

  const AVAILABLE_SIZES = ["P", "M", "G", "GG", "G1"];
  const AVAILABLE_COLORS = [
    { name: "Preto", value: "#000000" },
    { name: "Branco", value: "#FFFFFF" },
    { name: "Cinza", value: "#808080" },
    { name: "Azul", value: "#0000FF" },
    { name: "Vermelho", value: "#FF0000" },
    { name: "Verde", value: "#008000" },
    { name: "Amarelo", value: "#FFFF00" },
  ];

  useEffect(() => {
    let unsubProducts: (() => void) | null = null;
    let unsubHighlights: (() => void) | null = null;
    let unsubCollections: (() => void) | null = null;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const fb = await getFirebase();
        if (!fb) { setError("Firebase não inicializou."); setLoading(false); return; }
        // Live products
        unsubProducts = await subscribeCollection("products", (items) => { if (!mounted) return; setProducts(items as Product[]); setLoading(false); });
        // Fallback one-time products fetch
        const r = await listCollection("products");
        if (mounted && (r as any).ok && Array.isArray((r as any).items)) setProducts((r as any).items as Product[]);
        // Live highlights for badges
        unsubHighlights = await subscribeCollection("highlights", (items) => {
          if (!mounted) return;
          const set = new Set<string>();
          (items as any[]).forEach((h: any) => { if (h?.productId) set.add(h.productId as string); });
          setInHighlights(set);
        });
        // Live collections for badges
        unsubCollections = await subscribeCollection("collections", (items) => {
          if (!mounted) return;
          const counts: Record<string, number> = {};
          const titlesMap: Record<string, string[]> = {};
          (items as any[]).forEach((c: any) => {
            const ids: string[] = Array.isArray(c?.productIds) ? c.productIds : [];
            ids.forEach((pid: string) => {
              counts[pid] = (counts[pid] || 0) + 1;
              (titlesMap[pid] ||= []).push(String(c?.title || 'Coleção'));
            });
          });
          setCollectionsCountByProduct(counts);
          setCollectionTitlesByProduct(titlesMap);
        });
      } catch (e: any) {
        if (!mounted) return; setError(e?.message || "Erro ao carregar produtos");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
      if (unsubProducts) unsubProducts();
      if (unsubHighlights) unsubHighlights();
      if (unsubCollections) unsubCollections();
    };
  }, []);

  async function saveProduct() {
    if (!enabled) { show({ variant: 'warning', title: 'Firebase desativado' }); return; }
    if (form.sizes.length === 0) { show({ variant: 'warning', title: 'Selecione pelo menos um tamanho' }); return; }
    if (form.colors.length === 0) { show({ variant: 'warning', title: 'Selecione pelo menos uma cor' }); return; }

    const price = parseFloat(form.price.replace(',', '.')) || 0;
    await saveDocument('products', {
      title: form.title,
      price,
      cover: form.cover,
      sizes: form.sizes,
      colors: form.colors,
      colorImages: form.colorImages
    });
    show({ variant: 'success', title: 'Produto salvo' });
    setForm({ title: '', price: '', cover: '', sizes: [], colors: [], colorImages: {} });
  }

  const toggleSize = (size: string) => {
    setForm(f => ({
      ...f,
      sizes: f.sizes.includes(size)
        ? f.sizes.filter(s => s !== size)
        : [...f.sizes, size]
    }));
  };

  const toggleColor = (colorName: string) => {
    setForm(f => ({
      ...f,
      colors: f.colors.includes(colorName)
        ? f.colors.filter(c => c !== colorName)
        : [...f.colors, colorName]
    }));
  };

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const inputEl = e.currentTarget;
    const file = inputEl.files?.[0]; if (!file) { inputEl.value = ''; return; }
    if (!enabled) { show({ variant: 'warning', title: 'Firebase desativado' }); inputEl.value = ''; return; }
    try {
      setUploading(true);
      // Compress image to max 1MB
      const compressedFile = await compressImage(file, 1, 1920);
      const up = await uploadFile(`products/${Date.now()}-${file.name}`, compressedFile);
      if ((up as any).ok) {
        setForm((f) => ({ ...f, cover: (up as any).url }));
        show({ variant: 'success', title: 'Imagem enviada' });
      } else {
        show({ variant: 'error', title: 'Falha ao enviar' });
      }
    } finally {
      setUploading(false);
      // reset value to allow same file re-select
      if (inputEl) inputEl.value = '';
    }
  }

  async function handleColorImageUpload(colorName: string, e: React.ChangeEvent<HTMLInputElement>) {
    const inputEl = e.currentTarget;
    const file = inputEl.files?.[0]; if (!file) { inputEl.value = ''; return; }
    if (!enabled) { show({ variant: 'warning', title: 'Firebase desativado' }); inputEl.value = ''; return; }
    try {
      setUploading(true);
      // Compress image to max 1MB
      const compressedFile = await compressImage(file, 1, 1920);
      const up = await uploadFile(`products/${Date.now()}-${colorName}-${file.name}`, compressedFile);
      if ((up as any).ok) {
        setForm((f) => ({ ...f, colorImages: { ...f.colorImages, [colorName]: (up as any).url } }));
        show({ variant: 'success', title: `Imagem da cor ${colorName} enviada` });
      } else {
        show({ variant: 'error', title: 'Falha ao enviar' });
      }
    } finally {
      setUploading(false);
      if (inputEl) inputEl.value = '';
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-display font-semibold mb-4">Produtos</h1>
      {/* New product */}
      <Card className="mb-6">
        <CardBody>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Título" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
            <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Preço" inputMode="decimal" value={form.price} onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))} />
            <input className="rounded-md border border-neutral-300 px-3 py-2 sm:col-span-2" placeholder="Capa (URL)" value={form.cover} onChange={(e) => setForm(f => ({ ...f, cover: e.target.value }))} />
            <div className="sm:col-span-2 flex items-center gap-3">
              <label className="inline-flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 cursor-pointer hover:bg-neutral-50">
                <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                {uploading ? 'Enviando...' : 'Enviar imagem'}
              </label>
              {form.cover && <span className="text-xs text-neutral-600 truncate">{form.cover}</span>}
            </div>

            {/* Sizes */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Tamanhos disponíveis *
              </label>
              <div className="flex gap-2 flex-wrap">
                {AVAILABLE_SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggleSize(size)}
                    className={`px-4 py-2 rounded-md border transition-colors font-medium ${form.sizes.includes(size)
                      ? "border-[#2A5473] bg-[#2A5473] text-white"
                      : "border-neutral-300 hover:border-neutral-400 bg-white"
                      }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {form.sizes.length > 0 && (
                <p className="text-xs text-neutral-600 mt-1">
                  Selecionados: {form.sizes.join(", ")}
                </p>
              )}
            </div>

            {/* Colors */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Cores disponíveis *
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {AVAILABLE_COLORS.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => toggleColor(color.name)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-md border transition-colors bg-white ${form.colors.includes(color.name)
                      ? "border-[#2A5473] ring-2 ring-[#2A5473]/20"
                      : "border-neutral-200 hover:border-neutral-300"
                      }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full border-2 border-neutral-300"
                      style={{ backgroundColor: color.value }}
                    />
                    <span className="text-xs text-neutral-800">{color.name}</span>
                  </button>
                ))}
              </div>
              {form.colors.length > 0 && (
                <p className="text-xs text-neutral-600 mt-1">
                  Selecionadas: {form.colors.join(", ")}
                </p>
              )}
            </div>

            {/* Color-specific images */}
            {form.colors.length > 0 && (
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Imagens por cor (opcional)
                </label>
                <p className="text-xs text-neutral-500 mb-3">
                  Envie uma imagem para cada cor. Se não enviar, será usada a imagem de capa.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {form.colors.map((colorName) => {
                    const colorDef = AVAILABLE_COLORS.find(c => c.name === colorName);
                    return (
                      <div key={colorName} className="border border-neutral-200 rounded-md p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-5 h-5 rounded-full border-2 border-neutral-300"
                            style={{ backgroundColor: colorDef?.value }}
                          />
                          <span className="text-sm font-medium">{colorName}</span>
                        </div>
                        <label className="inline-flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-1.5 cursor-pointer hover:bg-neutral-50 text-sm">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleColorImageUpload(colorName, e)}
                            disabled={uploading}
                          />
                          {form.colorImages[colorName] ? '✓ Enviada' : 'Enviar imagem'}
                        </label>
                        {form.colorImages[colorName] && (
                          <p className="text-xs text-neutral-500 mt-1 truncate">
                            {form.colorImages[colorName].split('/').pop()}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="sm:col-span-2">
              <Button onClick={saveProduct} disabled={!form.title || form.sizes.length === 0 || form.colors.length === 0}>
                Salvar produto
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
      {!enabled && <div className="text-sm text-neutral-600">Firebase desativado.</div>}
      {enabled && loading && <div className="text-sm text-neutral-600">Carregando produtos...</div>}
      {enabled && !!error && <div className="text-sm text-red-600">{error}</div>}
      {enabled && !loading && !error && products.length === 0 && (
        <div className="text-sm text-neutral-600">Nenhum produto encontrado.</div>
      )}
      {products.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              inHighlights={inHighlights.has(p.id)}
              collectionsCount={collectionsCountByProduct[p.id] || 0}
              collectionNames={collectionTitlesByProduct[p.id] || []}
            />
          ))}
        </div>
      )}
    </div>
  );
}
