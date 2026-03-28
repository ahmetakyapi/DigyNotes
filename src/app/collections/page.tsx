"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import CollectionCard from "@/components/CollectionCard";
import { OrganizationGuide } from "@/components/OrganizationGuide";
import { getClientErrorMessage, isAuthenticationError, requestJson } from "@/lib/client-api";
import { Collection } from "@/types";

export default function CollectionsPage() {
  const router = useRouter();
  const { status } = useSession();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [collectionQuery, setCollectionQuery] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      setLoading(false);
      return;
    }

    if (status !== "authenticated") {
      return;
    }

    fetch("/api/collections")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setCollections(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [status]);

  const createCollection = async () => {
    if (!title.trim()) {
      toast.error("Koleksiyon başlığı gerekli");
      return;
    }

    setIsCreating(true);
    try {
      const data = await requestJson<Collection>(
        "/api/collections",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
          }),
        },
        "Koleksiyon oluşturulamadı."
      );

      setCollections((prev) => [data, ...prev]);
      setTitle("");
      setDescription("");
      toast.success("Koleksiyon oluşturuldu");
    } catch (error) {
      toast.error(getClientErrorMessage(error, "Koleksiyon oluşturulamadı."));
      if (isAuthenticationError(error)) {
        router.push("/login");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void createCollection();
  };

  const filteredCollections = useMemo(() => {
    const query = collectionQuery.trim().toLowerCase();
    if (!query) return collections;

    return collections.filter((collection) =>
      [
        collection.title,
        collection.description ?? "",
        ...collection.posts.map((post) => post.title),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [collectionQuery, collections]);

  const totalPostCount = useMemo(
    () => collections.reduce((sum, collection) => sum + collection.postCount, 0),
    [collections]
  );

  const activeCollectionCount = useMemo(
    () => collections.filter((collection) => collection.postCount > 0).length,
    [collections]
  );

  if (status === "unauthenticated") {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-4">
        <div className="w-full rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center shadow-[var(--shadow-soft)]">
          <p className="text-sm text-[var(--text-secondary)]">
            Koleksiyon oluşturmak ve notlarını daha düzenli gruplamak için giriş yap.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-flex rounded-xl bg-gradient-to-r from-[#10b981] via-[#059669] to-[#047857] px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(16,185,129,0.28)] transition-all hover:brightness-110"
          >
            Giriş Yap
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* ── Header ── */}
      <header className="mb-6">
        <div className="flex items-baseline justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Koleksiyonlar
            </h1>
            {!loading && (
              <span className="text-sm text-[var(--text-muted)]">
                {collections.length} koleksiyon · {totalPostCount} not
              </span>
            )}
          </div>
          <Link
            href="/notes"
            className="text-xs text-[var(--text-secondary)] transition-colors duration-200 hover:text-[var(--text-primary)]"
          >
            Notlarıma dön
          </Link>
        </div>
        <div className="mt-3 h-px w-full bg-[var(--border)]" />
      </header>

      {/* ── Yeni koleksiyon formu ── */}
      <form
        onSubmit={handleSubmit}
        className="mb-6 grid items-end gap-3 sm:grid-cols-[1fr_1.4fr_auto]"
      >
        <label className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Başlık</span>
            <span className="text-[11px] text-[var(--text-faint)]">{title.length}/80</span>
          </div>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={80}
            placeholder="Örn. 2024'te izlediklerim"
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 text-[16px] text-[var(--text-primary)] outline-none transition-colors focus:border-[#10b981]/40 focus:ring-1 focus:ring-[#10b981]/10 sm:text-sm"
          />
        </label>
        <label className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Açıklama</span>
            <span className="text-[11px] text-[var(--text-faint)]">{description.length}/400</span>
          </div>
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={400}
            placeholder="Bu koleksiyonun neyi bir araya getirdiğini kısa ve net anlat"
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 text-[16px] text-[var(--text-primary)] outline-none transition-colors focus:border-[#10b981]/40 focus:ring-1 focus:ring-[#10b981]/10 sm:text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={isCreating || loading || title.trim() === ""}
          className="h-10 rounded-lg bg-[#10b981] px-5 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#059669] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isCreating ? "Oluşturuluyor..." : "Oluştur"}
        </button>
      </form>

      {/* ── Arama ── */}
      {!loading && collections.length > 0 && (
        <div className="mb-6">
          <input
            value={collectionQuery}
            onChange={(event) => setCollectionQuery(event.target.value)}
            placeholder="Koleksiyonlarda ara..."
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 text-[16px] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors focus:border-[#10b981]/40 focus:ring-1 focus:ring-[#10b981]/10 sm:max-w-sm sm:text-sm"
          />
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-72 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]"
            />
          ))}
        </div>
      ) : collections.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] px-6 py-14 text-center">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            İlk koleksiyonunu oluşturarak başla
          </h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Henüz bir koleksiyonun yok. Bir başlık ve kısa açıklama ekleyerek ilk seçkini birkaç
            saniyede oluşturabilirsin.
          </p>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Koleksiyon oluşturduktan sonra detay sayfasından not ekleyebilir, sıralamayı
            düzenleyebilir ve profilinde sergileyebilirsin.
          </p>
        </div>
      ) : filteredCollections.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] px-6 py-14 text-center">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Aramana uyan koleksiyon bulunamadı.
          </h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Farklı bir anahtar kelime deneyebilir veya filtreyi temizleyerek tüm koleksiyonlarını
            yeniden görebilirsin.
          </p>
          <button
            type="button"
            onClick={() => setCollectionQuery("")}
            className="mt-3 text-xs font-medium text-[var(--gold)] transition-colors hover:text-[var(--gold-light)]"
          >
            Filtreyi temizle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredCollections.map((collection) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              href={`/collections/${collection.id}`}
            />
          ))}
        </div>
      )}

      <section className="mt-8">
        <OrganizationGuide
          current="collections"
          title="Koleksiyon ne zaman doğru seçim?"
          description="Hızlı geri dönüş için Kaydettiklerim'i, henüz nota dönüşmeyen içerikler için İstek Listesi'ni kullan. Koleksiyonlar ise bitmiş notları daha kalıcı bir seçkide toplar."
        />
      </section>
    </main>
  );
}
