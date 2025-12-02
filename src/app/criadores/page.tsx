"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Container from "@/components/ui/Container";
import CreatorsGrid from "@/components/data/CreatorsGrid";
import PageHeader from "@/components/content/PageHeader";
import PageBody from "@/components/content/PageBody";

export default function CriadoresPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/");
    }
  }, [user, loading, router]);

  // Show loading or nothing while checking auth
  if (loading || !user || user.role !== "admin") {
    return null;
  }

  return (
    <main className="min-h-screen">
      <PageHeader page="criadores" />
      <Container className="py-6">
        <PageBody page="criadores" />
      </Container>

      <Container className="pb-20">
        <h2 className="text-2xl font-semibold mb-6">Conheça os criadores</h2>
        <CreatorsGrid limit={6} />
      </Container>
    </main>
  );
}
