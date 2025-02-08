"use client";
import React, { useState } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import dynamic from "next/dynamic";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import "react-quill/dist/quill.snow.css";

// Dinamik olarak React-Quill'i import ediyoruz (SSR sorunlarını önlemek için)
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB4KFYnWmEXIO8IMObzY4RWQCm3P-4qcBc",
  authDomain: "digynotes.firebaseapp.com",
  projectId: "digynotes",
  storageBucket: "digynotes.firebasestorage.app",
  messagingSenderId: "272131930980",
  appId: "1:272131930980:web:39cd826baa5c0ba4a65871",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const categories = [
  { value: "Film", label: "Film" },
  { value: "Dizi", label: "Series" },
  { value: "Kitap", label: "Books" },
];

export default function NewPostPage() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(categories[0].value);
  const [rating, setRating] = useState(0);
  const [image, setImage] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [creator, setCreator] = useState("");
  const [years, setYears] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, "posts"), {
        title,
        category,
        rating,
        image,
        excerpt,
        content,
        creator,
        years,
        date: new Date().toLocaleDateString("tr-TR", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      });

      // Form başarıyla gönderildikten sonra formu temizle
      setTitle("");
      setCategory(categories[0].value);
      setRating(0);
      setImage("");
      setExcerpt("");
      setContent("");
      setCreator("");
      setYears("");

      alert("Not başarıyla kaydedildi!");
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Not kaydedilirken bir hata oluştu!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <FaStar
            key={i}
            className="text-yellow-400 cursor-pointer"
            onClick={() => setRating(i)}
          />
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <FaStarHalfAlt
            key={i}
            className="text-yellow-400 cursor-pointer"
            onClick={() => setRating(i)}
          />
        );
      } else {
        stars.push(
          <FaRegStar
            key={i}
            className="text-yellow-400 cursor-pointer"
            onClick={() => setRating(i)}
          />
        );
      }
    }
    return stars;
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Yeni Yazı Oluştur
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Başlık */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Başlık
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Kategori
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Yazar/Yönetmen */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {category === "Kitap" ? "Yazar" : "Yönetmen/Yaratıcı"}
            </label>
            <input
              type="text"
              value={creator}
              onChange={(e) => setCreator(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          {/* Yıl */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {category === "Dizi" ? "Yayın Yılları" : "Yıl"}
            </label>
            <input
              type="text"
              value={years}
              onChange={(e) => setYears(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder={category === "Dizi" ? "2020-2023" : "2023"}
              required
            />
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating
            </label>
            <div className="flex gap-1 text-2xl">{renderStars(rating)}</div>
          </div>

          {/* Fotoğraf URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Fotoğraf URL
            </label>
            <input
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          {/* Kısa Özet */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Kısa Özet
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          {/* İçerik */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              İçerik
            </label>
            <div className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl">
              <ReactQuill
                theme="snow"
                value={content}
                onChange={setContent}
                className="bg-white min-h-[200px]"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
