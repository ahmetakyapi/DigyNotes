"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { FaFilm } from "react-icons/fa";

const movies = [
  {
    title: "Inception",
    director: "Christopher Nolan",
    year: "2010",
    rating: "8.8",
    excerpt:
      "Christopher Nolan'ın zihin bükücü başyapıtı, rüyaların derinliklerine inen bir ekibin hikayesini anlatıyor...",
    slug: "/posts/inception",
    image:
      "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_.jpg",
  },
  {
    title: "The Shawshank Redemption",
    director: "Frank Darabont",
    year: "1994",
    rating: "9.3",
    excerpt:
      "Andy Dufresne'in umut ve dostluk dolu hikayesi, hapishane duvarları arasında geçen bir özgürlük destanı...",
    slug: "/posts/shawshank-redemption",
    image:
      "https://m.media-amazon.com/images/M/MV5BNDE3ODcxYzMtY2YzZC00NmNlLWJiNDMtZDViZWM2MzIxZDYwXkEyXkFqcGdeQXVyNjAwNDUxODI@._V1_.jpg",
  },
  {
    title: "The Dark Knight",
    director: "Christopher Nolan",
    year: "2008",
    rating: "9.0",
    excerpt:
      "Batman'in Joker ile mücadelesi, Gotham şehrinin kaderini belirleyecek bir kaosa dönüşüyor...",
    slug: "/posts/dark-knight",
    image:
      "https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_.jpg",
  },
];

export default function MoviesPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 text-gray-800 flex items-center justify-center">
          <FaFilm className="mr-2" /> Filmler
        </h1>
        <hr className="mb-6 sm:mb-8" />

        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
          {movies.map((movie, index) => (
            <Link key={index} href={movie.slug} className="block group">
              <article className="bg-white rounded-lg sm:rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
                <div className="flex flex-col sm:flex-row">
                  <div className="w-full sm:w-1/3 relative h-[200px] sm:h-[300px] overflow-hidden">
                    <Image
                      src={movie.image}
                      alt={movie.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                      priority={index === 0}
                    />
                  </div>
                  <div className="w-full sm:w-2/3 p-4 sm:p-6 lg:p-8 flex flex-col">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-500 mb-2 sm:mb-4">
                      <h2 className="text-xl sm:text-2xl font-bold group-hover:text-blue-600 transition-colors mb-2 sm:mb-0">
                        {movie.title}
                      </h2>
                      <div className="flex items-center space-x-4">
                        <span>{movie.year}</span>
                        <span>•</span>
                        <span className="text-yellow-500">
                          ★ {movie.rating}
                        </span>
                      </div>
                    </div>
                    <div className="text-gray-600 mb-2 sm:mb-4">
                      Yönetmen: {movie.director}
                    </div>
                    <p className="text-gray-600 leading-relaxed line-clamp-3 sm:line-clamp-4">
                      {movie.excerpt}
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
      </div>
    </main>
  );
}
