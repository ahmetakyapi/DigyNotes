"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeftIcon, MagnifyingGlassIcon, PlusIcon, StackIcon } from "@phosphor-icons/react";
import CollectionCard from "@/components/CollectionCard";
import { OrganizationGuide } from "@/components/OrganizationGuide";
import { getClientErrorMessage, isAuthenticationError, requestJson } from "@/lib/client-api";
import { PageHeader, Em, Dot } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Collection } from "@/types";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function CollectionsPage() {
  const router = useRouter();
  const { status } = useSession();
  const reduceMotion = useReducedMotion();
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
        <div className="w-full">
          <EmptyState
            icon={<StackIcon size={22} weight="duotone" />}
            title={
              <>
                Raflarını Kurmak İçin <Em>Giriş Yap</Em>
              </>
            }
            description="Koleksiyon oluşturmak ve notlarını daha düzenli gruplamak için giriş yap."
            primary={{ label: "Giriş Yap", href: "/login" }}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PageHeader
        index="11"
        eyebrow="Koleksiyonlar"
        title={
          <>
            Kendi <Em>Rafların</Em>
            <Dot />
          </>
        }
        description="Bitmiş notlarını tema, dönem ya da duygu ekseninde kalıcı seçkilere dönüştür."
        stats={
          loading
            ? undefined
            : [
                { value: collections.length, label: "Koleksiyon" },
                { value: totalPostCount, label: "Not" },
                { value: activeCollectionCount, label: "Dolu" },
              ]
        }
        actions={
          <Link
            href="/notes"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--border)] px-4 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-200 hover:border-[var(--text-faint)] hover:text-[var(--text-primary)]"
          >
            <ArrowLeftIcon size={12} weight="bold" />
            Notlarıma Dön
          </Link>
        }
      />

      {/* LAYOUT: Inline composer card — mono labels over hairline inputs, pill submit on the right (stacks on mobile). */}
      <form
        onSubmit={handleSubmit}
        className="mb-8 rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)] p-5 transition-colors duration-500 ease-out-expo focus-within:border-[var(--text-faint)] sm:p-6"
      >
        <div className="mb-4 flex items-center gap-2">
          <PlusIcon size={12} weight="bold" className="text-[var(--gold)]" />
          <p className="dn-mono text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Yeni Koleksiyon
          </p>
        </div>
        <div className="grid items-end gap-4 sm:grid-cols-[1fr_1.4fr_auto]">
          <label className="block">
            <span className="dn-mono mb-2 flex items-center justify-between text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Başlık
              <span className="text-[var(--text-faint)]">{title.length}/80</span>
            </span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={80}
              placeholder="Örn. 2024'te izlediklerim"
              className="h-11 w-full rounded-full border border-[var(--border)] bg-[var(--bg-base)] px-4 text-[16px] text-[var(--text-primary)] placeholder-[var(--text-faint)] outline-none transition-colors duration-200 focus:border-accent/50 sm:text-sm"
            />
          </label>
          <label className="block">
            <span className="dn-mono mb-2 flex items-center justify-between text-[10.5px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Açıklama
              <span className="text-[var(--text-faint)]">{description.length}/400</span>
            </span>
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={400}
              placeholder="Bu koleksiyonun neyi bir araya getirdiğini kısa ve net anlat"
              className="h-11 w-full rounded-full border border-[var(--border)] bg-[var(--bg-base)] px-4 text-[16px] text-[var(--text-primary)] placeholder-[var(--text-faint)] outline-none transition-colors duration-200 focus:border-accent/50 sm:text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={isCreating || loading || title.trim() === ""}
            className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--gold)] px-6 text-sm font-semibold text-[var(--text-on-accent)] transition-all duration-300 ease-out-expo hover:-translate-y-0.5 hover:bg-[var(--gold-light)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {isCreating ? "Oluşturuluyor..." : "Oluştur"}
          </button>
        </div>
      </form>

      {/* LAYOUT: Search pill above the grid (only when collections exist). */}
      {!loading && collections.length > 0 && (
        <div className="mb-6">
          <label className="relative block sm:max-w-sm">
            <MagnifyingGlassIcon
              size={14}
              weight="bold"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <input
              value={collectionQuery}
              onChange={(event) => setCollectionQuery(event.target.value)}
              placeholder="Koleksiyonlarda ara..."
              className="h-10 w-full rounded-full border border-[var(--border)] bg-[var(--bg-card)] pl-10 pr-4 text-[16px] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors duration-200 focus:border-accent/50 sm:text-sm"
            />
          </label>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-80 animate-pulse rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)]"
            />
          ))}
        </div>
      ) : collections.length === 0 ? (
        <EmptyState
          icon={<StackIcon size={22} weight="duotone" />}
          title={
            <>
              İlk Rafını <Em>Kur</Em>
            </>
          }
          description="Henüz bir koleksiyonun yok. Yukarıdan bir başlık ve kısa açıklama ekleyerek ilk seçkini birkaç saniyede oluşturabilirsin; sonra detay sayfasından not ekleyip profilinde sergileyebilirsin."
          primary={{ label: "Notlarıma Göz At", href: "/notes" }}
        />
      ) : filteredCollections.length === 0 ? (
        <EmptyState
          compact
          icon={<MagnifyingGlassIcon size={22} weight="duotone" />}
          title={
            <>
              Aramana Uyan <Em>Koleksiyon</Em> Yok
            </>
          }
          description="Farklı bir anahtar kelime deneyebilir veya filtreyi temizleyerek tüm koleksiyonlarını yeniden görebilirsin."
          primary={{ label: "Filtreyi Temizle", onClick: () => setCollectionQuery("") }}
        />
      ) : (
        /* LAYOUT: 1 / 2 / 3 column grid of cinematic covers with staggered entrance. */
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredCollections.map((collection, i) => (
            <motion.div
              key={collection.id}
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE, delay: Math.min(i, 8) * 0.05 }}
            >
              <CollectionCard collection={collection} href={`/collections/${collection.id}`} />
            </motion.div>
          ))}
        </div>
      )}

      <section className="mt-14">
        <OrganizationGuide
          current="collections"
          title="Koleksiyon Ne Zaman Doğru Seçim?"
          description="Hızlı geri dönüş için Kaydettiklerim'i, henüz nota dönüşmeyen içerikler için İstek Listesi'ni kullan. Koleksiyonlar ise bitmiş notları daha kalıcı bir seçkide toplar."
        />
      </section>
    </main>
  );
}
