'use client'

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const content = `# Inception

**Yönetmen**: Christopher Nolan  
**Yıl**: 2010  
**IMDB**: 8.8

Rüyalar içinde rüyalar konseptiyle zihinleri büken, görsel efektleri ve karmaşık hikaye anlatımıyla sinema tarihine damga vuran bir başyapıt.

## Hikaye

Dom Cobb (Leonardo DiCaprio) çok yetenekli bir hırsızdır. Uzmanlık alanı, zihnin en savunmasız olduğu rüya görme anında, bilinçaltının derinliklerindeki değerli sırları çekip çıkarmak ve onları çalmaktır. Bu ender rastlanan yeteneği, onu kurumsal casusluğun tehlikeli yeni dünyasında aranan bir oyuncu yapmıştır. Ancak aynı zamanda bu durum onu uluslararası bir kaçak yapmış ve sevdiği her şeye mal olmuştur.

## Teknik

Christopher Nolan'ın yönetmenliği, karmaşık hikayeyi kusursuz bir şekilde anlatıyor. Hans Zimmer'in müzikleri filmin atmosferini mükemmel bir şekilde tamamlıyor. Görsel efektler, özellikle şehrin katlanması ve yerçekimsiz otel koridoru sahneleri, sinema tarihinin en etkileyici sahneleri arasında.

## Oyunculuklar

Leonardo DiCaprio (Dom Cobb), Joseph Gordon-Levitt (Arthur), Ellen Page (Ariadne) ve diğer oyuncular karakterlerine derinlik katmayı başarıyor. Özellikle DiCaprio'nun canlandırdığı Cobb karakterinin iç çatışmaları ve geçmişiyle yüzleşmesi etkileyici.

## Sonuç

Inception, sadece bir bilim kurgu filmi değil, aynı zamanda insan zihninin derinliklerine inen felsefi bir yolculuk. Film, gerçeklik ve rüya arasındaki çizgiyi bulanıklaştırırken, izleyiciyi düşünmeye ve sorgulamaya itiyor. Teknik mükemmelliği, etkileyici oyunculukları ve derin hikayesiyle kesinlikle izlenmesi gereken bir başyapıt.

> "Bir fikir, insan zihninde kök saldığında, en tehlikeli virüsten bile daha bulaşıcıdır." - Cobb`;

export default function InceptionPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="relative w-full h-[40vh] overflow-hidden group">
        <Image
          src="https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_.jpg"
          alt="Inception"
          fill
          className="object-cover object-center group-hover:scale-110 transition-transform duration-300"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <Link href="/categories/movies" className="text-sm hover:underline mb-4 inline-block">
            ← Filmlere Dön
          </Link>
          <h1 className="text-4xl font-bold mb-2">Inception</h1>
          <div className="flex items-center space-x-4 text-sm">
            <span>2010</span>
            <span>•</span>
            <span>Christopher Nolan</span>
            <span>•</span>
            <span className="text-yellow-400">★ 8.8</span>
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