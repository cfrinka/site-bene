"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import NavLink from "./ui/NavLink";
import { Button } from "./ui/Button";
import { InstagramIcon, MenuIcon } from "./../components/icons";
import Image from "next/image";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { signOutFirebase } from "@/lib/firebase";

const links = [
  { href: "/colecoes", label: "Coleções" },
  { href: "/produtos", label: "Produtos" },
  // { href: "/criadores", label: "Criadores" }, // Disabled for now
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { totalItems } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    // Close menus on route change
    setOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await signOutFirebase();
    setUserMenuOpen(false);
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname?.startsWith(href + "/");
  };

  return (
    <header className="sticky top-0 z-50 bg-[#355444]/80 backdrop-blur border-b border-white/10 py-2">
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-white bg-white/60 rounded-md p-2">
          <Image
            src="https://firebasestorage.googleapis.com/v0/b/bene-brasil-533af.firebasestorage.app/o/logo%2Flogo%20site.png?alt=media&token=42c505a9-9b42-404d-9a22-2ec4ee115fa1"
            alt="Benê Brasil"
            width={72}
            height={72}
            className="object-contain"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex gap-6 text-sm text-white/80">
          {links.map((l) => (
            <NavLink key={l.href} href={l.href} className="">
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* User menu - Desktop */}
          {user && (
            <div className="hidden md:block relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/20 text-white hover:bg-white/10 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-semibold">
                  {(user.name?.[0] || user.displayName?.[0] || user.email?.[0])?.toUpperCase() || 'U'}
                </div>
                <span className="text-sm">{user.name || user.displayName || user.email?.split('@')[0]}</span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-neutral-200 py-1">
                  <div className="px-4 py-2 border-b border-neutral-200">
                    <p className="text-xs text-neutral-500">Conectado como</p>
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {user.name || user.displayName || user.email}
                    </p>
                  </div>
                  <a
                    href="/perfil"
                    className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                  >
                    Meu Perfil
                  </a>
                  {user.role === "admin" && (
                    <a
                      href="/admin"
                      className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 font-medium"
                    >
                      🛠️ Admin
                    </a>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-neutral-50"
                  >
                    Sair
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Cart button */}
          <Button
            href="/carrinho"
            variant="outline"
            size="md"
            className="relative h-9 w-9 p-0 border-white/20 text-white hover:bg-white/10"
            aria-label="Carrinho"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-accent text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                {totalItems}
              </span>
            )}
          </Button>

          <Button
            href="https://instagram.com/benebrasiloficial"
            variant="outline"
            size="md"
            className="hidden md:inline-flex h-9 w-9 p-0 border-white/20 text-white hover:bg-white/10"
            aria-label="Instagram Benê Brasil"
          >
            <InstagramIcon width={16} height={16} />
          </Button>

          {/* Mobile hamburger */}
          <Button
            variant="outline"
            size="md"
            className="md:hidden inline-flex h-9 w-9 p-0 border-white/20 text-white hover:bg-white/10"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Abrir menu"
          >
            <MenuIcon width={18} height={18} />
          </Button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {open && (
        <div className="md:hidden border-t border-white/10 bg-[#282828]">
          <nav className="mx-auto max-w-6xl px-6 py-4 grid gap-2 text-sm">
            {user && (
              <div className="mb-2 pb-2 border-b border-white/10">
                <div className="flex items-center gap-2 px-3 py-2 text-white">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-semibold">
                    {(user.name?.[0] || user.displayName?.[0] || user.email?.[0])?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="text-xs text-white/60">Conectado como</p>
                    <p className="text-sm font-medium">{user.name || user.displayName || user.email}</p>
                  </div>
                </div>
                <a
                  href="/perfil"
                  className="block w-full text-left rounded-md px-3 py-2 text-white/80 hover:bg-white/10"
                >
                  Meu Perfil
                </a>
                {user.role === "admin" && (
                  <a
                    href="/admin"
                    className="block w-full text-left rounded-md px-3 py-2 text-white/80 hover:bg-white/10 font-medium"
                  >
                    🛠️ Admin
                  </a>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full text-left rounded-md px-3 py-2 text-red-400 hover:bg-white/10"
                >
                  Sair
                </button>
              </div>
            )}
            {links.map((l) => (
              <NavLink
                key={l.href}
                href={l.href}
                className={`rounded-md px-3 py-2 ${isActive(l.href) ? "bg-white/10 text-white" : "text-white/80"
                  }`}
                activeClassName="bg-white/10 text-white rounded-md px-3 py-2"
              >
                {l.label}
              </NavLink>
            ))}
            <Button href="https://instagram.com/benebrasiloficial" variant="ghost" className="rounded-md px-3 py-2 text-white/80 hover:bg-white/10">
              Instagram
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
