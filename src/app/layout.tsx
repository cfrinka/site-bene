import type { Metadata } from "next";
import Image from "next/image";
import { Montserrat } from "next/font/google";
import localFont from "next/font/local";
import Header from "../components/Header";
import NavLink from "../components/ui/NavLink";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import "./globals.css";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-ui" });

const naughtyMonster = localFont({
  src: [
    {
      path: "../../public/fonts/naughty-monster/NaughtyMonster.otf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Benê Brasil — Moda feita de ritmo, cor e liberdade",
  description: "Descubra a Benê Brasil: uma marca que celebra o estilo brasileiro com cores vibrantes, ritmo e liberdade em cada peça.",
  keywords: ["moda brasileira", "streetwear", "camisetas", "arte urbana", "moda sustentável", /* "criadores brasileiros", */ "estilo brasileiro"],
  authors: [{ name: "Benê Brasil" }],
  openGraph: {
    title: "Benê Brasil — Moda feita de ritmo, cor e liberdade",
    description: "Descubra a Benê Brasil: uma marca que celebra o estilo brasileiro com cores vibrantes, ritmo e liberdade em cada peça.",
    type: "website",
    locale: "pt_BR",
    siteName: "Benê Brasil",
  },
  twitter: {
    card: "summary_large_image",
    title: "Benê Brasil — Moda feita de ritmo, cor e liberdade",
    description: "Descubra a Benê Brasil: uma marca que celebra o estilo brasileiro com cores vibrantes, ritmo e liberdade em cada peça.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />
      </head>
      <body className={`${montserrat.variable} ${naughtyMonster.variable} antialiased`} suppressHydrationWarning>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <Header />
              <main>{children}</main>
            </ToastProvider>
          </CartProvider>
        </AuthProvider>

        <footer className="mt-20 bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] text-white">
          <div className="mx-auto max-w-6xl px-6 py-16">
            {/* Top Section */}
            <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-12 mb-12">
              {/* Brand Section - Takes more space */}
              <div className="lg:col-span-5">
                <Image
                  src="https://firebasestorage.googleapis.com/v0/b/bene-brasil-533af.firebasestorage.app/o/Logo%20Benê%20Brasil%20Branco.png?alt=media&token=d73290a4-4495-437c-930f-d36aa8cda438"
                  alt="Benê Brasil"
                  width={150}
                  height={60}
                  className="object-contain"
                />
                <p className="mt-4 text-base text-white/80 leading-relaxed max-w-sm">
                  Moda feita de ritmo, cor e liberdade. Celebrando o estilo brasileiro com peças únicas e autênticas.
                </p>
                <div className="mt-6 flex gap-4">
                  <a
                    href="https://instagram.com/benebrasiloficial"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center"
                    aria-label="Instagram"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Navigation Sections */}
              <div className="lg:col-span-7 grid grid-cols-2 gap-8 md:gap-12">
                <div>
                  <h4 className="font-display text-3xl font-semibold text-white mb-4 uppercase tracking-wider">
                    Explorar
                  </h4>
                  <ul className="space-y-3">
                    <li>
                      <NavLink
                        className="text-white/70 hover:text-white transition-colors inline-flex items-center group"
                        href="/colecoes"
                      >
                        <span className="group-hover:translate-x-1 transition-transform">Coleções</span>
                      </NavLink>
                    </li>
                    <li>
                      <NavLink
                        className="text-white/70 hover:text-white transition-colors inline-flex items-center group"
                        href="/produtos"
                      >
                        <span className="group-hover:translate-x-1 transition-transform">Produtos</span>
                      </NavLink>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-display text-3xl  font-semibold text-white mb-4 uppercase tracking-wider">
                    Institucional
                  </h4>
                  <ul className="space-y-3">
                    <li>
                      <NavLink
                        className="text-white/70 hover:text-white transition-colors inline-flex items-center group"
                        href="/sobre"
                      >
                        <span className="group-hover:translate-x-1 transition-transform">Sobre</span>
                      </NavLink>
                    </li>
                    <li>
                      <NavLink
                        className="text-white/70 hover:text-white transition-colors inline-flex items-center group"
                        href="/contato"
                      >
                        <span className="group-hover:translate-x-1 transition-transform">Contato</span>
                      </NavLink>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Newsletter Section */}
            <div className="border-t border-white/10 pt-8 pb-8">
              <div className="max-w-2xl">
                <h4 className="font-display text-2xl tracking-wide font-semibold text-white mb-2">
                  Fique por dentro das novidades
                </h4>
                <p className="text-white/60 text-sm mb-4">
                  Receba em primeira mão lançamentos, promoções e conteúdos exclusivos.
                </p>
                <form className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    className="flex-1 rounded-lg bg-white/10 border border-white/20 px-4 py-3 outline-none placeholder:text-white/40 focus:border-brand-primary focus:bg-white/15 transition-colors"
                    placeholder="Seu melhor e-mail"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-lg bg-brand-primary hover:bg-brand-primary/90 font-medium transition-colors whitespace-nowrap"
                  >
                    Assinar Newsletter
                  </button>
                </form>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-white/50">
                © {new Date().getFullYear()} Benê Brasil. Todos os direitos reservados.
              </p>
              <div className="flex gap-6 text-sm text-white/50">
                <a href="#" className="hover:text-white transition-colors">Política de Privacidade</a>
                <a href="#" className="hover:text-white transition-colors">Termos de Uso</a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
