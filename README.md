# DigyNotes

Film, dizi ve kitap notlarını takip etmek için kişisel dijital not defteri. Her içerik için puan, yönetmen/yazar, yıl, kapak görseli ve zengin metin incelemesi kaydedebilirsin.

---

## Tech Stack

| Katman | Teknoloji |
| --- | --- |
| Framework | Next.js 14 (App Router) |
| Dil | TypeScript |
| Stil | Tailwind CSS |
| Veritabanı | PostgreSQL |
| ORM | Prisma v7 |
| DB Driver | `@prisma/adapter-pg` |
| Rich Text | React Quill |
| Toast | react-hot-toast |

---

## Özellikler

- **Not Oluştur** — Başlık, kategori, yönetmen/yazar, yıl, kapak görseli, kısa özet ve zengin metin içeriği
- **Puan Sistemi** — 0–5 arası, 0.5 hassasiyetinde yıldız puanı
- **Dinamik Kategoriler** — Kategori ekle, filtrele ve sil
- **Not Düzenle / Sil** — Tam CRUD desteği
- **Dark Premium UI** — Letterboxd/IMDb ilhamıyla koyu tema, amber gold aksan

---

## Kurulum

### Gereksinimler

- Node.js 18+
- PostgreSQL 14+ (lokal veya uzak)

### 1. Bağımlılıkları kur

```bash
npm install
```

### 2. Ortam değişkenlerini ayarla

`.env.local` dosyası oluştur:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/digynotes"
```

### 3. Veritabanını hazırla

```bash
# PostgreSQL üzerinde veritabanı ve kullanıcı oluştur
psql postgres -c "CREATE USER digynotes WITH PASSWORD 'sifre';"
psql postgres -c "CREATE DATABASE digynotes OWNER digynotes;"
psql postgres -c "ALTER USER digynotes CREATEDB;"

# Tabloları oluştur
npm run db:migrate
```

### 4. Geliştirme sunucusunu başlat

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) adresinden erişebilirsin.

---

## Docker ile PostgreSQL (Opsiyonel)

Projenin kökünde `docker-compose.yml` mevcuttur. Docker kuruluysa:

```bash
docker compose up -d
npm run db:migrate
npm run dev
```

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
│   │   ├── posts/          # GET, POST /api/posts
│   │   │   └── [id]/       # GET, PUT, DELETE /api/posts/:id
│   │   └── categories/     # GET, POST /api/categories
│   │       └── [id]/       # DELETE /api/categories/:id
│   ├── category/[id]/      # Kategoriye göre filtrelenmiş notlar
│   ├── posts/[id]/         # Not detay sayfası
│   │   └── edit/           # Not düzenleme formu
│   ├── new-post/           # Yeni not oluşturma formu
│   └── page.tsx            # Ana sayfa (tüm notlar)
├── components/
│   ├── StarRating.tsx      # İnteraktif yıldız puanı (0.5 hassasiyet)
│   ├── AddCategoryModal.tsx
│   └── ConfirmModal.tsx
├── lib/
│   └── prisma.ts           # PrismaClient singleton
└── types/
    └── index.ts            # Post, Category arayüzleri
```

---

## Production Deployment

Vercel veya benzeri bir platforma deploy ederken:

1. `DATABASE_URL` ortam değişkenini platforma ekle (Supabase, Railway veya Neon önerilir)
2. Build komutu otomatik olarak `prisma generate && next build` çalıştırır
