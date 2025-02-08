"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaFilm, FaTv, FaBook, FaStickyNote } from "react-icons/fa";
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

const posts = [
  {
    title: "Inceptio2222n",
    excerpt:
      "Christopher Nolan'ın zihin bükücü başyapıtı, rüyaların derinliklerine inen bir ekibin hikayesini anlatıyor. Dom Cobb, zihninin en savunmasız olduğu rüya görme anında, bilinçaltının derinliklerindeki değerli sırları çekip çıkarmak ve onları çalmaktır...",
    category: "Film",
    date: "15 Mart 2024",
    slug: "/posts/inception",
    image:
      "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_.jpg",
    creator: "Christopher Nolan",
    years: "2010",
  },
  {
    title: "Breaking Bad",
    excerpt:
      "Vince Gilligan'ın yarattığı bu kült dizi, kanser teşhisi konan bir kimya öğretmeninin, ailesinin geleceğini güvence altına almak için metamfetamin üretmeye başlamasıyla değişen hayatını konu alıyor...",
    category: "Dizi",
    date: "14 Mart 2024",
    slug: "/posts/breaking-bad",
    image:
      "https://m.media-amazon.com/images/M/MV5BYmQ4YWMxYjUtNjZmYi00MDQ1LWFjMjMtNjA5ZDdiYjdiODU5XkEyXkFqcGdeQXVyMTMzNDExODE5._V1_.jpg",
    creator: "Vince Gilligan",
    years: "2008-2013",
  },
  {
    title: "1984",
    excerpt:
      "George Orwell'in distopik başyapıtı, gözetim toplumunun ve totaliter rejimin en çarpıcı tasvirlerinden birini sunuyor. Oceania'da yaşayan Winston Smith'in hikayesi, günümüz dünyasında bile çarpıcı paralellikler taşıyor...",
    category: "Kitap",
    date: "13 Mart 2024",
    slug: "/posts/1984",
    image:
      "https://m.media-amazon.com/images/I/71kxa1-0mfL._AC_UF1000,1000_QL80_.jpg",
    creator: "George Orwell",
    years: "1949",
  },
];

// Custom loader to allow images from any domain
const customLoader = ({ src }: { src: string }) => {
  return src;
};

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);

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
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 text-gray-800 flex items-center justify-center">
          <FaStickyNote className="mr-2" /> Son Notlar
        </h1>
        <div className="flex justify-end mb-4">
          <Link
            href="/new-post"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Yeni Yazı Ekle
          </Link>
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
                        <span className="text-blue-600 font-medium flex items-center">
                          {post.category === "Film" && (
                            <FaFilm className="mr-1" />
                          )}
                          {post.category === "Dizi" && (
                            <FaTv className="mr-1" />
                          )}
                          {post.category === "Kitap" && (
                            <FaBook className="mr-1" />
                          )}
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
