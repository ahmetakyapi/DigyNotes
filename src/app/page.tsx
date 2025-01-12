import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { FaFilm, FaTv, FaBook, FaStickyNote } from 'react-icons/fa'

const posts = [
  {
    title: "Inception",
    excerpt: "Christopher Nolan'ın zihin bükücü başyapıtı, rüyaların derinliklerine inen bir ekibin hikayesini anlatıyor. Dom Cobb, zihinlere sızarak bilgi çalabilen yetenekli bir hırsızdır. Uzmanlık alanı, zihnin en savunmasız olduğu rüya görme anında, bilinçaltının derinliklerindeki değerli sırları çekip çıkarmak ve onları çalmaktır...",
    category: "Film",
    date: "15 Mart 2024",
    slug: "/posts/inception",
    image: "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_.jpg",
    creator: "Christopher Nolan",
    years: "2010"
  },
  {
    title: "Breaking Bad",
    excerpt: "Vince Gilligan'ın yarattığı bu kült dizi, kanser teşhisi konan bir kimya öğretmeninin, ailesinin geleceğini güvence altına almak için metamfetamin üretmeye başlamasıyla değişen hayatını konu alıyor...",
    category: "Dizi",
    date: "14 Mart 2024",
    slug: "/posts/breaking-bad",
    image: "https://m.media-amazon.com/images/M/MV5BYmQ4YWMxYjUtNjZmYi00MDQ1LWFjMjMtNjA5ZDdiYjdiODU5XkEyXkFqcGdeQXVyMTMzNDExODE5._V1_.jpg",
    creator: "Vince Gilligan",
    years: "2008-2013"
  },
  {
    title: "1984",
    excerpt: "George Orwell'in distopik başyapıtı, gözetim toplumunun ve totaliter rejimin en çarpıcı tasvirlerinden birini sunuyor. Oceania'da yaşayan Winston Smith'in hikayesi, günümüz dünyasında bile çarpıcı paralellikler taşıyor...",
    category: "Kitap",
    date: "13 Mart 2024",
    slug: "/posts/1984",
    image: "https://m.media-amazon.com/images/I/71kxa1-0mfL._AC_UF1000,1000_QL80_.jpg",
    creator: "George Orwell",
    years: "1949"
  }
]

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-center mb-12 text-gray-800 flex items-center justify-center">
          <FaStickyNote className="mr-2" /> Son Notlar
        </h1> <hr /> <br />
        
        <div className="space-y-8">
          {posts.map((post, index) => (
            <Link key={index} href={post.slug} className="block group">
              <article className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
                <div className="md:flex">
                  <div className="md:w-1/3 relative h-[300px] overflow-hidden">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                      priority={index === 0}
                    />
                  </div>
                  <div className="md:w-2/3 p-8 flex flex-col">
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <h2 className="text-2xl font-bold group-hover:text-blue-600 transition-colors">
                        {post.title}
                      </h2>
                      <div className="flex items-center space-x-4">
                        <span className="text-blue-600 font-medium flex items-center">
                          {post.category === 'Film' && <FaFilm className="mr-1" />}
                          {post.category === 'Dizi' && <FaTv className="mr-1" />}
                          {post.category === 'Kitap' && <FaBook className="mr-1" />}
                          {post.category}
                        </span>
                        <span>•</span>
                        <span>{post.creator}</span>
                        <span>•</span>
                        <span>{post.years}</span>
                        <span>•</span>
                        <span>{post.date}</span>
                      </div>
                    </div>
                    <p className="text-gray-600 leading-relaxed line-clamp-6">{post.excerpt}</p>
                    <div className="mt-4 text-blue-600 font-medium group-hover:underline">Devamını Oku →</div>
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
