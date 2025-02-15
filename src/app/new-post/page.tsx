"use client";
import React, { useState } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import dynamic from "next/dynamic";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import "react-quill/dist/quill.snow.css";
import { toast } from 'react-toastify';

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
  { value: "movies", label: "Film" },
  { value: "series", label: "Dizi" },
  { value: "books", label: "Kitap2" },
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

  const handleRatingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseFloat(e.target.value);

    if (isNaN(value)) value = 0;
    if (value < 0) value = 0;
    if (value > 5) value = 5;

    // En yakın 0.5'e yuvarlaz
    value = Math.round(value * 2) / 2;

    setRating(value);
  };

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

      toast.success('Not başarıyla kaydedildi!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (error) {
      console.error("Error adding document: ", error);
      toast.error('Not kaydedilirken bir hata oluştu!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<FaStar key={i} className="text-yellow-400" size={24} />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <FaStarHalfAlt key={i} className="text-yellow-400" size={24} />
        );
      } else {
        stars.push(<FaRegStar key={i} className="text-yellow-400" size={24} />);
      }
    }
    return stars;
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 border-b pb-4">
          Yeni Yazı Oluştur
        </h1>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Başlık */}
          <div className="form-group">
            <label className="block text-lg font-semibold text-gray-800 mb-2">
              Başlık
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full px-4 py-3 text-lg rounded-lg border-2 border-gray-300 
                       shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                       transition duration-200 ease-in-out"
              required
            />
          </div>

          {/* Kategori */}
          <div className="form-group">
            <label className="block text-lg font-semibold text-gray-800 mb-2">
              Kategori
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 block w-full px-4 py-3 text-lg rounded-lg border-2 border-gray-300 
                       shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                       transition duration-200 ease-in-out bg-white"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Yazar/Yönetmen */}
          <div className="form-group">
            <label className="block text-lg font-semibold text-gray-800 mb-2">
              {category === "Kitap" ? "Yazar" : "Yönetmen/Yaratıcı"}
            </label>
            <input
              type="text"
              value={creator}
              onChange={(e) => setCreator(e.target.value)}
              className="mt-1 block w-full px-4 py-3 text-lg rounded-lg border-2 border-gray-300 
                       shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                       transition duration-200 ease-in-out"
              required
            />
          </div>

          {/* Yıl */}
          <div className="form-group">
            <label className="block text-lg font-semibold text-gray-800 mb-2">
              {category === "Dizi" ? "Yayın Yılları" : "Yıl"}
            </label>
            <input
              type="text"
              value={years}
              onChange={(e) => setYears(e.target.value)}
              className="mt-1 block w-full px-4 py-3 text-lg rounded-lg border-2 border-gray-300 
                       shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                       transition duration-200 ease-in-out"
              placeholder={category === "Dizi" ? "2020-2023" : "2023"}
              required
            />
          </div>

          {/* Rating */}
          <div className="form-group">
            <label className="block text-lg font-semibold text-gray-800 mb-2">
              Rating (0-5)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min="0"
                max="5"
                step="0.5"
                value={rating === 0 ? "" : rating} // 0 ise boş göster
                onChange={handleRatingChange}
                onBlur={(e) => {
                  if (e.target.value === "") setRating(0);
                }}
                className="w-24 px-4 py-3 text-lg rounded-lg border-2 border-gray-300 
                         shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                         transition duration-200 ease-in-out"
                placeholder="0-5"
              />
              <div className="flex gap-1 bg-white p-2 rounded-lg border-2 border-gray-300">
                {renderStars(rating)}
              </div>
            </div>
            <span className="text-sm text-gray-500 mt-1 block">
              0 ile 5 arasında, yarım yıldız için .5 kullanabilirsiniz (Örn:
              4.5)
            </span>
          </div>

          {/* Fotoğraf URL */}
          <div className="form-group">
            <label className="block text-lg font-semibold text-gray-800 mb-2">
              Fotoğraf URL
            </label>
            <input
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="mt-1 block w-full px-4 py-3 text-lg rounded-lg border-2 border-gray-300 
                       shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                       transition duration-200 ease-in-out"
              required
            />
          </div>

          {/* Kısa Özet */}
          <div className="form-group">
            <label className="block text-lg font-semibold text-gray-800 mb-2">
              Kısa Özet
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={4}
              className="mt-1 block w-full px-4 py-3 text-lg rounded-lg border-2 border-gray-300 
                       shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                       transition duration-200 ease-in-out resize-y"
              required
            />
          </div>

          {/* İçerik */}
          <div className="form-group">
            <label className="block text-lg font-semibold text-gray-800 mb-2">
              İçerik
            </label>
            <div className="prose prose-lg max-w-none">
              <ReactQuill
                theme="snow"
                value={content}
                onChange={setContent}
                className="bg-white rounded-lg min-h-[300px] border-2 border-gray-300"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-4 text-lg font-semibold text-white bg-blue-600 rounded-lg
                       hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 
                       transition duration-200 ease-in-out disabled:opacity-50
                       disabled:cursor-not-allowed transform hover:-translate-y-0.5"
            >
              {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
