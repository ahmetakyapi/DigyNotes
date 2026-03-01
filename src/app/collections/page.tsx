"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import CollectionCard from "@/components/CollectionCard";
import { OrganizationGuide } from "@/components/OrganizationGuide";
import {
  getClientErrorMessage,
  isAuthenticationError,
  requestJson,
} from "@/lib/client-api";
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
            className="mt-4 inline-flex rounded-xl bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-[var(--text-on-accent)]"
          >
            Giriş Yap
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <section
        className="mb-6 rounded-[32px] border border-[var(--border)] p-5 shadow-[var(--shadow-soft)] sm:p-6"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(196,162,75,0.12), transparent 32%), var(--bg-card)",
        }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="bg-[#c4a24b]/8 inline-flex rounded-full border border-[#c4a24b]/25 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--gold)]">
              Koleksiyonlar
            </span>
            <h1 className="mt-3 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
              Notlarını koleksiyonlarda düzenle
            </h1>
            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
              Buradaki ana iş koleksiyon açmak ya da mevcut seçkine geri dönmek. Uzun açıklamalar
              aşağıda, aksiyon alanı ise hemen burada.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-[var(--border)] bg-[var(--bg-raised)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]">
                {collections.length} koleksiyon
              </span>
              <span className="rounded-full border border-[var(--border)] bg-[var(--bg-raised)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]">
                {totalPostCount} not
              </span>
              <span className="rounded-full border border-[var(--border)] bg-[var(--bg-raised)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)]">
                {activeCollectionCount} aktif seçki
              </span>
            </div>
          </div>
          <Link
            href="/notes"
            className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--bg-raised)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:border-[#c4a24b]/35 hover:text-[var(--gold)]"
          >
            Notlarıma dön
          </Link>
        </div>
      </section>

      <section className="mb-8 rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Yeni koleksiyon oluştur
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Önce başlık ve kısa açıklamayı ver. Not ekleme işi sonra detay sayfasında devam eder.
            </p>
          </div>
          <span className="inline-flex w-fit rounded-full border border-[var(--gold)]/20 bg-[var(--gold)]/8 px-3 py-1 text-[11px] font-medium text-[var(--gold)]">
            İlk aksiyon burada
          </span>
        </div>
        <form
          onSubmit={handleSubmit}
          className="grid gap-4 lg:grid-cols-[1.1fr_1.4fr_auto] lg:items-end"
        >
          <label className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-[var(--text-secondary)]">Başlık</span>
              <span className="text-[11px] text-[var(--text-faint)]">{title.length}/80</span>
            </div>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={80}
              placeholder="Örn. 2024'te izlediklerim"
              className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-3 text-[16px] text-[var(--text-primary)] outline-none transition-colors focus:border-[#c4a24b]/45 sm:text-sm"
            />
          </label>
          <label className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-[var(--text-secondary)]">Açıklama</span>
              <span className="text-[11px] text-[var(--text-faint)]">{description.length}/400</span>
            </div>
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={400}
              placeholder="Bu koleksiyonun neyi bir araya getirdiğini kısa ve net anlat"
              className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-3 text-[16px] text-[var(--text-primary)] outline-none transition-colors focus:border-[#c4a24b]/45 sm:text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={isCreating || loading || title.trim() === ""}
            className="h-11 rounded-xl bg-[var(--gold)] px-5 text-sm font-semibold text-[var(--text-on-accent)] transition-all hover:bg-[var(--gold-light)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCreating ? "Oluşturuluyor..." : "Koleksiyon oluştur"}
          </button>
        </form>
      </section>

      {!loading && collections.length > 0 && (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-[var(--shadow-soft)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Koleksiyonlarında ara
            </h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Başlık, açıklama veya not adına göre filtrele.
            </p>
          </div>
          <input
            value={collectionQuery}
            onChange={(event) => setCollectionQuery(event.target.value)}
            placeholder="Koleksiyon ara..."
            className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-3 text-[16px] text-[var(--text-primary)] outline-none transition-colors focus:border-[#c4a24b]/45 sm:max-w-sm sm:text-sm"
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
