"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  FaFilm,
  FaTv,
  FaBook,
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaTrash,
  FaEdit,
} from "react-icons/fa";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Post = {
  id: string;
  title: string;
  category: string;
  image: string;
  content: string;
  date: string;
  creator?: string;
  years?: string;
  rating?: number;
};

// Custom loader for images
const customLoader = ({ src }: { src: string }) => {
  return src;
};

const renderStars = (rating: number = 0) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) {
      stars.push(<FaStar key={i} className="text-yellow-400" />);
    } else if (i === fullStars + 1 && hasHalfStar) {
      stars.push(<FaStarHalfAlt key={i} className="text-yellow-400" />);
    } else {
      stars.push(<FaRegStar key={i} className="text-yellow-400" />);
    }
  }
  return stars;
};

export default function PostPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const docRef = doc(db, "posts", params.id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setPost({
            id: docSnap.id,
            title: data.title || "",
            category: data.category || "",
            image: data.image || "",
            content: data.content || "",
            date: data.date || "",
            creator: data.creator,
            years: data.years,
            rating: data.rating,
          });
        }
      } catch (error) {
        console.error("Error fetching post:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [params.id]);

  const handleDelete = async () => {
    if (!window.confirm("Bu yazıyı silmek istediğinizden emin misiniz?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const docRef = doc(db, "posts", params.id);
      await deleteDoc(docRef);
      router.push("/"); // Ana sayfaya yönlendir
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Yazı silinirken bir hata oluştu!");
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-2xl text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-2xl text-red-600">İçerik bulunamadı</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="relative w-full h-[30vh] sm:h-[40vh] lg:h-[50vh] overflow-hidden group">
        <Image
          loader={customLoader}
          src={post.image}
          alt={post.title}
          fill
          className="object-cover object-center group-hover:scale-110 transition-transform duration-300"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-8 text-white">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
            <Link
              href={`/categories/${
                post.category === "Film"
                  ? "movies"
                  : post.category === "Dizi"
                  ? "series"
                  : "books"
              }`}
              className="text-sm hover:underline inline-block"
            >
              ←{" "}
              {post.category === "Film"
                ? "Filmlere"
                : post.category === "Dizi"
                ? "Dizilere"
                : "Kitaplara"}{" "}
              Dön
            </Link>
            <div className="flex gap-2">
              <Link
                href={`/posts/${post.id}/edit`}
                className="bg-blue-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base rounded-md hover:bg-blue-700 transition-colors flex items-center"
              >
                <FaEdit className="mr-1 sm:mr-2" /> Düzenle
              </Link>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base rounded-md hover:bg-red-700 transition-colors flex items-center disabled:opacity-50"
              >
                <FaTrash className="mr-1 sm:mr-2" />{" "}
                {isDeleting ? "Siliniyor..." : "Sil"}
              </button>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm">
            <span>{post.years}</span>
            <span className="hidden sm:inline">•</span>
            <span>{post.creator}</span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center">
              {post.category === "Film" && <FaFilm className="mr-1" />}
              {post.category === "Dizi" && <FaTv className="mr-1" />}
              {post.category === "Kitap" && <FaBook className="mr-1" />}
              {post.category}
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center space-x-1">
              {renderStars(post.rating)}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 lg:py-12">
        <article className="prose prose-sm sm:prose lg:prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900 prose-blockquote:text-gray-700 prose-blockquote:border-blue-500">
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </article>
      </div>
    </main>
  );
}
