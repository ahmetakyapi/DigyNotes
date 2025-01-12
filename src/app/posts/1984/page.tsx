'use client'
import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const content = `# 1984

**Yazar**: George Orwell  
**Yayın**: 1949  
**Puan**: 4.8

George Orwell'ın distopik başyapıtı, totaliter bir rejimin gözetimi altında yaşayan bir toplumu ve bireysel özgürlük arayışını anlatan çarpıcı bir roman.

## Hikaye

Winston Smith, Okyanusya'nın distopik toplumunda yaşayan sıradan bir vatandaştır. Düşünce Polisi'nin sürekli gözetimi altında, Büyük Birader'in totaliter rejiminde çalışmaktadır. Gerçeği manipüle eden Hakikat Bakanlığı'nda görevli olan Winston, sistemin yalanlarına karşı içten içe isyan eder ve Julia ile yasak bir aşk yaşamaya başlar.

## Yazım Tarzı

Orwell'ın sade ve vurucu üslubu, distopik dünyanın kasvetini ve baskısını ustalıkla yansıtır. Yeni Söylem gibi dil manipülasyonları ve düşünce suçu gibi kavramlar, günümüzde bile geçerliliğini koruyan güçlü metaforlar sunar.

## Temalar

- Totalitarizm ve gözetim toplumu
- Tarih ve gerçeğin manipülasyonu
- Bireysel özgürlük ve düşünce kontrolü
- Teknolojinin baskı aracı olarak kullanımı
- Dilin düşünceyi şekillendirmedeki rolü

## Etki ve Güncellik

1984, yayınlandığı tarihten bu yana distopya türünün en etkili eserlerinden biri olmuştur. "Büyük Birader", "düşünce suçu", "çiftdüşün" gibi kavramlar günlük dile yerleşmiştir. Kitap, günümüzde de gözetim toplumu, mahremiyet ve özgürlük tartışmalarında sıkça referans gösterilmektedir.

## Sonuç

1984, sadece bir distopya romanı değil, insan doğası ve toplum üzerine derin bir incelemedir. Orwell'ın öngörüleri, teknolojinin gelişimiyle birlikte her geçen gün daha da anlam kazanmaktadır.

> "Özgürlük, iki kere ikinin dört ettiğini söyleyebilmektir."
> 
> "Savaş barıştır. Özgürlük köleliktir. Cahillik güçtür."`;

export default function BookPage1984() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="relative w-full h-[40vh] overflow-hidden group">
        <Image
          src="https://m.media-amazon.com/images/I/71kxa1-0mfL._AC_UF1000,1000_QL80_.jpg"
          alt="1984"
          fill
          className="object-cover object-center group-hover:scale-110 transition-transform duration-300"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <Link href="/categories/books" className="text-sm hover:underline mb-4 inline-block">
            ← Kitaplara Dön
          </Link>
          <h1 className="text-4xl font-bold mb-2">1984</h1>
          <div className="flex items-center space-x-4 text-sm">
            <span>1949</span>
            <span>•</span>
            <span>George Orwell</span>
            <span>•</span>
            <span className="text-yellow-400">★ 4.8</span>
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