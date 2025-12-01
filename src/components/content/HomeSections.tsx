"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { getFirebase, isFirebaseEnabled, listCollection, subscribeCollection } from "@/lib/firebase";
import Container from "@/components/ui/Container";

export default function HomeSections() {
  const enabled = isFirebaseEnabled();
  const [doc, setDoc] = useState<any | null>(null);

  useEffect(() => {
    let unsub: (() => void) | null = null;
    let mounted = true;
    (async () => {
      const fb = await getFirebase();
      if (!fb) return;
      unsub = await subscribeCollection("content", (items) => {
        if (!mounted) return;
        const found = (items as any[]).find((d) => d?.page === "home");
        setDoc(found || null);
      });
      const r = await listCollection("content");
      if (mounted && (r as any).ok && Array.isArray((r as any).items)) {
        const found = ((r as any).items as any[]).find((d) => d?.page === "home");
        setDoc(found || null);
      }
    })();
    return () => { mounted = false; if (unsub) unsub(); };
  }, []);

  const carousel: Array<{ image: string; href?: string }> = useMemo(() => Array.isArray(doc?.carouselItems) ? doc.carouselItems : [], [doc]);
  const blocks: Array<{ title: string; description?: string; href?: string; image?: string }> = useMemo(() => Array.isArray(doc?.featuredBlocks) ? doc.featuredBlocks : [], [doc]);

  // Carousel state/behavior
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const autoRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const slideTo = (i: number) => {
    if (carousel.length === 0) return;
    const next = ((i % carousel.length) + carousel.length) % carousel.length;
    setIndex(next);
  };

  const next = () => slideTo(index + 1);
  const prev = () => slideTo(index - 1);

  useEffect(() => {
    if (carousel.length <= 1) return;
    if (autoRef.current) clearTimeout(autoRef.current);
    autoRef.current = setTimeout(() => {
      slideTo(index + 1);
    }, 5000);
    return () => { if (autoRef.current) clearTimeout(autoRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, carousel.length]);

  return (
    <>
      {/* Carousel */}
      {carousel.length > 0 && (
        <section className="py-8">
          <div className="mx-auto max-w-6xl px-6">
            <div className="relative">
              <div
                className="overflow-hidden rounded-lg"
                onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
                onTouchEnd={(e) => {
                  if (touchStartX.current == null) return;
                  const dx = e.changedTouches[0].clientX - touchStartX.current;
                  touchStartX.current = null;
                  if (Math.abs(dx) > 40) {
                    if (dx < 0) next(); else prev();
                  }
                }}
              >
                <div
                  className="flex transition-transform duration-500"
                  style={{ transform: `translateX(-${index * 100}%)` }}
                >
                  {carousel.map((it, idx) => (
                    <div key={idx} className="w-full shrink-0">
                      <a href={it.href || "#"} className="relative block w-full h-56 sm:h-64 lg:h-80 bg-neutral-100">
                        {it.image ? (
                          <Image src={it.image} alt={"Slide " + (idx + 1)} fill className="object-cover object-center" />
                        ) : (
                          <div className="absolute inset-0 grid place-items-center text-neutral-500">Sem imagem</div>
                        )}
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              <button
                aria-label="Anterior"
                onClick={prev}
                className="hidden md:block absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 backdrop-blur shadow px-3 py-2"
              >
                ‹
              </button>
              <button
                aria-label="Próximo"
                onClick={next}
                className="hidden md:block absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 backdrop-blur shadow px-3 py-2"
              >
                ›
              </button>

              <div className="absolute inset-x-0 -bottom-5 flex justify-center gap-2">
                {carousel.map((_, i) => (
                  <button
                    key={i}
                    aria-label={`Ir para slide ${i + 1}`}
                    onClick={() => slideTo(i)}
                    className={`h-2 w-2 rounded-full ${i === index ? "bg-neutral-800" : "bg-neutral-300"}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Featured blocks */}
      {blocks.length > 0 && (
        <section className="py-10">
          <Container>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {blocks.map((b, idx) => (
                <a key={idx} href={b.href || "#"} className="group rounded-lg border border-neutral-200 overflow-hidden hover:shadow-sm transition">
                  <div className="relative h-40 bg-neutral-100">
                    {b.image ? (
                      <Image src={b.image} alt={b.title || "Destaque"} fill className="object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center text-neutral-500 text-sm">Sem imagem</div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="font-medium">{b.title || "Destaque"}</div>
                    {b.description && <div className="mt-1 text-sm text-neutral-600">{b.description}</div>}
                  </div>
                </a>
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}

