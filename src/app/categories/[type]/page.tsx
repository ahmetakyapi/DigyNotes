"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaFilm, FaTv, FaBook } from "react-icons/fa";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { initializeApp } from "firebase/app";

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

type Post = {
  id: string;
  title: string;
  category: string;
  image: string;
  excerpt: string;
  date: string;
  creator?: string;
  years?: string;
  slug?: string;
};

// Custom loader for images
const customLoader = ({ src }: { src: string }) => {
  return src;
};

const categoryMappings = {
  movies: { type: "Film", title: "Filmler", icon: FaFilm },
  series: { type: "Dizi", title: "Diziler", icon: FaTv },
  books: { type: "Kitap", title: "Kitaplar", icon: FaBook },
};

export default function CategoryPage({ params }: { params: { type: string } }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        const categoryInfo =
          categoryMappings[params.type as keyof typeof categoryMappings];

        if (!categoryInfo) {
          setError("Geçersiz kategori");
          setLoading(false);
          return;
        }

        const q = query(
          collection(db, "posts"),
          where("category", "==", categoryInfo.type)
        );

        const querySnapshot = await getDocs(q);
        const postsData = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title || "",
            category: data.category || "",
            image: data.image || "",
            excerpt: data.excerpt || "",
            date: data.date || "",
            creator: data.creator,
            years: data.years,
            slug: `/posts/${doc.id}`,
          };
        });

        setPosts(postsData);
      } catch (err) {
        setError("Veriler yüklenirken bir hata oluştu");
        console.error("Error fetching posts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [params.type]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-2xl text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-2xl text-red-600">{error}</div>
      </div>
    );
  }

  const categoryInfo =
    categoryMappings[params.type as keyof typeof categoryMappings];
  const CategoryIcon = categoryInfo.icon;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-8 sm:mb-12 text-gray-800 flex items-center justify-center">
          <CategoryIcon className="mr-2" />
          {categoryInfo.title}
        </h1>
        <hr className="mb-6 sm:mb-8" />

        {posts.length === 0 ? (
          <div className="text-center text-gray-600">
            Bu kategoride henüz içerik bulunmuyor.
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6 lg:space-y-8">
            {posts.map((post, index) => (
              <Link
                key={post.id}
                href={`/posts/${post.id}`}
                className="block group"
              >
                <article className="bg-white rounded-lg sm:rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
                  <div className="flex flex-col sm:flex-row">
                    <div className="w-full sm:w-1/3 relative h-[200px] sm:h-[300px] overflow-hidden">
                      <Image
                        loader={customLoader}
                        src={post.image}
                        alt={post.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                        priority={index === 0}
                      />
                    </div>
                    <div className="w-full sm:w-2/3 p-4 sm:p-6 lg:p-8 flex flex-col">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-500 mb-2 sm:mb-4">
                        <h2 className="text-xl sm:text-2xl font-bold group-hover:text-blue-600 transition-colors mb-2 sm:mb-0">
                          {post.title}
                        </h2>
                        <div className="flex items-center space-x-4">
                          <span>{post.years}</span>
                          <span>•</span>
                          <span>{post.creator}</span>
                        </div>
                      </div>
                      <p className="text-gray-600 leading-relaxed line-clamp-3 sm:line-clamp-4">
                        {post.excerpt}
                      </p>
                      <div className="mt-3 sm:mt-4 text-blue-600 font-medium group-hover:underline">
                        İncelemeyi Oku →
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
