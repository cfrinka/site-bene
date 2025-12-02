"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { subscribeCollection, listCollection, isFirebaseEnabled, getFirebase } from "@/lib/firebase";
import Container from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export type PageKey = "home" | "criadores" | "sobre";

export type PageContent = {
  id?: string;
  page: PageKey;
  title?: string;
  subtitle?: string;
  body?: string;
  heroImage?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export default function PageHeader({ page, className = "" }: { page: PageKey; className?: string }) {
  const enabled = isFirebaseEnabled();
  const [doc, setDoc] = useState<PageContent | null>(null);

  useEffect(() => {
    let unsub: (() => void) | null = null;
    let mounted = true;
    (async () => {
      try {
        const fb = await getFirebase();
        if (!fb) return;
        unsub = await subscribeCollection("content", (items) => {
          if (!mounted) return;
          const found = (items as any[]).find((d) => d?.page === page) || null;
          setDoc(found as PageContent | null);
        });
        const r = await listCollection("content");
        if (mounted && (r as any).ok && Array.isArray((r as any).items)) {
          const found = ((r as any).items as any[]).find((d) => d?.page === page) || null;
          setDoc(found as PageContent | null);
        }
      } finally {
        // noop
      }
    })();
    return () => { mounted = false; if (unsub) unsub(); };
  }, [page]);

  const title = doc?.title || (page === "home" ? "Bem-vindo" : page === "criadores" ? "Conheça os Criadores" : "Sobre a Benê Brasil");
  const subtitle = doc?.subtitle || (page === "home" ? "Moda feita de ritmo, cor e liberdade" : undefined);

  return (
    <section className={`relative ${className}`}>
      {doc?.heroImage && (
        <div className="absolute inset-0 -z-10">
          <Image src={doc.heroImage} alt="" fill className="object-cover" />
          <div className="absolute inset-0 bg-black/30" />
        </div>
      )}
      <Container className="relative py-24 md:py-32">
        <h1 className={`text-4xl md:text-5xl font-display ${doc?.heroImage ? 'text-white' : ''}`}>{title}</h1>
        {subtitle && <p className={`mt-3 max-w-2xl ${doc?.heroImage ? 'text-white/80' : 'text-neutral-700'}`}>{subtitle}</p>}
        {doc?.ctaLabel && doc?.ctaHref && (
          <div className="mt-6">
            <Button asChild>
              <a href={doc.ctaHref}>{doc.ctaLabel}</a>
            </Button>
          </div>
        )}
      </Container>
    </section>
  );
}
