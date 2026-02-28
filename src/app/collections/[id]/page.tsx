"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { Collection, Post } from "@/types";
import { StatusBadge } from "@/components/StatusBadge";
import StarRating from "@/components/StarRating";
import { getCategoryLabel } from "@/lib/categories";
import { formatDisplaySentence, formatDisplayTitle } from "@/lib/display-text";
import { getPostImageSrc } from "@/lib/post-image";

const customLoader = ({ src }: { src: string }) => src;

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
      const res = await fetch(`/api/collections/${collection.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Koleksiyon güncellenemedi");
        return;
      }

      syncCollection(data);
      toast.success("Koleksiyon güncellendi");
    } catch {
      toast.error("Koleksiyon güncellenemedi");
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
      const res = await fetch(`/api/collections/${collection.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Koleksiyon silinemedi");
        return;
      }
      toast.success("Koleksiyon silindi");
      router.push("/collections");
    } catch {
      toast.error("Koleksiyon silinemedi");
    } finally {
      setIsDeleting(false);
    }
  };

  const mutatePost = async (postId: string, method: "POST" | "DELETE") => {
    if (!collection) return;

    setPendingPostId(postId);
    try {
      const res = await fetch(`/api/collections/${collection.id}/posts`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Koleksiyon güncellenemedi");
        return;
      }

      syncCollection(data);
      toast.success(method === "POST" ? "Not koleksiyona eklendi" : "Not koleksiyondan çıkarıldı");
    } catch {
      toast.error("Koleksiyon güncellenemedi");
    } finally {
      setPendingPostId(null);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="h-40 animate-pulse rounded-3xl bg-[var(--bg-card)]" />
      </main>
    );
  }

  if (notFound || !collection) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-[var(--text-primary)]">Koleksiyon bulunamadı</p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Bu koleksiyon silinmiş olabilir veya görüntüleme iznin olmayabilir.
          </p>
          <Link href="/collections" className="mt-4 inline-flex text-sm text-[var(--gold)]">
            ← Koleksiyonlara dön
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-[#c4a24b]/8 rounded-full border border-[#c4a24b]/25 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--gold)]">
                Koleksiyon
              </span>
              <span className="text-xs text-[var(--text-faint)]">
                {collection.postCount} not · Güncellendi {formatDate(collection.updatedAt)}
              </span>
            </div>
            {isOwner ? (
              <div className="mt-4 grid gap-4">
                <label className="space-y-2">
                  <span className="text-xs font-medium text-[var(--text-secondary)]">Başlık</span>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    maxLength={80}
                    className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-3 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[#c4a24b]/45"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-medium text-[var(--text-secondary)]">Açıklama</span>
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={3}
                    maxLength={400}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[#c4a24b]/45"
                  />
                </label>
              </div>
            ) : (
              <>
                <h1 className="mt-4 text-3xl font-bold text-[var(--text-primary)]">
                  {formatDisplayTitle(collection.title)}
                </h1>
                {collection.description && (
                  <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
                    {formatDisplaySentence(collection.description)}
                  </p>
                )}
                {collection.owner && (
                  <p className="mt-4 text-sm text-[var(--text-secondary)]">
                    Oluşturan:{" "}
                    {collection.owner.username ? (
                      <Link
                        href={`/profile/${collection.owner.username}`}
                        className="text-[var(--gold)] hover:text-[var(--gold-light)]"
                      >
                        {collection.owner.name}
                      </Link>
                    ) : (
                      collection.owner.name
                    )}
                  </p>
                )}
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void copyCollectionLink()}
              disabled={isCopyingLink}
              className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:border-[#c4a24b]/35 hover:text-[var(--gold)] disabled:opacity-50"
            >
              {isCopyingLink ? "Kopyalanıyor..." : "Bağlantıyı Kopyala"}
            </button>
            <Link
              href="/collections"
              className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:border-[#c4a24b]/35 hover:text-[var(--gold)]"
            >
              Tüm Koleksiyonlar
            </Link>
            {isOwner && (
              <>
                <button
                  type="button"
                  onClick={saveCollection}
                  disabled={isSaving || !hasUnsavedChanges || title.trim() === ""}
                  className="rounded-xl bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-[var(--text-on-accent)] transition-all hover:bg-[var(--gold-light)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving
                    ? "Kaydediliyor..."
                    : hasUnsavedChanges
                      ? "Değişiklikleri Kaydet"
                      : "Kaydedildi"}
                </button>
                <button
                  type="button"
                  onClick={deleteCollection}
                  disabled={isDeleting}
                  className="hover:bg-[#e53e3e]/8 rounded-xl border border-[#e53e3e]/25 px-4 py-2 text-sm text-[#e53e3e] transition-colors disabled:opacity-50"
                >
                  {isDeleting ? "Siliniyor..." : "Koleksiyonu Sil"}
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-4 shadow-[var(--shadow-soft)]">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-faint)]">
            Koleksiyondaki not
          </p>
          <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
            {collection.postCount}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-4 shadow-[var(--shadow-soft)]">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-faint)]">
            Eklenebilir not
          </p>
          <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
            {availablePosts.length}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-4 shadow-[var(--shadow-soft)]">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-faint)]">
            Son güncelleme
          </p>
          <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
            {formatDate(collection.updatedAt)}
          </p>
        </div>
      </section>

      {isOwner && (
        <section className="mt-6 rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Koleksiyona not ekle
              </h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Sadece kendi notlarını bu koleksiyona ekleyebilirsin.
              </p>
            </div>
            <div className="w-full lg:max-w-sm">
              <input
                value={postQuery}
                onChange={(event) => setPostQuery(event.target.value)}
                placeholder="Eklemek için not ara..."
                className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-base)] px-3 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[#c4a24b]/45"
              />
              <p className="mt-2 text-[11px] text-[var(--text-faint)]">
                {availablePosts.length} uygun not bulundu
              </p>
            </div>
          </div>

          {postQuery.trim() && (
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={() => setPostQuery("")}
                className="text-xs font-medium text-[var(--gold)] transition-colors hover:text-[var(--gold-light)]"
              >
                Aramayı temizle
              </button>
            </div>
          )}

          {availablePosts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-10 text-center text-sm text-[var(--text-muted)]">
              {postQuery.trim()
                ? "Aramana uyan eklenebilir not bulunamadı."
                : "Eklenebilecek yeni not bulunamadı."}
            </div>
          ) : (
            <>
              <div className="grid gap-3 lg:grid-cols-2">
                {availablePosts.slice(0, visibleAvailableCount).map((post) => (
                  <div
                    key={post.id}
                    className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-base)] p-3"
                  >
                    <div className="relative h-20 w-16 flex-shrink-0 overflow-hidden rounded-xl">
                      <Image
                        loader={customLoader}
                        src={getPostImageSrc(post.image)}
                        alt={formatDisplayTitle(post.title)}
                        fill
                        sizes="96px"
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-[#c4a24b]/20 px-2 py-0.5 text-[10px] text-[var(--gold)]">
                          {getCategoryLabel(post.category)}
                        </span>
                        {post.status && <StatusBadge status={post.status} />}
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm font-semibold text-[var(--text-primary)]">
                        {formatDisplayTitle(post.title)}
                      </p>
                      {post.creator && (
                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                          {formatDisplayTitle(post.creator)}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => mutatePost(post.id, "POST")}
                      disabled={pendingPostId === post.id}
                      className="rounded-xl bg-[var(--gold)] px-3 py-2 text-xs font-semibold text-[var(--text-on-accent)] transition-all hover:bg-[var(--gold-light)] disabled:opacity-50"
                    >
                      {pendingPostId === post.id ? "Ekleniyor..." : "Ekle"}
                    </button>
                  </div>
                ))}
              </div>

              {availablePosts.length > visibleAvailableCount && (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleAvailableCount((count) =>
                        Math.min(count + 12, availablePosts.length)
                      )
                    }
                    className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:border-[#c4a24b]/35 hover:text-[var(--gold)]"
                  >
                    Daha fazla göster
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}

      <section className="mt-6">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">Listedeki Notlar</h2>
            <span className="text-sm text-[var(--text-faint)]">
              {filteredCollectionPosts.length}/{collection.postCount} içerik
            </span>
          </div>
          {collection.posts.length > 0 && (
            <div className="flex w-full flex-col gap-3 lg:max-w-sm">
              <input
                value={collectionQuery}
                onChange={(event) => setCollectionQuery(event.target.value)}
                placeholder="Koleksiyon içinde ara..."
                className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-3 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[#c4a24b]/45"
              />
              {collectionQuery.trim() && (
                <button
                  type="button"
                  onClick={() => setCollectionQuery("")}
                  className="self-end text-xs font-medium text-[var(--gold)] transition-colors hover:text-[var(--gold-light)]"
                >
                  Aramayı temizle
                </button>
              )}
            </div>
          )}
        </div>

        {collection.posts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] px-6 py-14 text-center">
            <p className="text-sm text-[var(--text-secondary)]">Bu koleksiyonda henüz not yok.</p>
          </div>
        ) : filteredCollectionPosts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] px-6 py-14 text-center">
            <p className="text-sm text-[var(--text-secondary)]">
              Koleksiyon içinde aramana uyan not bulunamadı.
            </p>
            <button
              type="button"
              onClick={() => setCollectionQuery("")}
              className="mt-3 text-xs font-medium text-[var(--gold)] transition-colors hover:text-[var(--gold-light)]"
            >
              Aramayı temizle
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredCollectionPosts.map((post) => (
              <article
                key={post.id}
                className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow-soft)]"
              >
                <Link href={`/posts/${post.id}`} className="group block">
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      loader={customLoader}
                      src={getPostImageSrc(post.image)}
                      alt={formatDisplayTitle(post.title)}
                      fill
                      sizes="420px"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      unoptimized
                    />
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[rgba(4,10,22,0.78)] to-transparent" />
                  </div>
                </Link>
                <div className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[#c4a24b]/20 px-2 py-0.5 text-[10px] text-[var(--gold)]">
                      {getCategoryLabel(post.category)}
                    </span>
                    {post.status && <StatusBadge status={post.status} />}
                  </div>
                  <div>
                    <Link href={`/posts/${post.id}`}>
                      <h3 className="line-clamp-2 text-lg font-semibold text-[var(--text-primary)] hover:text-[var(--gold)]">
                        {formatDisplayTitle(post.title)}
                      </h3>
                    </Link>
                    {post.creator && (
                      <p className="mt-1 text-sm text-[var(--text-muted)]">
                        {formatDisplayTitle(post.creator)}
                      </p>
                    )}
                  </div>
                  <p className="line-clamp-3 text-sm leading-6 text-[var(--text-secondary)]">
                    {formatDisplaySentence(post.excerpt)}
                  </p>
                  <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
                    <StarRating rating={post.rating} size={12} />
                    <span className="text-xs text-[var(--text-faint)]">{post.date}</span>
                  </div>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => mutatePost(post.id, "DELETE")}
                      disabled={pendingPostId === post.id}
                      className="hover:bg-[#e53e3e]/8 w-full rounded-xl border border-[#e53e3e]/20 px-3 py-2 text-xs font-semibold text-[#e53e3e] transition-colors disabled:opacity-50"
                    >
                      {pendingPostId === post.id ? "Çıkarılıyor..." : "Koleksiyondan Çıkar"}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
