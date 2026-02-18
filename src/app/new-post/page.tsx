"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";
import "react-quill/dist/quill.snow.css";
import { Category } from "@/types";
import StarRating from "@/components/StarRating";
import toast from "react-hot-toast";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
const customLoader = ({ src }: { src: string }) => src;

const inputClass =
  "w-full px-4 py-3 rounded-lg text-[#e8eaf6] placeholder-[#4a5568] bg-[#151b2d] border border-[#252d40] focus:outline-none focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]/20 transition-colors text-sm";
const labelClass =
  "block text-[10px] font-bold uppercase tracking-[0.12em] text-[#8892b0] mb-2";

export default function NewPostPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [rating, setRating] = useState(0);
  const [image, setImage] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [creator, setCreator] = useState("");
  const [years, setYears] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((cats: Category[]) => {
        setCategories(cats);
        if (cats.length > 0) setCategory(cats[0].name);
      })
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          rating,
          image,
          excerpt,
          content,
          creator,
          years,
        }),
      });
      if (!res.ok) throw new Error("Server error");
      toast.success("Not başarıyla kaydedildi!");
      router.push("/");
    } catch {
      toast.error("Not kaydedilirken bir hata oluştu!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0f1117] py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Page header */}
        <div className="mb-10 pb-6 border-b border-[#252d40]">
          <h1 className="text-2xl font-bold text-[#e8eaf6]">Yeni Not</h1>
          <p className="text-sm text-[#4a5568] mt-1">
            Film, dizi veya kitap notu ekle
          </p>
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
              placeholder="Film, dizi veya kitap adı"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className={labelClass}>Kategori</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputClass}
            >
              {categories.length === 0 && (
                <option value="">Önce bir kategori oluştur</option>
              )}
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
                placeholder={category === "Dizi" ? "2020–2023" : "2024"}
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

          {/* Image URL + preview */}
          <div>
            <label className={labelClass}>Kapak Görseli URL</label>
            <input
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className={inputClass}
              placeholder="https://..."
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
              placeholder="Kısa bir özet veya ilk izlenim..."
              required
            />
          </div>

          {/* Content */}
          <div>
            <label className={labelClass}>İçerik</label>
            <ReactQuill
              theme="snow"
              value={content}
              onChange={setContent}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4 border-t border-[#252d40]">
            <button
              type="submit"
              disabled={isSubmitting || categories.length === 0}
              className="px-8 py-3 font-semibold bg-[#c9a84c] text-[#0f1117] rounded-lg
                         hover:bg-[#e0c068] transition-colors disabled:opacity-50
                         disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
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
