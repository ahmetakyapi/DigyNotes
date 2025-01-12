'use client'
import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FaBook } from 'react-icons/fa'

const books = [
  {
    title: "1984",
    author: "George Orwell",
    year: "1949",
    rating: "4.7",
    excerpt: "George Orwell'in distopik başyapıtı, gözetim toplumunun ve totaliter rejimin en çarpıcı tasvirlerinden birini sunuyor. Oceania'da yaşayan Winston Smith'in hikayesi, günümüz dünyasında bile çarpıcı paralellikler taşıyor...",
    slug: "/posts/1984",
    image: "https://m.media-amazon.com/images/I/71kxa1-0mfL._AC_UF1000,1000_QL80_.jpg"
  },
  {
    title: "Suç ve Ceza",
    author: "Fyodor Dostoyevski",
    year: "1866",
    rating: "4.8",
    excerpt: "İnsanın karanlık yönlerini ve vicdanın sınırlarını sorgulayan bu başyapıt, Raskolnikov'un psikolojik çöküşünü ve yeniden doğuşunu anlatıyor...",
    slug: "/posts/suc-ve-ceza",
    image: "https://m.media-amazon.com/images/I/81EcXiV-9WL._AC_UF1000,1000_QL80_.jpg"
  },
  {
    title: "Yüzüklerin Efendisi",
    author: "J.R.R. Tolkien",
    year: "1954",
    rating: "4.9",
    excerpt: "Fantastik edebiyatın temel taşlarından biri olan bu epik seri, Orta Dünya'da geçen büyük bir mücadeleyi anlatıyor...",
    slug: "/posts/yuzuklerin-efendisi",
    image: "https://m.media-amazon.com/images/I/71jLBXtWJWL._AC_UF1000,1000_QL80_.jpg"
  }
]

export default function BooksPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-12">

        <h1 className="text-3xl font-bold text-center mb-12 text-gray-800 flex items-center justify-center">
          <FaBook className="mr-2" /> Kitaplar
        </h1> <hr /> <br />
        
        <div className="space-y-8">
          {books.map((book, index) => (
            <Link key={index} href={book.slug} className="block group">
              <article className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
                <div className="md:flex">
                  <div className="md:w-1/3 relative h-[300px] overflow-hidden">
                    <Image
                      src={book.image}
                      alt={book.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                      priority={index === 0}
                    />
                  </div>
                  <div className="md:w-2/3 p-8 flex flex-col">
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <h2 className="text-2xl font-bold group-hover:text-blue-600 transition-colors">
                        {book.title}
                      </h2>
                      <div className="flex items-center space-x-4">
                        <span>{book.year}</span>
                        <span>•</span>
                        <span className="text-yellow-500">★ {book.rating}</span>
                      </div>
                    </div>
                    <div className="text-gray-600 mb-4">
                      Yazar: {book.author}
                    </div>
                    <p className="text-gray-600 leading-relaxed line-clamp-4">{book.excerpt}</p>
                    <div className="mt-4 text-blue-600 font-medium group-hover:underline">İncelemeyi Oku →</div>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
} 