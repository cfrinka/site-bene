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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

const links = [
  { href: "/colecoes", label: "Coleções" },
  { href: "/produtos", label: "Produtos" },
  // { href: "/criadores", label: "Criadores" }, // Disabled for now
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
];

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { totalItems } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await signOutFirebase();
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname?.startsWith(href + "/");
  };

  const userInitial = (user?.name?.[0] || user?.displayName?.[0] || user?.email?.[0])?.toUpperCase() || "U";
  const userName = user?.name || user?.displayName || user?.email?.split("@")[0];

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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="hidden md:flex items-center gap-2 border-white/20 text-white hover:bg-white/10"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-white/20 text-white text-xs">
                      {userInitial}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{userName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>
                  <p className="text-xs text-muted-foreground">Conectado como</p>
                  <p className="text-sm font-medium truncate">{user.name || user.displayName || user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/perfil">Meu Perfil</Link>
                </DropdownMenuItem>
                {user.role === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="font-medium">🛠️ Admin</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Cart button */}
          <Button
            href="/carrinho"
            variant="ghost"
            size="icon"
            className="relative border border-white/20 text-white hover:bg-white/10 bg-transparent"
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
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex border border-white/20 text-white hover:bg-white/10 bg-transparent"
            aria-label="Instagram Benê Brasil"
          >
            <InstagramIcon width={16} height={16} />
          </Button>

          {/* Mobile menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden border border-white/20 text-white hover:bg-white/10 bg-transparent"
                aria-label="Abrir menu"
              >
                <MenuIcon width={18} height={18} />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] bg-[#282828] border-white/10">
              <SheetHeader>
                <SheetTitle className="text-white">Menu</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-2">
                {user && (
                  <>
                    <div className="flex items-center gap-3 px-2 py-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-white/20 text-white">
                          {userInitial}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs text-white/60">Conectado como</p>
                        <p className="text-sm font-medium text-white">{userName}</p>
                      </div>
                    </div>
                    <Separator className="bg-white/10" />
                    <Link
                      href="/perfil"
                      className="rounded-md px-3 py-2 text-white/80 hover:bg-white/10 transition-colors"
                    >
                      Meu Perfil
                    </Link>
                    {user.role === "admin" && (
                      <Link
                        href="/admin"
                        className="rounded-md px-3 py-2 text-white/80 hover:bg-white/10 font-medium transition-colors"
                      >
                        🛠️ Admin
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="text-left rounded-md px-3 py-2 text-red-400 hover:bg-white/10 transition-colors"
                    >
                      Sair
                    </button>
                    <Separator className="bg-white/10" />
                  </>
                )}
                {links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`rounded-md px-3 py-2 transition-colors ${
                      isActive(l.href) ? "bg-white/10 text-white" : "text-white/80 hover:bg-white/10"
                    }`}
                  >
                    {l.label}
                  </Link>
                ))}
                <Separator className="bg-white/10" />
                <Link
                  href="https://instagram.com/benebrasiloficial"
                  className="rounded-md px-3 py-2 text-white/80 hover:bg-white/10 transition-colors"
                >
                  Instagram
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
