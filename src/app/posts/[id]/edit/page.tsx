"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import "react-quill/dist/quill.snow.css";

// Dinamik olarak React-Quill'i import ediyoruz
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

export default function EditPostPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(categories[0].value);
  const [rating, setRating] = useState(0);
  const [image, setImage] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [creator, setCreator] = useState("");
  const [years, setYears] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const docRef = doc(db, "posts", params.id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setTitle(data.title || "");
          setCategory(data.category || categories[0].value);
          setRating(data.rating || 0);
          setImage(data.image || "");
          setExcerpt(data.excerpt || "");
          setContent(data.content || "");
          setCreator(data.creator || "");
          setYears(data.years || "");
        }
      } catch (error) {
        console.error("Error fetching post:", error);
        alert("İçerik yüklenirken bir hata oluştu!");
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const docRef = doc(db, "posts", params.id);
      await updateDoc(docRef, {
        title,
        category,
        rating,
        image,
        excerpt,
        content,
        creator,
        years,
        updatedAt: new Date().toLocaleDateString("tr-TR", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      });

      alert("Değişiklikler başarıyla kaydedildi!");
      router.push(`/posts/${params.id}`);
    } catch (error) {
      console.error("Error updating document: ", error);
      alert("Değişiklikler kaydedilirken bir hata oluştu!");
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-2xl text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Yazıyı Düzenle
          </h1>
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 flex items-center text-sm sm:text-base"
          >
            ← Geri Dön
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Form fields with responsive styling */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Başlık - Full width */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Başlık
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base"
                required
              />
            </div>

            {/* Kategori - Half width */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kategori
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Yazar/Yönetmen - Half width */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {category === "Kitap" ? "Yazar" : "Yönetmen/Yaratıcı"}
              </label>
              <input
                type="text"
                value={creator}
                onChange={(e) => setCreator(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base"
                required
              />
            </div>

            {/* Yıl - Half width */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {category === "Dizi" ? "Yayın Yılları" : "Yıl"}
              </label>
              <input
                type="text"
                value={years}
                onChange={(e) => setYears(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base"
                placeholder={category === "Dizi" ? "2020-2023" : "2023"}
                required
              />
            </div>

            {/* Rating - Half width */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating
              </label>
              <div className="flex gap-1 text-xl sm:text-2xl">
                {renderStars(rating)}
              </div>
            </div>

            {/* Fotoğraf URL - Full width */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fotoğraf URL
              </label>
              <input
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base"
                required
              />
            </div>

            {/* Kısa Özet - Full width */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kısa Özet
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base"
                required
              />
            </div>

            {/* İçerik - Full width */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                İçerik
              </label>
              <div className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl">
                <ReactQuill
                  theme="snow"
                  value={content}
                  onChange={setContent}
                  className="bg-white min-h-[200px] sm:min-h-[300px]"
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 mt-8">
            <button
              type="button"
              onClick={() => router.back()}
              className="w-full sm:w-auto bg-gray-300 text-gray-700 px-4 py-2 text-sm sm:text-base rounded-md hover:bg-gray-400 order-2 sm:order-1"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 text-sm sm:text-base rounded-md hover:bg-blue-700 disabled:opacity-50 order-1 sm:order-2"
            >
              {isSubmitting ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
