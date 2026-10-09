"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeftIcon,
  LinkSimpleIcon,
  MagnifyingGlassIcon,
  MinusIcon,
  NotePencilIcon,
  PencilSimpleIcon,
  PlusIcon,
  StackIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { Collection, Post } from "@/types";
import { OrganizationGuide } from "@/components/OrganizationGuide";
import { getClientErrorMessage, isAuthenticationError, requestJson } from "@/lib/client-api";
import { StatusBadge } from "@/components/StatusBadge";
import StarRating from "@/components/StarRating";
import { getCategoryLabel } from "@/lib/categories";
import { formatDisplaySentence, formatDisplayTitle } from "@/lib/display-text";
import { getPostImageSrc } from "@/lib/post-image";
import { categorySupportsSpoiler } from "@/lib/post-config";
import { ResilientImage } from "@/components/ResilientImage";
import { PageHeader, Em, Dot } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

const EASE = [0.16, 1, 0.3, 1] as const;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function CollectionDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { status } = useSession();
  const reduceMotion = useReducedMotion();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [postQuery, setPostQuery] = useState("");
  const [collectionQuery, setCollectionQuery] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingPostId, setPendingPostId] = useState<string | null>(null);
  const [visibleAvailableCount, setVisibleAvailableCount] = useState(12);
  const [isCopyingLink, setIsCopyingLink] = useState(false);

  useEffect(() => {
    fetch(`/api/collections/${params.id}`)
      .then(async (res) => {
        if (!res.ok) {
          setNotFound(true);
          setLoading(false);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        setCollection(data.collection);
        setIsOwner(Boolean(data.isOwner));
        setTitle(data.collection.title);
        setDescription(data.collection.description ?? "");
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [params.id]);

  useEffect(() => {
    if (!isOwner || status !== "authenticated") {
      return;
    }

    fetch("/api/posts")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setAllPosts(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [isOwner, status]);

  const availablePosts = useMemo(() => {
    const existingIds = new Set(collection?.posts.map((post) => post.id) ?? []);
    const query = postQuery.trim().toLowerCase();

    return allPosts.filter((post) => {
      if (existingIds.has(post.id)) return false;
      if (!query) return true;

      return [
        post.title,
        post.creator ?? "",
        post.category,
        getCategoryLabel(post.category),
        post.excerpt,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [allPosts, collection?.posts, postQuery]);

  const filteredCollectionPosts = useMemo(() => {
    const posts = collection?.posts ?? [];
    const query = collectionQuery.trim().toLowerCase();
    if (!query) return posts;

    return posts.filter((post) =>
      [post.title, post.creator ?? "", post.category, getCategoryLabel(post.category), post.excerpt]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [collection?.posts, collectionQuery]);

  const hasUnsavedChanges = Boolean(
    collection &&
    (title.trim() !== collection.title || description.trim() !== (collection.description ?? ""))
  );

  useEffect(() => {
    setVisibleAvailableCount(12);
  }, [postQuery]);

  const syncCollection = (next: Collection | null) => {
    if (!next) return;
    setCollection(next);
    setTitle(next.title);
    setDescription(next.description ?? "");
  };

  const saveCollection = async () => {
    if (!collection) return;

    setIsSaving(true);
    try {
      const data = await requestJson<Collection>(
        `/api/collections/${collection.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
          }),
        },
        "Koleksiyon güncellenemedi."
      );

      syncCollection(data);
      toast.success("Koleksiyon güncellendi");
    } catch (error) {
      toast.error(getClientErrorMessage(error, "Koleksiyon güncellenemedi."));
      if (isAuthenticationError(error)) {
        router.push("/login");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const copyCollectionLink = async () => {
    if (typeof window === "undefined") return;

    setIsCopyingLink(true);
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Koleksiyon bağlantısı kopyalandı");
    } catch {
      toast.error("Bağlantı kopyalanamadı");
    } finally {
      setIsCopyingLink(false);
    }
  };

  const deleteCollection = async () => {
    if (!collection) return;
    if (
      typeof window !== "undefined" &&
      !window.confirm(`"${collection.title}" koleksiyonunu silmek istediğine emin misin?`)
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await requestJson<{ success: boolean }>(
        `/api/collections/${collection.id}`,
        { method: "DELETE" },
        "Koleksiyon silinemedi."
      );
      toast.success("Koleksiyon silindi");
      router.push("/collections");
    } catch (error) {
      toast.error(getClientErrorMessage(error, "Koleksiyon silinemedi."));
      if (isAuthenticationError(error)) {
        router.push("/login");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const mutatePost = async (postId: string, method: "POST" | "DELETE") => {
    if (!collection) return;

    setPendingPostId(postId);
    try {
      const data = await requestJson<Collection>(
        `/api/collections/${collection.id}/posts`,
        {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId }),
        },
        "Koleksiyon güncellenemedi."
      );

      syncCollection(data);
      toast.success(method === "POST" ? "Not koleksiyona eklendi" : "Not koleksiyondan çıkarıldı");
    } catch (error) {
      toast.error(getClientErrorMessage(error, "Koleksiyon güncellenemedi."));
      if (isAuthenticationError(error)) {
        router.push("/login");
      }
    } finally {
      setPendingPostId(null);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-4 h-3 w-40 animate-pulse rounded-full bg-[var(--bg-card)]" />
        <div className="mb-10 h-16 w-2/3 animate-pulse rounded-[22px] bg-[var(--bg-card)]" />
        <div className="h-40 animate-pulse rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)]" />
      </main>
    );
  }

  if (notFound || !collection) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-4">
        <div className="w-full">
          <EmptyState
            icon={<StackIcon size={22} weight="duotone" />}
            title={
              <>
                Koleksiyon <Em>Bulunamadı</Em>
              </>
            }
            description="Bu koleksiyon silinmiş olabilir ya da görme iznin olmayabilir."
            primary={{ label: "Koleksiyonlara Dön", href: "/collections" }}
          />
        </div>
      </main>
    );
  }

  const ghostPill =
    "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-[var(--border)] px-4 text-xs font-medium text-[var(--text-secondary)] transition-colors duration-200 hover:border-[var(--text-faint)] hover:text-[var(--text-primary)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50";
  const inputCls =
    "w-full border border-[var(--border)] bg-[var(--bg-base)] text-[16px] text-[var(--text-primary)] placeholder-[var(--text-faint)] outline-none transition-colors duration-200 focus:border-accent/50 sm:text-sm";

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <PageHeader
        index="11"
        eyebrow="Koleksiyon"
        title={
          <>
            {formatDisplayTitle(collection.title)}
            <Dot />
          </>
        }
        description={
          <>
            {collection.description && (
              <span className="block">{formatDisplaySentence(collection.description)}</span>
            )}
            <span className="mt-3 block text-[12.5px] font-medium text-[var(--text-muted)]">
              Güncellendi {formatDate(collection.updatedAt)}
              {collection.owner && (
                <>
                  {" · "}
                  {collection.owner.username ? (
                    <Link
                      href={`/profile/${collection.owner.username}`}
                      className="text-[var(--text-secondary)] transition-colors duration-200 hover:text-[var(--gold)]"
                    >
                      {collection.owner.name}
                    </Link>
                  ) : (
                    collection.owner.name
                  )}
                </>
              )}
            </span>
          </>
        }
        stats={[
          { value: collection.postCount, label: "Not" },
          ...(isOwner ? [{ value: availablePosts.length, label: "Eklenebilir" }] : []),
        ]}
        actions={
          <>
            <button
              type="button"
              onClick={() => void copyCollectionLink()}
              disabled={isCopyingLink}
              className={ghostPill}
            >
              <LinkSimpleIcon size={12} weight="bold" />
              <span className="hidden sm:inline">
                {isCopyingLink ? "Kopyalanıyor..." : "Bağlantıyı Kopyala"}
              </span>
            </button>
            <Link href="/collections" className={ghostPill}>
              <ArrowLeftIcon size={12} weight="bold" />
              <span className="hidden sm:inline">Tüm Koleksiyonlar</span>
            </Link>
          </>
        }
      />

      {isOwner && (
        /* LAYOUT: Owner edit composer — mono labels, hairline inputs, save pill + quiet danger pill on the right. */
        <section className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)] p-5 transition-colors duration-500 ease-out-expo focus-within:border-[var(--text-faint)] sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <PencilSimpleIcon size={12} weight="bold" className="text-[var(--gold)]" />
            <p className="text-[12.5px] font-medium text-[var(--text-muted)]">
              Koleksiyonu Düzenle
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
            <label className="block">
              <span className="mb-2 flex items-center justify-between text-[12.5px] font-medium text-[var(--text-muted)]">
                Başlık
                <span className="text-[var(--text-faint)]">{title.length}/80</span>
              </span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={80}
                className={`h-11 rounded-full px-4 ${inputCls}`}
              />
            </label>
            <label className="block">
              <span className="mb-2 flex items-center justify-between text-[12.5px] font-medium text-[var(--text-muted)]">
                Açıklama
                <span className="text-[var(--text-faint)]">{description.length}/400</span>
              </span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={2}
                maxLength={400}
                className={`rounded-[18px] px-4 py-2.5 ${inputCls}`}
              />
            </label>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-end gap-3 border-t border-[var(--border)] pt-5">
            <button
              type="button"
              onClick={deleteCollection}
              disabled={isDeleting}
              className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border border-[var(--border)] px-4 text-xs font-medium text-[var(--danger)] transition-colors duration-200 hover:border-[var(--danger)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <TrashIcon size={12} weight="bold" />
              {isDeleting ? "Siliniyor..." : "Koleksiyonu Sil"}
            </button>
            <button
              type="button"
              onClick={saveCollection}
              disabled={isSaving || !hasUnsavedChanges || title.trim() === ""}
              className="inline-flex h-10 cursor-pointer items-center rounded-full bg-[var(--gold)] px-5 text-sm font-semibold text-[var(--text-on-accent)] transition-all duration-300 ease-out-expo hover:-translate-y-0.5 hover:bg-[var(--gold-light)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {isSaving
                ? "Kaydediliyor..."
                : hasUnsavedChanges
                  ? "Değişiklikleri Kaydet"
                  : "Kaydedildi"}
            </button>
          </div>
        </section>
      )}

      {isOwner && (
        /* LAYOUT: "Add notes" shelf — mono eyebrow + heading left, search pill right; 2-col list of compact rows. */
        <section className="mt-12">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.03em] text-[var(--text-primary)]">
                Koleksiyona <Em>Not</Em> Ekle
              </h2>
              <p className="mt-1 max-w-xl text-sm text-[var(--text-muted)]">
                Bu koleksiyona yalnızca kendi notlarını ekleyebilirsin.
              </p>
            </div>
            <div className="w-full lg:max-w-sm">
              <label className="relative block">
                <MagnifyingGlassIcon
                  size={14}
                  weight="bold"
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                />
                <input
                  value={postQuery}
                  onChange={(event) => setPostQuery(event.target.value)}
                  placeholder="Eklemek için not ara..."
                  className={`h-10 rounded-full pl-10 pr-4 ${inputCls}`}
                />
              </label>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-[12.5px] font-medium text-[var(--text-muted)]">
                  {availablePosts.length} uygun not
                </p>
                {postQuery.trim() && (
                  <button
                    type="button"
                    onClick={() => setPostQuery("")}
                    className="cursor-pointer text-xs font-medium text-[var(--gold)] transition-colors duration-200 hover:text-[var(--gold-light)]"
                  >
                    Aramayı Temizle
                  </button>
                )}
              </div>
            </div>
          </div>

          {availablePosts.length === 0 ? (
            <EmptyState
              compact
              icon={<NotePencilIcon size={22} weight="duotone" />}
              title={
                postQuery.trim() ? (
                  <>
                    Aramana Uyan <Em>Not</Em> Yok
                  </>
                ) : (
                  <>
                    Eklenecek Yeni <Em>Not</Em> Yok
                  </>
                )
              }
              description={
                postQuery.trim()
                  ? "Aramana uyan, eklenebilecek bir not bulamadık."
                  : "Tüm notların zaten bu koleksiyonda. Yeni bir not yazıp ekleyebilirsin."
              }
              primary={
                postQuery.trim()
                  ? { label: "Aramayı Temizle", onClick: () => setPostQuery("") }
                  : { label: "Yeni Not Yaz", href: "/new-post" }
              }
            />
          ) : (
            <>
              <div className="grid gap-3 lg:grid-cols-2">
                {availablePosts.slice(0, visibleAvailableCount).map((post) => (
                  <div
                    key={post.id}
                    className="flex items-center gap-4 rounded-[22px] border border-[var(--border)] bg-[var(--bg-card)] p-3 transition-colors duration-300 hover:border-[var(--text-faint)]"
                  >
                    <div className="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded-[14px]">
                      <ResilientImage
                        src={getPostImageSrc(post.image, post.category)}
                        alt={formatDisplayTitle(post.title)}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[12px] font-medium text-[var(--text-muted)]">
                          {getCategoryLabel(post.category)}
                        </span>
                        {post.status && <StatusBadge status={post.status} />}
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-sm font-bold tracking-[-0.01em] text-[var(--text-primary)]">
                        {formatDisplayTitle(post.title)}
                      </p>
                      {post.creator && (
                        <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                          {formatDisplayTitle(post.creator)}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => mutatePost(post.id, "POST")}
                      disabled={pendingPostId === post.id}
                      aria-label="Koleksiyona ekle"
                      className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-[var(--gold)] px-3.5 text-xs font-semibold text-[var(--text-on-accent)] transition-all duration-300 hover:bg-[var(--gold-light)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <PlusIcon size={12} weight="bold" />
                      {pendingPostId === post.id ? "Ekleniyor..." : "Ekle"}
                    </button>
                  </div>
                ))}
              </div>

              {availablePosts.length > visibleAvailableCount && (
                <div className="mt-5 flex justify-center">
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleAvailableCount((count) =>
                        Math.min(count + 12, availablePosts.length)
                      )
                    }
                    className={ghostPill}
                  >
                    Daha Fazla Göster
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* LAYOUT: Collection contents — heading + mono count left, search pill right; 1/2/3 col card grid. */}
      <section className="mt-12">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="dn-eyebrow">
              {filteredCollectionPosts.length}/{collection.postCount} not
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.03em] text-[var(--text-primary)]">
              Koleksiyondaki <Em>Notlar</Em>
            </h2>
          </div>
          {collection.posts.length > 0 && (
            <div className="flex w-full flex-col gap-2 lg:max-w-sm">
              <label className="relative block">
                <MagnifyingGlassIcon
                  size={14}
                  weight="bold"
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                />
                <input
                  value={collectionQuery}
                  onChange={(event) => setCollectionQuery(event.target.value)}
                  placeholder="Koleksiyon içinde ara..."
                  className={`h-10 rounded-full pl-10 pr-4 ${inputCls}`}
                />
              </label>
              {collectionQuery.trim() && (
                <button
                  type="button"
                  onClick={() => setCollectionQuery("")}
                  className="cursor-pointer self-end text-xs font-medium text-[var(--gold)] transition-colors duration-200 hover:text-[var(--gold-light)]"
                >
                  Aramayı Temizle
                </button>
              )}
            </div>
          )}
        </div>

        {collection.posts.length === 0 ? (
          <EmptyState
            icon={<StackIcon size={22} weight="duotone" />}
            title={
              <>
                Bu Koleksiyon Henüz <Em>Boş</Em>
              </>
            }
            description="Bu koleksiyonda henüz not yok."
          />
        ) : filteredCollectionPosts.length === 0 ? (
          <EmptyState
            compact
            icon={<MagnifyingGlassIcon size={22} weight="duotone" />}
            title={
              <>
                Aramana Uyan <Em>Not</Em> Yok
              </>
            }
            description="Bu koleksiyonda aramana uyan not yok."
            primary={{ label: "Aramayı Temizle", onClick: () => setCollectionQuery("") }}
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredCollectionPosts.map((post, i) => (
              <motion.article
                key={post.id}
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE, delay: Math.min(i, 8) * 0.05 }}
                className="group flex flex-col overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)] transition-colors duration-500 ease-out-expo hover:border-[var(--text-faint)]"
              >
                <Link href={`/posts/${post.id}`} className="block">
                  <div className="relative h-52 overflow-hidden">
                    <ResilientImage
                      src={getPostImageSrc(post.image, post.category)}
                      alt={formatDisplayTitle(post.title)}
                      fill
                      sizes="420px"
                      className="object-cover transition-transform duration-[1400ms] ease-out-expo group-hover:scale-[1.06]"
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[var(--bg-card)] to-transparent" />
                    <span className="absolute left-3 top-3 rounded-full border border-[var(--border)] bg-[var(--bg-overlay)] px-2.5 py-1 text-[12px] font-medium text-[var(--text-primary)] backdrop-blur-sm">
                      {String(i + 1).padStart(2, "0")} · {getCategoryLabel(post.category)}
                    </span>
                  </div>
                </Link>
                <div className="flex flex-1 flex-col gap-3 px-5 pb-5 pt-1">
                  {post.status && (
                    <div>
                      <StatusBadge status={post.status} />
                    </div>
                  )}
                  <div>
                    <Link href={`/posts/${post.id}`}>
                      <h3 className="line-clamp-2 text-lg font-extrabold leading-snug tracking-[-0.02em] text-[var(--text-primary)] transition-colors duration-200 hover:text-[var(--gold)]">
                        {formatDisplayTitle(post.title)}
                      </h3>
                    </Link>
                    {post.creator && (
                      <p className="mt-1 text-sm text-[var(--text-muted)]">
                        {formatDisplayTitle(post.creator)}
                      </p>
                    )}
                  </div>
                  {!(post.hasSpoiler && categorySupportsSpoiler(post.category)) && (
                    <p className="line-clamp-3 text-sm leading-6 text-[var(--text-secondary)]">
                      {formatDisplaySentence(post.excerpt)}
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between border-t border-[var(--border)] pt-3">
                    <StarRating rating={post.rating} size={12} />
                    <span className="text-[12.5px] font-medium text-[var(--text-muted)]">
                      {post.date}
                    </span>
                  </div>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => mutatePost(post.id, "DELETE")}
                      disabled={pendingPostId === post.id}
                      className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full border border-[var(--border)] text-xs font-medium text-[var(--text-muted)] transition-colors duration-200 hover:border-[var(--danger)] hover:text-[var(--danger)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <MinusIcon size={12} weight="bold" />
                      {pendingPostId === post.id ? "Çıkarılıyor..." : "Koleksiyondan Çıkar"}
                    </button>
                  )}
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-14">
        <OrganizationGuide
          current="collections"
          title="Koleksiyon Ne İşe Yarar?"
          description="Kaydettiklerim, sonra tekrar bakmak istediğin notlar için; İstek Listesi, henüz izlemediğin ya da okumadığın şeyler için. Koleksiyonlar ise yazdığın notları bir konu altında toplar."
        />
      </section>
    </main>
  );
}
