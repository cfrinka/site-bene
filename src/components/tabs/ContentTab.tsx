"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import Image from "next/image";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { isFirebaseEnabled, getFirebase, subscribeCollection, listCollection, saveDocument, updateDocument, uploadFile } from "@/lib/firebase";
import { compressImage } from "@/lib/imageCompression";

type PageKey = "home" | "criadores" | "sobre";

type ContentDoc = {
  id?: string;
  page: PageKey;
  title?: string;
  subtitle?: string;
  body?: string;
  heroImage?: string;
  ctaLabel?: string;
  ctaHref?: string;
  // Home sections
  carouselItems?: { image: string; href?: string }[];
  featuredBlocks?: { title: string; description?: string; href?: string; image?: string }[];
  // Criadores sections
  featuredCreators?: { name: string; role?: string; image?: string; href?: string }[];
};

const PAGES: { key: PageKey; label: string }[] = [
  { key: "home", label: "Home" },
  { key: "criadores", label: "Criadores" },
  { key: "sobre", label: "Sobre" },
];

export type ContentTabHandle = { save: () => Promise<void> };

const ContentTab = forwardRef<ContentTabHandle, {}>(function ContentTab(_props, ref) {
  const enabled = isFirebaseEnabled();
  const { show } = useToast();

  const [active, setActive] = useState<PageKey>("home");
  const [content, setContent] = useState<Record<PageKey, ContentDoc>>({
    home: { page: "home" },
    criadores: { page: "criadores" },
    sobre: { page: "sobre" },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [newCreator, setNewCreator] = useState<{ name: string; subtitle: string; bio: string; avatar: string }>({ name: '', subtitle: '', bio: '', avatar: '' });

  useEffect(() => {
    let unsub: (() => void) | null = null;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const fb = await getFirebase();
        if (!fb) { setError("Firebase não inicializou."); setLoading(false); return; }
        unsub = await subscribeCollection("content", (items) => {
          if (!mounted) return;
          const docs = (items as ContentDoc[]);
          setContent((prev) => {
            const next = { ...prev } as Record<PageKey, ContentDoc>;
            docs.forEach((d) => {
              if (!d?.page) return;
              next[d.page as PageKey] = d;
            });
            return next;
          });
          setLoading(false);
        });
        const r = await listCollection("content");
        if (mounted && (r as any).ok && Array.isArray((r as any).items)) {
          const docs = (r as any).items as ContentDoc[];
          setContent((prev) => {
            const next = { ...prev } as Record<PageKey, ContentDoc>;
            docs.forEach((d) => {
              if (!d?.page) return;
              next[d.page as PageKey] = d;
            });
            return next;
          });
        }
      } catch (e: any) {
        if (!mounted) return; setError(e?.message || "Erro ao carregar conteúdo");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; if (unsub) unsub(); };
  }, []);

  // Removed creators dropdown selector; keeping manual fields only.

  const current = useMemo(() => content[active] || { page: active }, [content, active]);

  function setField<K extends keyof ContentDoc>(key: K, value: ContentDoc[K]) {
    setContent((prev) => ({ ...prev, [active]: { ...(prev[active] || { page: active }), [key]: value } }));
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const inputEl = e.currentTarget;
    const file = inputEl.files?.[0];
    if (!file) { inputEl.value = ''; return; }
    if (!enabled) { show({ variant: 'warning', title: 'Firebase desativado' }); inputEl.value = ''; return; }
    try {
      setUploading(true);
      // Compress image to max 1MB
      const compressedFile = await compressImage(file, 1, 1920);
      const up = await uploadFile(`content/${active}/hero-${Date.now()}-${file.name}`, compressedFile);
      if ((up as any).ok) { setField("heroImage", (up as any).url as string); show({ variant: 'success', title: 'Imagem enviada' }); }
      else { show({ variant: 'error', title: 'Falha ao enviar' }); }
    } finally {
      setUploading(false);
      if (inputEl) inputEl.value = '';
    }
  }

  async function save() {
    if (!enabled) { show({ variant: 'warning', title: 'Firebase desativado' }); return; }
    const doc = content[active];
    // If we have an id, update; else create new with page field
    if (doc?.id) {
      await updateDocument("content", String(doc.id), {
        page: active,
        title: doc.title || "",
        subtitle: doc.subtitle || "",
        body: doc.body || "",
        heroImage: doc.heroImage || "",
        ctaLabel: doc.ctaLabel || "",
        ctaHref: doc.ctaHref || "",
        carouselItems: Array.isArray(doc.carouselItems) ? doc.carouselItems : [],
        featuredBlocks: Array.isArray(doc.featuredBlocks) ? doc.featuredBlocks : [],
        featuredCreators: Array.isArray(doc.featuredCreators) ? doc.featuredCreators : [],
      });
    } else {
      await saveDocument("content", {
        page: active,
        title: doc?.title || "",
        subtitle: doc?.subtitle || "",
        body: doc?.body || "",
        heroImage: doc?.heroImage || "",
        ctaLabel: doc?.ctaLabel || "",
        ctaHref: doc?.ctaHref || "",
        carouselItems: Array.isArray(doc?.carouselItems) ? doc?.carouselItems : [],
        featuredBlocks: Array.isArray(doc?.featuredBlocks) ? doc?.featuredBlocks : [],
        featuredCreators: Array.isArray(doc?.featuredCreators) ? doc?.featuredCreators : [],
      });
    }
    show({ variant: 'success', title: 'Conteúdo salvo' });
  }

  useImperativeHandle(ref, () => ({ save }));

  return (
    <div>
      <h1 className="text-2xl font-display font-semibold mb-4">Conteúdo</h1>
      {!enabled && <div className="text-sm text-neutral-600">Firebase desativado.</div>}
      {enabled && loading && <div className="text-sm text-neutral-600">Carregando conteúdo...</div>}
      {enabled && !!error && <div className="text-sm text-red-600">{error}</div>}

      <div className="flex gap-2 border-b border-neutral-200">
        {PAGES.map((p) => (
          <button
            key={p.key}
            className={`-mb-px px-3 py-2 text-sm border-b-2 ${active === p.key ? 'border-black font-medium' : 'border-transparent text-neutral-600 hover:text-black'}`}
            onClick={() => setActive(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <Card className="mt-6">
        <CardBody>
          <div className="grid gap-4 max-w-full overflow-hidden">
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Título" value={current.title || ''} onChange={(e) => setField('title', e.target.value)} />
              <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Subtítulo" value={current.subtitle || ''} onChange={(e) => setField('subtitle', e.target.value)} />
            </div>

            <div className="grid gap-2">
              <label className="text-sm text-neutral-700">Imagem principal</label>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 cursor-pointer hover:bg-neutral-50">
                  <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                  {uploading ? 'Enviando...' : 'Enviar imagem'}
                </label>
                {current.heroImage && (
                  <span className="text-xs text-neutral-600 truncate max-w-xs block">{current.heroImage}</span>
                )}
              </div>
              {current.heroImage && (
                <div className="relative h-40 w-full rounded-md overflow-hidden bg-neutral-100">
                  <Image src={current.heroImage} alt="Imagem" fill className="object-cover" />
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <label className="text-sm text-neutral-700">Conteúdo</label>
              <textarea className="min-h-40 rounded-md border border-neutral-300 px-3 py-2" value={current.body || ''} onChange={(e) => setField('body', e.target.value)} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm text-neutral-700">Rótulo do CTA</label>
                <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Ex: Comprar agora" value={current.ctaLabel || ''} onChange={(e) => setField('ctaLabel', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <label className="text-sm text-neutral-700">Link do CTA</label>
                <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Ex: /produtos" value={current.ctaHref || ''} onChange={(e) => setField('ctaHref', e.target.value)} />
              </div>
            </div>

            <div>
              <Button variant="primary" onClick={save}>Salvar</Button>
            </div>

            {/* Sections for Home */}
            {active === 'home' && (
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <h3 className="text-base font-display font-semibold">Carrossel (Home)</h3>
                  <div className="grid gap-3">
                    {(current.carouselItems || []).map((it, idx) => (
                      <div key={idx} className="rounded-md border border-neutral-200 p-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative h-14 w-24 bg-neutral-100 rounded overflow-hidden">
                            {it.image ? <Image src={it.image} alt="item" fill className="object-cover" /> : <div className="absolute inset-0 grid place-items-center text-xs text-neutral-500">Sem imagem</div>}
                          </div>
                          <input value={it.href || ''} onChange={(e) => {
                            const arr = [...(current.carouselItems || [])]; arr[idx] = { ...arr[idx], href: e.target.value }; setField('carouselItems', arr);
                          }} placeholder="/link" className="flex-1 min-w-0 rounded-md border border-neutral-300 px-3 py-2" />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="inline-flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-1.5 cursor-pointer hover:bg-neutral-50">
                            <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                              const inputEl = e.currentTarget;
                              const file = inputEl.files?.[0]; if (!file) { inputEl.value = ''; return; }
                              if (!enabled) { show({ variant: 'warning', title: 'Firebase desativado' }); inputEl.value = ''; return; }
                              const up = await uploadFile(`content/home/carousel/${Date.now()}-${file.name}`, file);
                              if ((up as any).ok) { const arr = [...(current.carouselItems || [])]; arr[idx] = { ...arr[idx], image: (up as any).url }; setField('carouselItems', arr); show({ variant: 'success', title: 'Imagem enviada' }); }
                              inputEl.value = '';
                            }} />
                            Trocar imagem
                          </label>
                          <Button variant="outline" onClick={() => { const arr = [...(current.carouselItems || [])]; arr.splice(idx, 1); setField('carouselItems', arr); }}>Remover</Button>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" onClick={() => setField('carouselItems', [...(current.carouselItems || []), { image: '', href: '' }])}>Adicionar item</Button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <h3 className="text-base font-display font-semibold">Blocos em destaque (Home)</h3>
                  <div className="grid gap-3">
                    {(current.featuredBlocks || []).map((b, idx) => (
                      <div key={idx} className="rounded-md border border-neutral-200 p-3 grid gap-2">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Título" value={b.title || ''} onChange={(e) => { const arr = [...(current.featuredBlocks || [])]; arr[idx] = { ...arr[idx], title: e.target.value }; setField('featuredBlocks', arr); }} />
                          <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Link (/produtos)" value={b.href || ''} onChange={(e) => { const arr = [...(current.featuredBlocks || [])]; arr[idx] = { ...arr[idx], href: e.target.value }; setField('featuredBlocks', arr); }} />
                        </div>
                        <textarea className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Descrição" value={b.description || ''} onChange={(e) => { const arr = [...(current.featuredBlocks || [])]; arr[idx] = { ...arr[idx], description: e.target.value }; setField('featuredBlocks', arr); }} />
                        <div className="flex items-center gap-2">
                          <label className="inline-flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-1.5 cursor-pointer hover:bg-neutral-50">
                            <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                              const inputEl = e.currentTarget;
                              const file = inputEl.files?.[0];
                              if (!file) { inputEl.value = ''; return; }
                              if (!enabled) { show({ variant: 'warning', title: 'Firebase desativado' }); inputEl.value = ''; return; }
                              const up = await uploadFile(`content/home/blocks/${Date.now()}-${file.name}`, file);
                              if ((up as any).ok) { const arr = [...(current.featuredBlocks || [])]; arr[idx] = { ...arr[idx], image: (up as any).url }; setField('featuredBlocks', arr); show({ variant: 'success', title: 'Imagem enviada' }); }
                              inputEl.value = '';
                            }} />
                            Trocar imagem
                          </label>
                          <Button variant="outline" onClick={() => { const arr = [...(current.featuredBlocks || [])]; arr.splice(idx, 1); setField('featuredBlocks', arr); }}>Remover</Button>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" onClick={() => setField('featuredBlocks', [...(current.featuredBlocks || []), { title: '', description: '', href: '', image: '' }])}>Adicionar bloco</Button>
                  </div>
                </div>
              </div>
            )}

            {/* Sections for Criadores */}
            {active === 'criadores' && (
              <div className="grid gap-2">
                <h3 className="text-base font-display font-semibold">Adicionar criador</h3>
                <div className="grid gap-3 sm:grid-cols-2 max-w-3xl">
                  <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Nome" value={newCreator.name} onChange={(e) => setNewCreator(v => ({ ...v, name: e.target.value }))} />
                  <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Subtítulo" value={newCreator.subtitle} onChange={(e) => setNewCreator(v => ({ ...v, subtitle: e.target.value }))} />
                  <textarea className="rounded-md border border-neutral-300 px-3 py-2 sm:col-span-2 min-h-24" placeholder="Sobre o criador" value={newCreator.bio} onChange={(e) => setNewCreator(v => ({ ...v, bio: e.target.value }))} />
                  <div>
                    <label className="inline-flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 cursor-pointer hover:bg-neutral-50">
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const inputEl = e.currentTarget;
                        const file = inputEl.files?.[0]; if (!file) { inputEl.value = ''; return; }
                        if (!enabled) { show({ variant: 'warning', title: 'Firebase desativado' }); inputEl.value = ''; return; }
                        try {
                          setUploading(true);
                          const up = await uploadFile(`creators/avatars/${Date.now()}-${file.name}`, file);
                          if ((up as any).ok) { setNewCreator(v => ({ ...v, avatar: (up as any).url })); show({ variant: 'success', title: 'Imagem enviada' }); }
                          else { show({ variant: 'error', title: 'Falha ao enviar' }); }
                        } finally { setUploading(false); inputEl.value = ''; }
                      }} />
                      {uploading ? 'Enviando...' : 'Enviar imagem'}
                    </label>
                    {newCreator.avatar && <span className="text-xs text-neutral-600 truncate max-w-xs block">{newCreator.avatar}</span>}
                    <Button variant="primary" size="md" className="px-3 ml-3" onClick={async () => {
                      if (!enabled) { show({ variant: 'warning', title: 'Firebase desativado' }); return; }
                      if (!newCreator.name || !newCreator.subtitle || !newCreator.avatar || !newCreator.bio) { show({ variant: 'warning', title: 'Preencha todos os campos' }); return; }
                      const r = await saveDocument('creators', { name: newCreator.name, subtitle: newCreator.subtitle, avatar: newCreator.avatar, bio: newCreator.bio });
                      if ((r as any).ok) {
                        // Append/update in featuredCreators with auto-generated href using document id, avoiding duplicates
                        const id = (r as any).id as string | undefined;
                        if (id) {
                          const before = [...(current.featuredCreators || [])];
                          const idx = before.findIndex(fc => {
                            const h = (fc?.href || '').split('?')[0].split('#')[0].split('/').filter(Boolean).pop();
                            return h === id;
                          });
                          const payload = { name: newCreator.name, role: newCreator.subtitle, image: newCreator.avatar, href: `/criadores/${id}` } as any;
                          if (idx >= 0) {
                            before[idx] = { ...before[idx], ...payload };
                            setField('featuredCreators', before as any);
                          } else {
                            setField('featuredCreators', [...before, payload] as any);
                          }
                        }
                        show({ variant: 'success', title: 'Criador salvo' });
                        setNewCreator({ name: '', subtitle: '', bio: '', avatar: '' });
                      }
                    }}>Salvar criador</Button>
                  </div>
                </div>

                <h3 className="text-base font-display font-semibold">Criadores em destaque</h3>
                <div className="grid gap-3">
                  {(current.featuredCreators || []).map((c, idx) => (
                    <div key={idx} className="rounded-md border border-neutral-200 p-3 grid gap-2">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Nome" value={c.name || ''} onChange={(e) => { const arr = [...(current.featuredCreators || [])]; arr[idx] = { ...arr[idx], name: e.target.value }; setField('featuredCreators', arr); }} />
                        <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Função" value={c.role || ''} onChange={(e) => { const arr = [...(current.featuredCreators || [])]; arr[idx] = { ...arr[idx], role: e.target.value }; setField('featuredCreators', arr); }} />
                      </div>
                      {/* Dropdown removido: edição manual de Nome, Função e Imagem permanece. */}
                      <div className="flex items-center gap-2">
                        <label className="inline-flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-1.5 cursor-pointer hover:bg-neutral-50">
                          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                            const inputEl = e.currentTarget;
                            const file = inputEl.files?.[0]; if (!file) { inputEl.value = ''; return; }
                            if (!enabled) { show({ variant: 'warning', title: 'Firebase desativado' }); inputEl.value = ''; return; }
                            const up = await uploadFile(`content/criadores/featured/${Date.now()}-${file.name}`, file);
                            if ((up as any).ok) { const arr = [...(current.featuredCreators || [])]; arr[idx] = { ...arr[idx], image: (up as any).url }; setField('featuredCreators', arr); show({ variant: 'success', title: 'Imagem enviada' }); }
                            inputEl.value = '';
                          }} />
                          Trocar imagem
                        </label>
                        <Button variant="danger" onClick={() => { const arr = [...(current.featuredCreators || [])]; arr.splice(idx, 1); setField('featuredCreators', arr); }}>Remover</Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" onClick={() => setField('featuredCreators', [...(current.featuredCreators || []), { name: '', role: '', href: '', image: '' }])}>Adicionar criador</Button>
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
});

export default ContentTab;
