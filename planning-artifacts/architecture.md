---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - "planning-artifacts/prd.md"
  - "planning-artifacts/project-context.md"
  - "README.md"
  - "CLAUDE.md"
  - "ERRORS.md"
  - "prisma/schema.prisma"
workflowType: "architecture"
project_name: "DigyNotes"
user_name: "Ahmet"
date: "2026-03-01"
lastStep: 8
status: "complete"
completedAt: "2026-03-01"
---

# Architecture Decision Document

Bu doküman, DigyNotes için teknik kararların referans kaynağıdır. Amaç yalnızca mevcut sistemi tarif etmek değil; sonraki geliştirmelerde AI agent'ların ve insanların aynı teknik sınırlar içinde hareket etmesini sağlamaktır.

## 1. Architecture Goals

Temel mimari hedefler:

- Brownfield ürünü güvenli şekilde genişletmek
- Kişisel not, sosyal etkileşim ve public web yüzeylerini tek uygulamada yönetmek
- Veri modelini Prisma üzerinden tutarlı biçimde evrimleştirmek
- UI, auth, API ve veri katmanında mevcut kalıpları korumak
- AI destekli geliştirmelerde tutarlılık sağlayacak kadar açık, fakat aşırı ayrıntıya kaçmayacak kadar yalın olmak

## 2. System Context

DigyNotes, Next.js App Router üzerinde çalışan tam yığın bir web uygulamasıdır.

Ana dış bağımlılıklar:

- PostgreSQL / Neon
- NextAuth credentials authentication
- TMDB API
- RAWG API
- OpenStreetMap tabanlı konum bağlantıları
- Vercel deployment ve analytics

Ana kullanıcı yüzeyleri:

- Public marketing ve SEO yüzeyi
- Authenticated kişisel uygulama yüzeyi
- Sosyal keşif ve profil yüzeyi
- Admin operasyon yüzeyi

## 3. Primary Architecture Decisions

### AD-01: Monolithic Next.js Application

Ürün, ayrı frontend/backend servislerine bölünmeden tek bir Next.js kod tabanı içinde çalışacaktır. UI, server components, API routes ve middleware aynı repoda kalacaktır.

Gerekçe:

- Mevcut sistem zaten bu modelle çalışıyor.
- Ürün boyutu ve ekip yapısı için operasyonel sadelik sağlar.
- AI agent'ların tek bağlam içinde çalışmasını kolaylaştırır.

### AD-02: App Router + Route Handler Pattern

Sunucu tarafı işlemler `src/app/api/**/route.ts` altında route handler yaklaşımıyla sürdürülecektir.

Gerekçe:

- Mevcut kodun tamamı bu kalıp üzerine kuruludur.
- Auth, middleware ve cache davranışı tutarlı biçimde yönetilebilir.

### AD-03: Prisma as the Single Data Access Layer

Tüm veri erişimi `src/lib/prisma.ts` üzerinden dışa verilen tek Prisma client ile yapılacaktır.

Gerekçe:

- Prisma v7 adapter gereksinimi nedeniyle farklı client yaratmak risklidir.
- Data access davranışını merkezileştirir.

### AD-04: Credentials + JWT Session Model

Kimlik doğrulama NextAuth credentials provider ve JWT session strategy ile sürdürülecektir.

Gerekçe:

- Mevcut ürün davranışı budur.
- Session içinde `user.id` taşınması API route tarafını sadeleştirir.

### AD-05: String-Based Category Domain with Normalization

Kategori alanı ayrı relation yerine normalize edilen string tabanlı domain yaklaşımıyla korunacaktır.

Gerekçe:

- Mevcut post modelinin davranışı buna bağlıdır.
- Alias ve label dönüşümleri `src/lib/categories.ts` içinde standardize edilmiştir.

### AD-06: Shared UI Pattern Library Through Existing Components

Yeni UI, mevcut component ve page kalıplarını referans alarak inşa edilecektir; bağımsız mini tasarım sistemleri üretilmeyecektir.

Gerekçe:

- Görsel tutarlılığı korur.
- Brownfield UI regresyonlarını azaltır.

## 4. Logical Architecture

### 4.1 Presentation Layer

Yer:

- `src/app/**`
- `src/components/**`

Sorumluluklar:

- Route bazlı ekranlar
- Client/server component sınırları
- Form akışları
- Navigasyon, shell ve yardımcı UI parçaları

Kurallar:

- Hook kullanan dosyalar `use client` ile başlamalıdır.
- React Quill yalnızca dynamic import ile kullanılmalıdır.
- Tasarım sistemi mevcut CSS variable ve hex palette ile sürdürülmelidir.

### 4.2 Application/API Layer

Yer:

- `src/app/api/**`

Sorumluluklar:

- İstek doğrulama
- Session çözümleme
- Prisma çağrıları
- JSON response üretimi
- İçerik sanitize işlemleri

Kurallar:

- API hataları `{ error: string }` formatında dönmelidir.
- Protected route davranışı middleware ve session kontrolüyle tutarlı olmalıdır.
- İhtiyaç duyulan yerlerde `dynamic = "force-dynamic"` ve `revalidate = 0` kullanılmalıdır.

### 4.3 Domain Utility Layer

Yer:

- `src/lib/**`

Sorumluluklar:

- Auth yapılandırması
- Prisma client
- Kategori normalizasyonu
- Arama yardımcıları
- Post config ve template mantığı
- Harita ve medya yardımcıları
- Rate limiting ve metadata gibi çapraz kesen yetenekler

Kurallar:

- Domain kuralları mümkün olduğunca burada merkezileştirilmelidir.
- Page veya component içinde tekrar domain mantığı yazılmamalıdır.

### 4.4 Data Layer

Yer:

- `prisma/schema.prisma`
- `prisma/migrations/**`

Sorumluluklar:

- Veri modeli tanımı
- Relation ve unique/index kararları
- Migration geçmişi

Kurallar:

- Şema değişikliği sonrası Prisma generate ve dev server restart zorunludur.
- Relation eklemelerinde stale client riskine dikkat edilmelidir.

## 5. Data Architecture

### Core Entities

- `User`: kimlik, profil, rol ve sosyal graph merkezi
- `Post`: ürünün temel içerik birimi
- `Tag` / `PostTag`: global etiketleme sistemi
- `Category`: kullanıcı kategorileri ve legacy davranışları destekleyen katman
- `Follow`: kullanıcılar arası ilişki tablosu
- `Comment`, `PostLike`, `Notification`: topluluk etkileşimi
- `Bookmark`, `Collection`, `Wishlist`: organizasyon araçları
- `ActivityLog`, `SiteSettings`: operasyonel destek varlıkları

### Data Rules

- `Post.userId` ve `Category.userId` nullable legacy alanlardır; yeni kod bunu hesaba katmalıdır.
- Tag isimleri lowercase unique kalmalıdır.
- Collection ve bookmark yapıları bağımsız işlevler sunar; biri diğerinin yerine kullanılmamalıdır.
- Notification ve activity log kayıtları büyüme riski taşır; yeni kullanım alanları eklenirken gereksiz yazım artışı izlenmelidir.

## 6. Integration Architecture

### Authentication

- `src/lib/auth.ts` içinde credentials provider
- JWT callback ile `token.id`
- Session callback ile `session.user.id`
- Middleware matcher ile protected yüzeyler

### Media Providers

- TMDB: film/dizi arama ve metadata ön doldurma
- RAWG: oyun arama ve metadata ön doldurma
- Gezi/harita akışları: koordinat ve OpenStreetMap link üretimi

### Deployment and Hosting

- Vercel hedef deploy ortamıdır.
- PostgreSQL/Neon bağlantısı env tabanlıdır.
- Analytics Vercel üzerinden bağlanmıştır.

## 7. Security and Content Safety

- Oturum gerektiren route ve API'ler middleware ve server session ile korunmalıdır.
- Rich text içerik sanitize edilmeden depoya yazılmamalıdır.
- `.env` ve gizli anahtarlar kod veya dokümana düz metin olarak taşınmamalıdır.
- Admin yüzeyi standart kullanıcı akışlarından ayrı değerlendirilmelidir.
- Public veri ile kullanıcıya özel veri aynı sorgu içinde karışmayacak şekilde tasarlanmalıdır.

## 8. Quality Attributes

### Maintainability

- Yakın dosya örneği yaklaşımı kullanılmalıdır; yeni feature mevcut pattern'e yaslanmalıdır.
- `CLAUDE.md`, `ERRORS.md`, `planning-artifacts/prd.md` ve `planning-artifacts/project-context.md` birlikte yaşayan referans setidir.

### Performance

- Liste ve keşif ekranları gereksiz overfetch yapmamalıdır.
- Harici görseller ve medya verileri UI'yi bloke etmeyecek şekilde ele alınmalıdır.
- Özellikle social/discover yüzeylerinde N+1 sorgu davranışına dikkat edilmelidir.

### Reliability

- Prisma relation değişiklikleri sonrası dev server restart kuralı zorunludur.
- API davranışları auth redirect yerine gerektiğinde deterministik JSON dönecek şekilde tasarlanmalıdır.

### Usability

- Mobil ve masaüstü birlikte düşünülmelidir.
- Uygulama dili Türkçe kalmalıdır.
- Geçiş, loading ve hata durumları görünür olmalıdır.

## 9. Source Tree Strategy

Kalıcı ayrım şu şekilde korunmalıdır:

- `src/app`: route ve page orchestration
- `src/components`: tekrar kullanılabilir UI
- `src/lib`: domain, integration ve helper mantığı
- `src/types`: paylaşılan tipler ve NextAuth augmentation
- `prisma`: veri modeli ve migration geçmişi
- `docs`: kalıcı proje bilgisi
- `planning-artifacts`: planlama ve karar dokümanları
- `implementation-artifacts`: sprint/story çıktıları

## 10. AI Implementation Guardrails

- Yeni kod yazmadan önce ilgili yakın component, API route veya lib dosyası okunmalıdır.
- Kategori davranışı `src/lib/categories.ts` dışına kopyalanmamalıdır.
- Prisma erişimi doğrudan yeni bir helper ile değil mevcut `prisma` singleton üzerinden yapılmalıdır.
- Client-side state sorunlarında hydration, dropdown reopen ve stale data riskleri özellikle kontrol edilmelidir.
- Test altyapısı sınırlı olduğu için her değişiklikte doğrulanan ve doğrulanamayan alan açıkça not edilmelidir.

## 11. Architecture Risks

- Brownfield büyüme ile route ve component sayısının artması tutarlılığı zorlaştırabilir.
- Public/protected/admin yüzeylerinin aynı uygulama içinde bulunması yanlış erişim davranışı riskini artırır.
- Otomatik test eksikliği özellikle refactor ve data model değişikliklerinde maliyetlidir.
- Harici medya servisleri cevap biçimi veya erişim kısıtı değiştirirse UX akışları etkilenebilir.

## 12. Recommended Next Step

Bu architecture dokümanı sonrası önerilen akış:

1. Gerekirse UX design specification üretmek
2. Epics ve stories dökümünü PRD + architecture referansıyla çıkarmak
3. İlk hedef özelliği quick-spec veya doğrudan story olarak tanımlamak
4. Implementasyon sırasında `project-context`, bu architecture dokümanı ve ilgili mevcut kod dosyalarını birlikte kaynak almak

## 13. Final Architecture Position

DigyNotes için teknik strateji; tek repo, tek Next.js uygulaması, merkezileştirilmiş Prisma erişimi, route-handler API yapısı, string-normalized kategori domaini ve mevcut UI kalıplarını koruyan evrimsel geliştirme modelidir. Yeni çalışmalar bu modeli bozmak yerine onu daha açık, test edilebilir ve sürdürülebilir hale getirmelidir.
