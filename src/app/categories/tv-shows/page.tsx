"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { FaTv } from "react-icons/fa";

const tvShows = [
  {
    title: "Breaking Bad",
    creator: "Vince Gilligan",
    years: "2008-2013",
    rating: "9.5",
    excerpt:
      "Vince Gilligan'ın yarattığı bu kült dizi, kanser teşhisi konan bir kimya öğretmeninin, ailesinin geleceğini güvence altına almak için metamfetamin üretmeye başlamasıyla değişen hayatını konu alıyor...",
    slug: "/posts/breaking-bad",
    image:
      "https://m.media-amazon.com/images/M/MV5BYmQ4YWMxYjUtNjZmYi00MDQ1LWFjMjMtNjA5ZDdiYjdiODU5XkEyXkFqcGdeQXVyMTMzNDExODE5._V1_.jpg",
  },
  {
    title: "Better Call Saul",
    creator: "Vince Gilligan, Peter Gould",
    years: "2015-2022",
    rating: "9.0",
    excerpt:
      "Breaking Bad'in spin-off'u olan dizi, Jimmy McGill'in Saul Goodman'a dönüşüm hikayesini anlatıyor...",
    slug: "/posts/better-call-saul",
    image:
      "https://m.media-amazon.com/images/M/MV5BZDA4YmE0OTYtMmRmNS00Mzk2LTlhM2MtNjk4NzBjZGE1MmIyXkEyXkFqcGdeQXVyMTMzNDExODE5._V1_.jpg",
  },
  {
    title: "True Detective",
    creator: "Nic Pizzolatto",
    years: "2014-2024",
    rating: "8.9",
    excerpt:
      "Her sezonunda farklı bir suç hikayesini anlatan antoloji dizisi, karanlık ve gizemli atmosferiyle dikkat çekiyor...",
    slug: "/posts/true-detective",
    image:
      "https://m.media-amazon.com/images/M/MV5BMmRlYmE0Y2UtNDk2Yi00NzczLWEwZTEtZmE2OTcyYzcxYmU5XkEyXkFqcGdeQXVyNTMxMjgxMzA@._V1_.jpg",
  },
];

export default function TvShowsPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-8 sm:mb-12 text-gray-800 flex items-center justify-center">
          <FaTv className="mr-2" /> Diziler
        </h1>
        <hr className="mb-6 sm:mb-8" />

        <div className="space-y-4 sm:space-y-6 lg:space-y-8">
          {tvShows.map((show, index) => (
            <Link key={index} href={show.slug} className="block group">
              <article className="bg-white rounded-lg sm:rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
                <div className="flex flex-col sm:flex-row">
                  <div className="w-full sm:w-1/3 relative h-[200px] sm:h-[300px] overflow-hidden">
                    <Image
                      src={show.image}
                      alt={show.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                      priority={index === 0}
                    />
                  </div>
                  <div className="w-full sm:w-2/3 p-4 sm:p-6 lg:p-8 flex flex-col">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-500 mb-2 sm:mb-4">
                      <h2 className="text-xl sm:text-2xl font-bold group-hover:text-blue-600 transition-colors mb-2 sm:mb-0">
                        {show.title}
                      </h2>
                      <div className="flex items-center space-x-4">
                        <span>{show.years}</span>
                        <span>•</span>
                        <span className="text-yellow-500">★ {show.rating}</span>
                      </div>
                    </div>
                    <div className="text-gray-600 mb-2 sm:mb-4">
                      Yaratıcı: {show.creator}
                    </div>
                    <p className="text-gray-600 leading-relaxed line-clamp-3 sm:line-clamp-4">
                      {show.excerpt}
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
