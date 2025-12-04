"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { isFirebaseEnabled, getFirebase, subscribeCollection, listCollection, saveDocument, updateDocument, uploadFile, deleteDocument } from "@/lib/firebase";
import { compressImage } from "@/lib/imageCompression";

export type Creator = { id: string; name?: string; slug?: string; avatar?: string; subtitle?: string; bio?: string };

export default function CreatorsTab() {
  const enabled = isFirebaseEnabled();
  const { show } = useToast();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<Partial<Creator>>({ name: "", slug: "", avatar: "", subtitle: "", bio: "" });
  const [uploading, setUploading] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState<Partial<Creator>>({});

  useEffect(() => {
    let unsub: (() => void) | null = null;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const fb = await getFirebase();
        if (!fb) { setError("Firebase não inicializou."); setLoading(false); return; }
        unsub = await subscribeCollection("creators", (items) => { if (!mounted) return; setCreators(items as Creator[]); setLoading(false); });
        const r = await listCollection("creators");
        if (mounted && (r as any).ok && Array.isArray((r as any).items)) setCreators((r as any).items as Creator[]);
      } catch (e: any) {
        if (!mounted) return; setError(e?.message || "Erro ao carregar criadores");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; if (unsub) unsub(); };
  }, []);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>, target: 'form' | 'edit') {
    const inputEl = e.currentTarget;
    const file = inputEl.files?.[0]; if (!file) { inputEl.value = ''; return; }
    if (!enabled) { show({ variant: 'warning', title: 'Firebase desativado' }); inputEl.value = ''; return; }
    try {
      setUploading(true);
      // Compress image to max 1MB
      const compressedFile = await compressImage(file, 1, 1920);
      const up = await uploadFile(`creators/avatars/${Date.now()}-${file.name}`, compressedFile);
      if ((up as any).ok) {
        if (target === 'form') setForm(f => ({ ...f, avatar: (up as any).url }));
        else setEdit(f => ({ ...f, avatar: (up as any).url }));
        show({ variant: 'success', title: 'Imagem enviada' });
      } else {
        show({ variant: 'error', title: 'Falha ao enviar' });
      }
    } finally {
      setUploading(false);
      if (inputEl) inputEl.value = '';
    }
  }

  async function saveNewCreator() {
    if (!enabled) { show({ variant: 'warning', title: 'Firebase desativado' }); return; }
    if (!form?.name) { show({ variant: 'warning', title: 'Nome obrigatório' }); return; }
    await saveDocument('creators', { name: form.name, slug: form.slug || undefined, avatar: form.avatar || '', subtitle: form.subtitle || '', bio: form.bio || '' });
    show({ variant: 'success', title: 'Criador salvo' });
    setForm({ name: '', slug: '', avatar: '', subtitle: '', bio: '' });
  }

  function startEdit(c: Creator) {
    setEditingId(c.id);
    setEdit({ name: c.name, slug: c.slug, avatar: c.avatar, subtitle: c.subtitle, bio: c.bio });
  }

  async function saveEdit() {
    if (!enabled || !editingId) return;
    await updateDocument('creators', editingId, { name: edit.name || '', slug: edit.slug || '', avatar: edit.avatar || '', subtitle: edit.subtitle || '', bio: edit.bio || '' });
    show({ variant: 'success', title: 'Criador atualizado' });
    setEditingId(null);
    setEdit({});
  }

  async function removeCreator(id?: string) {
    if (!enabled || !id) return;
    await deleteDocument('creators', id);
    show({ variant: 'success', title: 'Criador removido' });
  }

  return (
    <div>
      <h1 className="text-2xl font-display font-semibold mb-4">Criadores</h1>

      <Card className="mb-6">
        <CardBody>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Nome" value={form.name || ''} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
            <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Slug (opcional)" value={form.slug || ''} onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))} />
            <input className="rounded-md border border-neutral-300 px-3 py-2 sm:col-span-2" placeholder="Subtítulo" value={form.subtitle || ''} onChange={(e) => setForm(f => ({ ...f, subtitle: e.target.value }))} />
            <textarea className="rounded-md border border-neutral-300 px-3 py-2 sm:col-span-2" placeholder="Sobre o criador" value={form.bio || ''} onChange={(e) => setForm(f => ({ ...f, bio: e.target.value }))} />
            <div className="sm:col-span-2 flex items-center gap-3">
              <label className="inline-flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 cursor-pointer hover:bg-neutral-50">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleAvatarUpload(e, 'form')} />
                {uploading ? 'Enviando...' : 'Enviar avatar'}
              </label>
              {form.avatar && <span className="text-xs text-neutral-600 truncate">{form.avatar}</span>}
            </div>
            <div className="sm:col-span-2">
              <Button onClick={saveNewCreator} disabled={!form.name}>Salvar criador</Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {!enabled && <div className="text-sm text-neutral-600">Firebase desativado.</div>}
      {enabled && loading && <div className="text-sm text-neutral-600">Carregando criadores...</div>}
      {enabled && !!error && <div className="text-sm text-red-600">{error}</div>}

      <div className="grid gap-3">
        {creators.map((c) => (
          <div key={c.id} className="rounded-md border border-neutral-200 p-3">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 rounded-md overflow-hidden bg-neutral-100 flex-shrink-0">
                {c.avatar ? (
                  <Image src={c.avatar} alt={c.name || 'Criador'} fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-neutral-500">Sem imagem</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{c.name || 'Criador'}</div>
                <div className="text-xs text-neutral-600 truncate">{c.subtitle || 'Subtítulo'}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => startEdit(c)}>Editar</Button>
                <Button size="sm" variant="danger" onClick={() => removeCreator(c.id)}>Remover</Button>
              </div>
            </div>

            {editingId === c.id && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Nome" value={edit.name || ''} onChange={(e) => setEdit(f => ({ ...f, name: e.target.value }))} />
                <input className="rounded-md border border-neutral-300 px-3 py-2" placeholder="Slug" value={edit.slug || ''} onChange={(e) => setEdit(f => ({ ...f, slug: e.target.value }))} />
                <input className="rounded-md border border-neutral-300 px-3 py-2 sm:col-span-2" placeholder="Subtítulo" value={edit.subtitle || ''} onChange={(e) => setEdit(f => ({ ...f, subtitle: e.target.value }))} />
                <textarea className="rounded-md border border-neutral-300 px-3 py-2 sm:col-span-2" placeholder="Sobre o criador" value={edit.bio || ''} onChange={(e) => setEdit(f => ({ ...f, bio: e.target.value }))} />
                <div className="sm:col-span-2 flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 cursor-pointer hover:bg-neutral-50">
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleAvatarUpload(e, 'edit')} />
                    {uploading ? 'Enviando...' : 'Trocar avatar'}
                  </label>
                  {edit.avatar && <span className="text-xs text-neutral-600 truncate">{edit.avatar}</span>}
                </div>
                <div className="sm:col-span-2 flex gap-2">
                  <Button onClick={saveEdit}>Salvar</Button>
                  <Button variant="outline" onClick={() => { setEditingId(null); setEdit({}); }}>Cancelar</Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
