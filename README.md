# DigyNotes

Film, dizi, oyun ve kitap notlarını takip etmek için kişisel dijital not defteri. Her içerik için puan, yönetmen/yazar/geliştirici, yıl, kapak görseli, etiket ve zengin metin incelemesi kaydedebilirsin. Sosyal takip sistemi, kişiselleştirilmiş akış ve keşif sayfasıyla topluluğa bağlan.

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
| Film/Dizi API | TMDB (The Movie Database) |
| Oyun API | RAWG Video Games Database |

---

## Özellikler

### Temel

- **Kullanıcı Hesabı** — Kayıt ol, giriş yap; her kullanıcı yalnızca kendi notlarını görür
- **Not Oluştur** — Başlık, kategori, yönetmen/yazar/geliştirici, yıl, kapak görseli, izleme durumu ve zengin metin içeriği
- **Puan Sistemi** — 0–5 arası, 0.5 hassasiyetinde yıldız puanı
- **Dinamik Kategoriler** — Kategori ekle, filtrele ve sil (kullanıcıya özel)
- **Durum Etiketi** — İzlendi / İzleniyor / İzlenecek / Bırakıldı gibi durum takibi
- **Not Düzenle / Sil** — Tam CRUD desteği
- **Dark Premium UI** — Mavi tonlu koyu tema, gold aksan

### Medya Kategorileri

- **Film** — TMDB entegrasyonuyla otomatik poster, yönetmen, yıl ve TMDB puanı doldurma
- **Dizi** — TMDB ile dizi arama ve bilgi doldurma
- **Oyun** — RAWG veritabanıyla oyun arama, kapak ve geliştirici doldurma
- **Kitap** — Manuel kitap kaydı

### Sosyal & Keşif

- **Sosyal Takip** — Diğer kullanıcıları takip et / takibi bırak
- **Akış (Feed)** — Takip ettiğin kullanıcıların son notlarını gör
- **Öneriler** — Etiket geçmişine dayalı kişiselleştirilmiş not önerileri
- **Keşfet** — Trend etiketler, popüler notlar ve kullanıcı keşfi
- **Herkese Açık Profil** — `username`, biyografi ve avatar ile profil sayfası
- **Topluluk İstatistikleri** — Aynı içeriği kaç kişinin kaydettiğini gör

### Organizasyon

- **Global Tag Sistemi** — Notlara etiket ekle, etikete göre filtrele; `/tag/[name]` sayfaları
- **Arama & Sıralama** — Notlarda arama, tarihe/puana göre sıralama

### Landing Page

- Giriş yapmamış kullanıcılar için animasyonlu tanıtım sayfası

---

## Kurulum (Lokal)

### Gereksinimler

- Node.js 18+
- Neon hesabı (veya herhangi bir PostgreSQL instance)
- TMDB API anahtarı (film/dizi araması için)
- RAWG API anahtarı (oyun araması için)

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

# Medya arama (isteğe bağlı — olmadan form çalışır ama arama devre dışı)
NEXT_PUBLIC_TMDB_API_KEY="tmdb-api-anahtarin"
NEXT_PUBLIC_RAWG_API_KEY="rawg-api-anahtarin"
```

> `NEXTAUTH_SECRET` için: `openssl rand -base64 32`
>
> TMDB anahtarı için: [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api)
>
> RAWG anahtarı için: [rawg.io/apidocs](https://rawg.io/apidocs)

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
│   │   │   ├── [...nextauth]/      # NextAuth handler
│   │   │   └── register/           # Kayıt endpoint'i
│   │   ├── posts/                  # GET, POST /api/posts
│   │   │   ├── [id]/               # GET, PUT, DELETE /api/posts/:id
│   │   │   └── related/            # İlgili notlar
│   │   ├── categories/             # GET, POST /api/categories
│   │   │   └── [id]/               # DELETE /api/categories/:id
│   │   ├── tags/                   # GET /api/tags (autocomplete)
│   │   ├── follows/                # GET, POST, DELETE /api/follows
│   │   ├── feed/                   # GET /api/feed (takip akışı)
│   │   ├── recommendations/        # GET /api/recommendations
│   │   ├── public/posts/           # GET /api/public/posts (herkese açık)
│   │   ├── community/stats/        # GET /api/community/stats
│   │   └── users/
│   │       ├── me/                 # GET, PUT /api/users/me
│   │       ├── search/             # GET /api/users/search
│   │       └── [username]/         # GET /api/users/:username
│   ├── category/[id]/              # Kategoriye göre filtrelenmiş notlar
│   ├── tag/[name]/                 # Etikete göre filtrelenmiş herkese açık notlar
│   ├── feed/                       # Takip akışı (korumalı)
│   ├── recommended/                # Kişisel öneriler (korumalı)
│   ├── discover/                   # Keşfet sayfası (herkese açık)
│   ├── profile/
│   │   ├── [username]/             # Herkese açık profil sayfası
│   │   └── settings/               # Profil ayarları (korumalı)
│   ├── login/                      # Giriş sayfası
│   ├── register/                   # Kayıt sayfası
│   ├── notes/                      # Ana uygulama sayfası (korumalı)
│   ├── posts/[id]/                 # Not detay sayfası
│   │   └── edit/                   # Not düzenleme formu
│   ├── new-post/                   # Yeni not oluşturma formu
│   └── page.tsx                    # Landing page (herkese açık)
├── components/
│   ├── AppShell.tsx                # Navigasyon + layout (alt tab bar dahil)
│   ├── ConditionalAppShell.tsx     # Landing/auth sayfalarında AppShell'i gizler
│   ├── SessionProviderWrapper.tsx
│   ├── MediaSearch.tsx             # TMDB & RAWG medya arama bileşeni
│   ├── StarRating.tsx              # İnteraktif yıldız puanı (0.5 hassasiyet)
│   ├── StatusBadge.tsx             # İzleme durumu etiketi
│   ├── TagInput.tsx                # Etiket ekleme, debounced autocomplete
│   ├── TagBadge.tsx                # Tıklanabilir etiket gösterimi
│   ├── UserCard.tsx                # Kullanıcı keşif kartı
│   ├── FollowButton.tsx            # Takip et / bırak butonu
│   ├── CommunityStatsCard.tsx      # Topluluk istatistik kartı
│   ├── PostsList.tsx
│   ├── SortFilterBar.tsx
│   ├── SearchBar.tsx
│   ├── AddCategoryModal.tsx
│   └── ConfirmModal.tsx
├── lib/
│   ├── prisma.ts                   # PrismaClient singleton (PrismaPg adapter)
│   ├── auth.ts                     # NextAuth konfigürasyonu
│   └── categories.ts               # FIXED_CATEGORIES sabit listesi
├── middleware.ts                   # Korumalı rotalar
└── types/
    ├── index.ts                    # Post, Category, Tag, User arayüzleri
    └── next-auth.d.ts              # Session tip genişletmesi
```

---

## Production Deployment (Vercel)

1. Projeyi Vercel'e deploy et
2. **Settings → Environment Variables** bölümüne şunları ekle:

| Key | Değer |
| --- | --- |
| `DATABASE_URL` | Neon connection string |
| `NEXTAUTH_SECRET` | Güçlü bir secret (lokal ile aynı olabilir) |
| `NEXTAUTH_URL` | `https://SENIN-ADRESIN.vercel.app` |
| `NEXT_PUBLIC_TMDB_API_KEY` | TMDB API anahtarın |
| `NEXT_PUBLIC_RAWG_API_KEY` | RAWG API anahtarın |

1. **Deployments → Redeploy** ile yeniden deploy et
