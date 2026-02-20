# DigyNotes

Film, dizi ve kitap notlarını takip etmek için kişisel dijital not defteri. Her içerik için puan, yönetmen/yazar, yıl, kapak görseli ve zengin metin incelemesi kaydedebilirsin.

---

## Tech Stack

| Katman | Teknoloji |
| --- | --- |
| Framework | Next.js 14 (App Router) |
| Dil | TypeScript |
| Stil | Tailwind CSS |
| Veritabanı | PostgreSQL (Neon — serverless) |
| ORM | Prisma v7 |
| DB Driver | `@prisma/adapter-pg` |
| Auth | NextAuth v4 (Credentials + JWT) |
| Rich Text | React Quill |
| Toast | react-hot-toast |

---

## Özellikler

- **Kullanıcı Hesabı** — Kayıt ol, giriş yap; her kullanıcı yalnızca kendi notlarını görür
- **Not Oluştur** — Başlık, kategori, yönetmen/yazar, yıl, kapak görseli, izleme durumu, kısa özet ve zengin metin içeriği
- **Puan Sistemi** — 0–5 arası, 0.5 hassasiyetinde yıldız puanı
- **Dinamik Kategoriler** — Kategori ekle, filtrele ve sil (kullanıcıya özel)
- **Durum Etiketi** — İzlendi / İzleniyor / İzlenecek gibi durum takibi
- **Arama & Sıralama** — Notlarda arama ve sıralama
- **Not Düzenle / Sil** — Tam CRUD desteği
- **Dark Premium UI** — Letterboxd/IMDb ilhamıyla koyu tema, gold aksan
- **Landing Page** — Giriş yapmamış kullanıcılar için tanıtım sayfası

---

## Kurulum (Lokal)

### Gereksinimler

- Node.js 18+
- Neon hesabı (veya herhangi bir PostgreSQL instance)

### 1. Bağımlılıkları kur

```bash
npm install
```

### 2. Ortam değişkenlerini ayarla

`.env.local` dosyası oluştur:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require"
NEXTAUTH_SECRET="güçlü-bir-secret-üret"
NEXTAUTH_URL="http://localhost:3000"
```

> `NEXTAUTH_SECRET` için: `openssl rand -base64 32`

### 3. Prisma migration'ı uygula

```bash
npm run db:migrate
```

### 4. Geliştirme sunucusunu başlat

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) adresinden erişebilirsin.

---

## Neon DB Kurulumu

1. [neon.tech](https://neon.tech) üzerinde ücretsiz hesap aç
2. Yeni proje oluştur
3. **Connection Details** → **Connection string**'i kopyala
4. `.env.local` dosyasındaki `DATABASE_URL`'e yapıştır

---

## Kullanışlı Komutlar

```bash
npm run dev          # Geliştirme sunucusu
npm run build        # Production build (prisma generate dahil)
npm run db:migrate   # Yeni migration oluştur ve uygula
npm run db:studio    # Prisma Studio (veritabanı arayüzü)
npm run db:generate  # Prisma client yeniden oluştur
```

---

## Proje Yapısı

```text
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/  # NextAuth handler
│   │   │   └── register/       # Kayıt endpoint'i
│   │   ├── posts/              # GET, POST /api/posts
│   │   │   └── [id]/           # GET, PUT, DELETE /api/posts/:id
│   │   └── categories/         # GET, POST /api/categories
│   │       └── [id]/           # DELETE /api/categories/:id
│   ├── category/[id]/          # Kategoriye göre filtrelenmiş notlar
│   ├── login/                  # Giriş sayfası
│   ├── register/               # Kayıt sayfası
│   ├── notes/                  # Ana uygulama sayfası (korumalı)
│   ├── posts/[id]/             # Not detay sayfası
│   │   └── edit/               # Not düzenleme formu
│   ├── new-post/               # Yeni not oluşturma formu
│   └── page.tsx                # Landing page (herkese açık)
├── components/
│   ├── AppShell.tsx            # Navigasyon + layout
│   ├── ConditionalAppShell.tsx # Landing/auth sayfalarında AppShell'i gizler
│   ├── SessionProviderWrapper.tsx
│   ├── StarRating.tsx          # İnteraktif yıldız puanı (0.5 hassasiyet)
│   ├── StatusBadge.tsx         # İzleme durumu etiketi
│   ├── PostsList.tsx
│   ├── SortFilterBar.tsx
│   ├── SearchBar.tsx
│   ├── AddCategoryModal.tsx
│   └── ConfirmModal.tsx
├── lib/
│   ├── prisma.ts               # PrismaClient singleton (PrismaPg adapter)
│   └── auth.ts                 # NextAuth konfigürasyonu
├── middleware.ts               # Korumalı rotalar
└── types/
    ├── index.ts                # Post, Category arayüzleri
    └── next-auth.d.ts          # Session tip genişletmesi
```

---

## Production Deployment (Vercel)

1. Projeyi Vercel'e deploy et
1. **Settings → Environment Variables** bölümüne şunları ekle:

| Key | Değer |
| --- | --- |
| `DATABASE_URL` | Neon connection string |
| `NEXTAUTH_SECRET` | Güçlü bir secret (lokal ile aynı olabilir) |
| `NEXTAUTH_URL` | `https://SENIN-ADRESIN.vercel.app` |

1. **Deployments → Redeploy** ile yeniden deploy et
