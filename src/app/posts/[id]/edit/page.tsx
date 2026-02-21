"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";
import "react-quill/dist/quill.snow.css";
import { Post, Category } from "@/types";
import StarRating from "@/components/StarRating";
import { getStatusOptions } from "@/components/StatusBadge";
import { MediaSearch } from "@/components/MediaSearch";
import toast from "react-hot-toast";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
const customLoader = ({ src }: { src: string }) => src;

const inputClass =
  "w-full px-4 py-3 rounded-lg text-[#e8eaf6] placeholder-[#4a5568] bg-[#151b2d] border border-[#252d40] focus:outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]/20 transition-colors text-sm";
const labelClass =
  "block text-[10px] font-bold uppercase tracking-[0.12em] text-[#8892b0] mb-2";

export default function EditPostPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [rating, setRating] = useState(0);
  const [status, setStatus] = useState("");
  const [image, setImage] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [creator, setCreator] = useState("");
  const [years, setYears] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/posts/${params.id}`).then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ])
      .then(([post, cats]: [Post, Category[]]) => {
        setTitle(post.title);
        setCategory(post.category);
        setRating(post.rating ?? 0);
        setStatus(post.status ?? getStatusOptions(post.category)[0]);
        setImage(post.image);
        setExcerpt(post.excerpt);
        setContent(post.content);
        setCreator(post.creator ?? "");
        setYears(post.years ?? "");
        setCategories(cats);
        setLoading(false);
      })
      .catch(() => {
        toast.error("İçerik yüklenemedi");
        setLoading(false);
      });
  }, [params.id]);

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    const opts = getStatusOptions(cat);
    setStatus(opts[0]);
  };

  const handleMediaSelect = (result: {
    title: string;
    creator: string;
    years: string;
    image: string;
    excerpt: string;
    _tab?: string;
  }) => {
    setTitle(result.title);
    setCreator(result.creator);
    setYears(result.years);
    if (result.image) setImage(result.image);
    setExcerpt(result.excerpt);
    if (result.excerpt) setContent(`<p>${result.excerpt}</p>`);
    if (result._tab) {
      const catName =
        result._tab === "dizi" ? "Dizi" : result._tab === "kitap" ? "Kitap" : "Film";
      const matched = categories.find((c) => c.name === catName);
      if (matched) handleCategoryChange(matched.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          rating,
          status,
          image,
          excerpt,
          content,
          creator,
          years,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Değişiklikler kaydedildi!");
      router.push(`/posts/${params.id}`);
    } catch {
      toast.error("Kaydedilemedi!");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-[#4a5568] animate-pulse">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0f1117] py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-10 pb-6 border-b border-[#252d40]">
          <h1 className="text-2xl font-bold text-[#e8eaf6]">Yazıyı Düzenle</h1>
          <button
            onClick={() => router.back()}
            className="text-sm text-[#4a5568] hover:text-[#e8eaf6] transition-colors"
          >
            ← Geri
          </button>
        </div>

        {/* İçerik Ara */}
        <div className="mb-8 rounded-xl bg-[#161616] border border-[#2a2a2a]">
          <button
            type="button"
            onClick={() => setIsSearchOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#1a1a1a] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <svg className="h-3.5 w-3.5 text-[#c9a84c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
              </svg>
              <span className="text-xs font-semibold text-[#c9a84c]">Film, Dizi veya Kitap Ara</span>
              <span className="text-[10px] text-[#555555]">— mevcut alanların üzerine yazar</span>
            </div>
            <svg
              className={`h-4 w-4 text-[#555555] transition-transform duration-200 ${isSearchOpen ? "rotate-180" : ""}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {isSearchOpen && (
            <div className="px-5 pb-5 pt-4 border-t border-[#2a2a2a]">
              <MediaSearch category={category} onSelect={handleMediaSelect} />
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className={labelClass}>Başlık</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className={labelClass}>Kategori</label>
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className={inputClass}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Creator + Years */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                {category === "Kitap" ? "Yazar" : "Yönetmen / Yaratıcı"}
              </label>
              <input
                type="text"
                value={creator}
                onChange={(e) => setCreator(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>
                {category === "Dizi" ? "Yayın Yılları" : "Yıl"}
              </label>
              <input
                type="text"
                value={years}
                onChange={(e) => setYears(e.target.value)}
                className={inputClass}
                required
              />
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className={labelClass}>Puan</label>
            <div className="flex items-center gap-4">
              <StarRating
                rating={rating}
                interactive
                onRate={setRating}
                size={24}
              />
              <span className="text-sm text-[#8892b0]">
                {rating > 0 ? `${rating} / 5` : "—"}
              </span>
              {rating > 0 && (
                <button
                  type="button"
                  onClick={() => setRating(0)}
                  className="text-xs text-[#4a5568] hover:text-[#e53e3e] transition-colors"
                >
                  Sıfırla
                </button>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className={labelClass}>Durum</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={inputClass}
            >
              {getStatusOptions(category).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Image URL + preview */}
          <div>
            <label className={labelClass}>Kapak Görseli URL</label>
            <input
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className={inputClass}
              required
            />
            {image && (
              <div className="mt-3 relative h-44 w-32 rounded-lg overflow-hidden border border-[#252d40]">
                <Image
                  loader={customLoader}
                  src={image}
                  alt="Önizleme"
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>

          {/* Excerpt */}
          <div>
            <label className={labelClass}>Kısa Özet</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              className={inputClass}
              required
            />
          </div>

          {/* Content */}
          <div>
            <label className={labelClass}>İçerik</label>
            <ReactQuill theme="snow" value={content} onChange={setContent} />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4 border-t border-[#252d40]">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 font-semibold bg-[#c9a84c] text-[#0f1117] rounded-lg
                         hover:bg-[#e0c068] transition-colors disabled:opacity-50
                         disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 text-sm text-[#8892b0] hover:text-[#e8eaf6] transition-colors"
            >
              İptal
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
