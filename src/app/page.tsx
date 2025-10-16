import Image from 'next/image'

export default function HomePage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center text-white">
      <div className="fixed inset-0 -z-20">
        <Image
          src="https://firebasestorage.googleapis.com/v0/b/bene-brasil-533af.firebasestorage.app/o/logo%2Fbackground.png?alt=media&token=07ff8835-b388-4a9c-8ea4-80ee579df285"
          alt="Background"
          fill
          priority={false}
          loading="lazy"
          quality={60}
          sizes="100vw"
          className="object-cover"
        />
      </div>
      <div className="fixed inset-0 -z-10 bg-black/30 backdrop-blur-sm" />

      <div className="relative z-0 w-full max-w-3xl px-6 md:px-8 text-center">
        <div className="mx-auto mb-8 relative w-48 h-48 md:w-56 md:h-56">
          <Image
            src="https://firebasestorage.googleapis.com/v0/b/bene-brasil-533af.firebasestorage.app/o/logo%2Flogo%20site.png?alt=media&token=42c505a9-9b42-404d-9a22-2ec4ee115fa1"
            alt="Benê Brasil"
            fill
            className="object-contain"
            priority
            fetchPriority="high"
            sizes="(max-width: 768px) 192px, 224px"
          />
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-wide leading-tight">
          EM CONSTRUÇÃO
        </h1>
        <p className="mt-2 uppercase tracking-[0.25em] text-white/80 text-sm md:text-base">
          Site quase pronto
        </p>

        <div className="mt-6 md:mt-8 w-full max-w-xl mx-auto">
          <div className="flex justify-between text-xs text-white/60 mb-2">
            <span>0%</span>
            <span>100%</span>
          </div>
          <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#2A5473]"
              style={{ width: '60%' }}
            />
          </div>
        </div>

        <div className="mt-8">
          <a
            href="https://instagram.com/benebrasiloficial"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-5 py-3 rounded-md bg-white text-black hover:bg-white/90 transition font-medium"
          >
            Siga no Instagram
          </a>
        </div>

        <div className="mt-10 flex items-center justify-center gap-6">
          <a
            href="https://instagram.com/benebrasiloficial"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram Benê Brasil"
            className="w-10 h-10 rounded-full border border-white/40 flex items-center justify-center hover:bg-white/10 transition"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 2H17C20 2 22 4 22 7V17C22 20 20 22 17 22H7C4 22 2 20 2 17V7C2 4 4 2 7 2Z" stroke="currentColor" strokeWidth="1.5" />
              <path d="M16.5 7.5H16.51" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 8.5C9.79 8.5 8 10.29 8 12.5C8 14.71 9.79 16.5 12 16.5C14.21 16.5 16 14.71 16 12.5C16 10.29 14.21 8.5 12 8.5Z" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </a>
        </div>

        <p className="mt-8 text-xs text-white/60">© {new Date().getFullYear()} Benê Brasil</p>
      </div>
    </div>
  )
}
