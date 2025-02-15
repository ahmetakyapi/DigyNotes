"use client";
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { getFirestore, collection, getDocs } from "firebase/firestore";
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

// Custom loader to allow images from any domain
const customLoader = ({ src }: { src: string }) => {
  return src;
};

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    const fetchPosts = async () => {
      const querySnapshot = await getDocs(collection(db, "posts"));
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
          slug: data.slug,
        };
      });
      setPosts(postsData);
    };
    fetchPosts();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="relative">
          <div className="flex items-center justify-between mb-8 sm:mb-12">
            <div className="relative flex-1">
              <div className="flex items-center">
                <div
                  ref={scrollRef}
                  className="flex items-center space-x-2 overflow-x-auto scrollbar-hide relative"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  <div className="flex items-center">
                    <Link
                      href="/new-post"
                      className="flex items-center justify-center w-6 h-2 hover:border-gray-300"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        className="text-gray-600 mt-3"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 9H3v1h6v6h1v-6h6V9h-6V3H9z"
                        />
                      </svg>
                    </Link>
                    <span className="text-xl font-medium text-gray-900 hover:text-gray-700 ml-5">
                      Son Notlar
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <hr /> <br />
        <div className="space-y-4 sm:space-y-8">
          {posts.map((post, index) => (
            <Link
              key={index}
              href={`/posts/${post.id}`}
              className="block group"
            >
              <article className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-1/3 relative h-[200px] sm:h-[250px] md:h-[300px] overflow-hidden">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                      priority={index === 0}
                      loader={customLoader}
                    />
                  </div>
                  <div className="w-full md:w-2/3 p-4 sm:p-6 md:p-8 flex flex-col">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-500 mb-4">
                      <h2 className="text-xl sm:text-2xl font-bold group-hover:text-blue-600 transition-colors mb-2 sm:mb-0">
                        {post.title}
                      </h2>
                      <div className="flex flex-wrap gap-2 sm:items-center">
                        <span className="text-blue-600 font-medium">
                          {post.category}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span>{post.creator}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>{post.years}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>{post.date}</span>
                      </div>
                    </div>
                    <p className="text-gray-600 leading-relaxed line-clamp-4 sm:line-clamp-6">
                      {post.excerpt}
                    </p>
                    <div className="mt-4 text-blue-600 font-medium group-hover:underline">
                      Devamını Oku →
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
