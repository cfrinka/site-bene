"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Container from "@/components/ui/Container";
import { H1, Text } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { getFirebase, isFirebaseEnabled, listCollection, subscribeCollection } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

function slugify(s?: string) {
  return (s || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

type CreatorDoc = { id: string; name?: string; avatar?: string; subtitle?: string; bio?: string; slug?: string };

type FeaturedCreator = { name: string; subtitle?: string; image?: string; href?: string; bio?: string };

export default function CreatorDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: paramSlug } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const enabled = isFirebaseEnabled();
  const [creators, setCreators] = useState<CreatorDoc[]>([]);
  const [contentCriadores, setContentCriadores] = useState<FeaturedCreator[]>([]);
  const [loading, setLoading] = useState(true);

  // Redirect non-admin users
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    let unCreators: (() => void) | null = null;
    let unContent: (() => void) | null = null;
    let mounted = true;
    (async () => {
      try {
        if (!enabled) { setLoading(false); return; }
        const fb = await getFirebase(); if (!fb) { setLoading(false); return; }
        // live creators
        unCreators = await subscribeCollection("creators", (items) => { if (!mounted) return; setCreators(items as CreatorDoc[]); });
        // live content to get featured creators fallback
        unContent = await subscribeCollection("content", (items) => {
          if (!mounted) return;
          const doc = (items as any[]).find((d) => d?.page === "criadores");
          const arr: FeaturedCreator[] = Array.isArray(doc?.featuredCreators) ? doc!.featuredCreators : [];
          setContentCriadores(arr);
        });
        // initial fetch fallback
        const [rc, rct] = await Promise.all([listCollection("creators"), listCollection("content")]);
        if (mounted) {
          if ((rc as any).ok && Array.isArray((rc as any).items)) setCreators((rc as any).items as CreatorDoc[]);
          if ((rct as any).ok && Array.isArray((rct as any).items)) {
            const doc = ((rct as any).items as any[]).find((d) => d?.page === "criadores");
            const arr: FeaturedCreator[] = Array.isArray(doc?.featuredCreators) ? doc!.featuredCreators : [];
            setContentCriadores(arr);
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; if (unCreators) unCreators(); if (unContent) unContent(); };
  }, [enabled]);

  const item = useMemo(() => {
    // 1) try by exact ID match first (case-sensitive)
    const byId = creators.find(c => c.id === paramSlug);
    if (byId) return { name: byId.name, subtitle: byId.subtitle, image: byId.avatar, bio: byId.bio } as FeaturedCreator;

    // 2) try by creators.slug
    const s = slugify(paramSlug);
    const bySlug = creators.find(c => (c.slug && slugify(c.slug) === s));
    if (bySlug) return { name: bySlug.name, subtitle: bySlug.subtitle, image: bySlug.avatar, bio: bySlug.bio } as FeaturedCreator;

    // 3) fallback to featuredCreators by slugified name
    const byFeatured = contentCriadores.find(c => slugify(c.name) === s);
    if (byFeatured) return { name: byFeatured.name, subtitle: (byFeatured as any).role, image: (byFeatured as any).image || (byFeatured as any).avatar, href: byFeatured.href, bio: (byFeatured as any).bio } as FeaturedCreator;

    // 4) fallback to featuredCreators by href last segment
    const byHref = contentCriadores.find(c => {
      const href: string | undefined = (c as any).href;
      if (!href) return false;
      try {
        const last = href.split('?')[0].split('#')[0].split('/').filter(Boolean).pop();
        return last ? slugify(last) === s : false;
      } catch { return false; }
    });
    if (byHref) return { name: byHref.name, subtitle: (byHref as any).role, image: (byHref as any).image || (byHref as any).avatar, href: (byHref as any).href, bio: (byHref as any).bio } as FeaturedCreator;

    return null;
  }, [paramSlug, creators, contentCriadores]);

  // Show nothing while checking auth or loading
  if (authLoading || !user || user.role !== "admin") {
    return null;
  }

  if (loading) {
    return (
      <main className="min-h-screen">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/10 via-transparent to-transparent" />
          <Container className="relative py-16">
            <Skeleton className="h-10 w-24 mb-4" />
            <Skeleton className="h-12 w-80 mt-4" />
            <Skeleton className="h-6 w-64 mt-2" />
          </Container>
        </section>
        <Container className="pb-20">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Skeleton className="w-full aspect-[16/10] rounded-lg" />
              <div className="mt-6 space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/10 via-transparent to-transparent" />
        <Container className="relative py-16">
          <Button href="/criadores" variant="outline">Voltar</Button>
          <H1 className="mt-4">{item?.name ?? "Criador"}</H1>
          {item?.subtitle && <Text className="mt-2">{item.subtitle}</Text>}
        </Container>
      </section>

      <Container className="pb-20">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="relative w-full aspect-[16/10] rounded-lg overflow-hidden bg-neutral-100">
              {item?.image ? (
                <Image src={item.image} alt={item?.name ?? "Criador"} fill className="object-cover" />
              ) : (
                <div className="absolute inset-0 grid place-items-center text-neutral-500">Sem imagem</div>
              )}
            </div>
            {item?.bio && (
              <div className="mt-6 prose max-w-none">
                <p>{item.bio}</p>
              </div>
            )}
          </div>
          <aside className="lg:col-span-1">
            <div className="rounded-lg border border-neutral-200 p-4">
              <h3 className="font-display font-semibold">Sobre</h3>
              <p className="mt-2 text-sm text-neutral-700">{item?.subtitle ?? "Artista independente"}</p>
            </div>
          </aside>
        </div>
      </Container>
    </main>
  );
}
