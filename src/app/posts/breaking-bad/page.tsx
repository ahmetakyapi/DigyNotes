'use client'
import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const content = `# Breaking Bad

**Yaratıcı**: Vince Gilligan  
**Yayın**: 2008-2013  
**IMDB**: 9.5

Sıradan bir kimya öğretmeninin, kanser teşhisi sonrası ailesinin geleceğini güvence altına almak için suç dünyasına giriş hikayesi. Televizyon tarihinin en iyi yapımlarından biri.

## Hikaye

Walter White (Bryan Cranston), lise kimya öğretmenidir. 50. yaş gününde akciğer kanseri olduğunu öğrenir. Hamile eşi ve serebral palsi hastası oğluna yeterli miras bırakabilmek için, eski öğrencisi Jesse Pinkman (Aaron Paul) ile birlikte metamfetamin üretmeye başlar. Ancak zamanla işler kontrolden çıkar ve Walter, "Heisenberg" kod adıyla tanınan tehlikeli bir suç lorduna dönüşür.

## Karakter Gelişimi

Dizinin en güçlü yanı karakter gelişimi. Walter White'ın "Mr. Chips'ten Scarface'e" dönüşümü, televizyon tarihinin en etkileyici karakter gelişimlerinden biri. Jesse Pinkman'ın olgunlaşması, Skyler'ın durumla başa çıkma çabaları ve Hank'in araştırması, her karakter derinlikli ve inandırıcı.

## Prodüksiyon

Vince Gilligan'ın yaratıcılığı ve yönetmenliği kusursuz. New Mexico'nun çöl manzaraları, gerilimi artıran kamera açıları ve renk paleti, hikayeyi görsel olarak da destekliyor. Her bölüm sinematik kalitede çekilmiş.

## Oyunculuklar

Bryan Cranston'ın Walter White performansı, televizyon tarihinin en iyi performanslarından biri. Aaron Paul'un Jesse Pinkman'ı, Bob Odenkirk'ün Saul Goodman'ı ve Giancarlo Esposito'nun Gus Fring'i unutulmaz karakterler arasında.

## Sonuç

Breaking Bad, ahlaki çöküşün, güç arzusunun ve kararların sonuçlarının mükemmel bir incelemesi. Her sezon kendini aşan kalitesi, unutulmaz karakterleri ve vurucu finaliyle televizyon tarihinin en iyi dizilerinden biri olmayı fazlasıyla hak ediyor.

> "I am the one who knocks!" - Walter White
> 
> "Yeah, science!" - Jesse Pinkman`;

export default function BreakingBadPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="relative w-full h-[40vh] overflow-hidden group">
        <Image
          src="https://m.media-amazon.com/images/M/MV5BYmQ4YWMxYjUtNjZmYi00MDQ1LWFjMjMtNjA5ZDdiYjdiODU5XkEyXkFqcGdeQXVyMTMzNDExODE5._V1_.jpg"
          alt="Breaking Bad"
          fill
          className="object-cover object-center group-hover:scale-110 transition-transform duration-300"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <Link href="/categories/tv-shows" className="text-sm hover:underline mb-4 inline-block">
            ← Dizilere Dön
          </Link>
          <h1 className="text-4xl font-bold mb-2">Breaking Bad</h1>
          <div className="flex items-center space-x-4 text-sm">
            <span>2008-2013</span>
            <span>•</span>
            <span>Vince Gilligan</span>
            <span>•</span>
            <span className="text-yellow-400">★ 9.5</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <article className="prose prose-lg max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </article>
      </div>
    </main>
  )
} 