---
stepsCompleted:
  - "step-01-init.md"
  - "step-02-discovery.md"
  - "step-02b-vision.md"
  - "step-02c-executive-summary.md"
  - "step-03-success.md"
  - "step-04-journeys.md"
  - "step-05-domain.md"
  - "step-06-innovation.md"
  - "step-07-project-type.md"
  - "step-08-scoping.md"
  - "step-09-functional.md"
  - "step-10-nonfunctional.md"
  - "step-11-polish.md"
  - "step-11-complete.md"
  - "step-12-complete.md"
inputDocuments:
  - "README.md"
  - "CLAUDE.md"
  - "ERRORS.md"
  - "planning-artifacts/project-context.md"
workflowType: "prd"
status: "complete"
lastStep: 12
completedAt: "2026-03-01"
documentCounts:
  briefCount: 0
  researchCount: 0
  brainstormingCount: 0
  projectDocsCount: 4
---

# Product Requirements Document - DigyNotes

**Author:** Ahmet  
**Date:** 2026-03-01  
**Document Type:** Brownfield baseline PRD

## Executive Summary

DigyNotes; film, dizi, oyun, kitap ve gezi odaklı kişisel not tutmayı sosyal keşif, takip, koleksiyon, istek listesi ve topluluk etkileşimi ile birleştiren bir dijital not defteridir. Ürün bugün çalışan bir Next.js uygulaması olarak mevcut durumdadır; bu PRD'nin amacı yeni bir ürün tanımlamak değil, mevcut ürünün kapsamını, davranış kurallarını ve gelecek geliştirme hattı için resmi ürün çerçevesini sabitlemektir.

Bu doküman, sonraki BMAD adımlarında üretilecek architecture, epics/stories ve quick-spec çalışmalarının referans kaynağıdır. Öncelik, kullanıcıların medya geçmişini düzenli tutabilmesi, içerik üretimini kolaylaştırmak, sosyal keşfi güçlendirmek ve mevcut brownfield yapıyı güvenli şekilde genişletebilmektir.

## Product Vision

DigyNotes'un vizyonu, kullanıcıların tükettikleri içerikleri yalnızca listeledikleri değil; değerlendirdikleri, bağlamlandırdıkları, organize ettikleri ve toplulukla ilişkilendirdikleri kişisel bir kültür hafızası platformu olmaktır.

Ürün şu üç temel değeri sağlamalıdır:

1. Kişisel hafıza: Kullanıcı kendi medya geçmişini kaybetmeden saklayabilmeli.
2. Yapılandırılmış ifade: Notlar yalnızca serbest metin değil; kategori, puan, durum, etiket, konum ve görsel gibi yapılandırılmış alanlarla tutulabilmeli.
3. Sosyal bağlam: Kullanıcı, kendi arşivini topluluktan kopmadan takip, keşif, öneri ve istatistik katmanlarıyla zenginleştirebilmeli.

## Success Criteria

Bu brownfield PRD için başarı kriterleri, ürünün mevcut yönünü koruyup genişletmeye uygun hale getirilmesi üzerinden tanımlanır:

- Kullanıcı, birkaç adım içinde yeni bir not oluşturabilmeli ve düzenleyebilmelidir.
- Kategori, etiket, durum, koleksiyon, bookmark ve wishlist gibi organizasyon katmanları birlikte çalışmalıdır.
- Sosyal akış, profil, öneri ve keşif yüzeyleri kişisel not deneyimini tamamlamalıdır.
- Admin ve moderasyon yüzeyi sistem sağlığı için yeterli temel kontrolü sunmalıdır.
- Yeni geliştirmeler, mevcut auth, Prisma, kategori normalizasyonu ve UI kurallarıyla çakışmadan ilerleyebilmelidir.
- Ürün kararları bundan sonra PRD -> architecture -> story hattında izlenebilir hale gelmelidir.

## User Segments

### 1. Düzenli Arşivleyici

Film, dizi, oyun, kitap veya gezi deneyimlerini düzenli kaydetmek isteyen; puan, yorum, durum ve etiket kullanımına önem veren ana kullanıcı kitlesi.

### 2. Sosyal Keşif Kullanıcısı

Başkalarının ne izlediğini, okuduğunu veya kaydettiğini görmek; profil, takip, keşfet ve öneriler üzerinden yeni içerik bulmak isteyen kullanıcı.

### 3. Güç Kullanıcısı

Koleksiyonlar, istatistikler, yıl özeti, bookmark ve wishlist gibi yardımcı araçları yoğun kullanan; içeriğini uzun vadeli bir bilgi arşivine dönüştüren kullanıcı.

### 4. Yönetici

Kullanıcı, içerik ve sistem ayarları üzerinde kontrol gerektiren admin rolü.

## Core User Journeys

### Journey 1: Kayıt ve İlk Not

Kullanıcı kayıt olur, giriş yapar, yeni not ekranına geçer, medya arama veya manuel giriş ile içeriği seçer, puan ve notunu girer, kaydeder ve ana arşivinde görür.

### Journey 2: İçerik Geçmişini Düzenleme

Kullanıcı mevcut notlarını arar, kategori veya etikete göre filtreler, duruma göre ayırır, gerekirse notu düzenler veya koleksiyona ekler.

### Journey 3: Topluluk Üzerinden Keşif

Kullanıcı herkese açık profilleri, keşfet ekranını, önerileri veya takip akışını inceler; yeni bir içerik bulur; kendi listesine ekler ya da wishlist'e atar.

### Journey 4: Uzun Vadeli Takip

Kullanıcı bookmark, wishlist, collections, stats ve year-in-review ekranları üzerinden medya tüketim alışkanlıklarını zaman içinde takip eder.

### Journey 5: Yönetim ve Güvenlik

Admin kullanıcı, problemli içerik veya kullanıcı davranışlarını takip eder; gerekli ayar ve moderasyon işlemlerini yönetir.

## Brownfield Context

DigyNotes aktif bir brownfield web uygulamasıdır. Mevcut sistem:

- Next.js App Router tabanlıdır.
- PostgreSQL + Prisma ile veri saklar.
- NextAuth credentials + JWT ile kimlik doğrulama yapar.
- Kişisel not deneyimi ile sosyal özellikleri tek ürün içinde birleştirir.
- Public, authenticated ve admin yüzeylerini aynı kod tabanında barındırır.
- PWA ve mobil kullanım yönünde optimize edilmiş kullanıcı akışları içerir.

Bu nedenle tüm yeni gereksinimler, mevcut veri modeli ve route yapısını bozmayacak şekilde evrimsel olarak tasarlanmalıdır.

## Product Scope

### In Scope

- Kişisel not oluşturma, güncelleme, silme ve görüntüleme
- Medya türüne göre alan uyarlaması
- Medya arama ile veri ön-doldurma
- Etiket, kategori, durum ve puanlama sistemleri
- Profil, takip, akış, öneri ve keşif deneyimi
- Bookmark, wishlist, collections ve istatistik yüzeyleri
- Bildirimler, yorumlar ve beğeni temelli topluluk etkileşimi
- Admin yönetimi ve temel sistem ayarları
- SEO/public profile/tag/public content yüzeyleri

### Out of Scope

- Ödeme, abonelik veya premium üyelik sistemi
- Gerçek zamanlı chat veya canlı feed altyapısı
- Harici takvim, Goodreads, Letterboxd, Steam gibi tam çift yönlü senkronizasyonlar
- Çok kiracılı kurum/ekip workspace modeli
- Native iOS/Android uygulama

## Domain Model Summary

Ana domain varlıkları:

- `User`
- `Post`
- `Category`
- `Tag` / `PostTag`
- `Follow`
- `Comment`
- `PostLike`
- `Bookmark`
- `Collection` / `CollectionPost`
- `Wishlist`
- `Notification`
- `ActivityLog`
- `SiteSettings`

Temel domain davranışları:

- Her not bir kullanıcı bağlamında saklanır.
- Kategori string tabanlıdır ve alias/normalize mantığı ile ele alınır.
- Etiketler globaldir ve join table üzerinden bağlanır.
- Sosyal ilişkiler follower/following üzerinden kurulur.
- Organizasyon katmanları bookmark, collection ve wishlist ile ayrıştırılır.

## Project Type Requirements

DigyNotes, aşağıdaki tipleri birlikte taşıyan bir üründür:

- İçerik tabanlı consumer web app
- Authenticated personal productivity app
- Social discovery platform
- Admin yüzeyi olan brownfield full-stack web product

Bu hibrit yapı şu ürün gereksinimlerini doğurur:

- Public ve protected yüzeyler net biçimde ayrılmalıdır.
- Kişisel veri ile herkese açık içerik ayrımı davranış seviyesinde korunmalıdır.
- Veri modeli; içerik, ilişki ve organizasyon katmanlarını birlikte desteklemelidir.
- Yeni özellikler, tekil “not uygulaması” bakışıyla değil; çok yüzeyli ürün mimarisiyle değerlendirilmelidir.

## Functional Requirements

### FR-01 Account and Identity

- Kullanıcı kayıt, giriş ve oturum yönetimi desteklenmelidir.
- Kullanıcı profili; ad, kullanıcı adı, bio, avatar ve görünürlük bilgilerini taşımalıdır.
- Admin ve banned kullanıcı durumları sistem davranışını etkileyebilmelidir.

### FR-02 Personal Notes

- Kullanıcı yeni not oluşturabilmeli, mevcut notu düzenleyebilmeli ve silebilmelidir.
- Not, en az başlık, kategori, görsel, özet, içerik ve tarih bilgilerini içermelidir.
- Not üzerinde puan, durum, creator, years, spoiler, external rating ve görsel kadraj alanları desteklenmelidir.

### FR-03 Category and Tagging

- Sistem sabit kategori seti ve alias normalizasyonu ile çalışmalıdır.
- Kullanıcı notları etiketleyebilmeli ve etiketler global düzeyde yeniden kullanılabilmelidir.
- Etiket ve kategori tabanlı listeleme, filtreleme ve keşif desteklenmelidir.

### FR-04 Media Enrichment

- Film, dizi ve oyun gibi alanlarda harici medya araması ile veri ön-doldurma sağlanmalıdır.
- Kitap ve diğer kategorilerde manuel giriş desteklenmelidir.
- Gezi kategorisi için konum odaklı alanlar desteklenmelidir.

### FR-05 Social Graph

- Kullanıcılar birbirini takip edebilmeli ve takibi bırakabilmelidir.
- Profil sayfalarında takip/follower görünürlüğü ve listeleme desteklenmelidir.

### FR-06 Community Interaction

- Notlar için yorum ve beğeni mekanizmaları bulunmalıdır.
- Topluluk istatistikleri, aynı içeriği kaç kişinin kaydettiği gibi bağlamsal sinyaller sunmalıdır.
- Etkileşimler gerektiğinde bildirim üretebilmelidir.

### FR-07 Discovery and Recommendation

- Takip akışı, öneriler ve keşfet sayfası ayrı kullanım amaçlarına hizmet etmelidir.
- Kullanıcı arama, herkese açık profil keşfi ve popüler/ilgili içerik yüzeyleri bulunmalıdır.

### FR-08 Organization Layer

- Bookmark, wishlist ve collection kavramları birbirinden ayrı ama tamamlayıcı işlevler sunmalıdır.
- Kullanıcı istediği içeriği sonra okumak/izlemek/kaydetmek için wishlist'e ekleyebilmelidir.
- Kullanıcı özel koleksiyonlar oluşturup notlarını gruplayabilmelidir.

### FR-09 Insights and Review

- İstatistikler ve yıl özeti gibi özet ekranlar kullanıcıya tüketim davranışlarını göstermelidir.
- Not detayları ve listeleri, kullanıcının kendi arşivini anlamlı biçimde gözden geçirmesine yardımcı olmalıdır.

### FR-10 Search and Filtering

- Kullanıcı notlarını arayabilmeli, kategoriye göre filtreleyebilmeli, etikete göre daraltabilmeli ve farklı sıralamalar uygulayabilmelidir.
- Arama yalnızca başlık üzerinde değil, ürünün belirlediği ilgili alanlarda da anlamlı sonuç üretmelidir.

### FR-11 Public Web Surface

- Landing page, public profiles, tag sayfaları ve public posts yüzeyleri ürünün dışa açık vitrini olarak çalışmalıdır.
- Metadata, sitemap, robots ve opengraph üretimi desteklenmelidir.

### FR-12 Admin and Operations

- Admin kullanıcıları kullanıcıları, içerikleri, ayarları ve aktivite verisini yönetebilmelidir.
- Sistem bakım modu ve temel operasyonel kontroller desteklenmelidir.

## Non-Functional Requirements

### NFR-01 Security

- Kimlik doğrulama protected route ve API seviyesinde uygulanmalıdır.
- Kullanıcı içeriği sanitize edilmeden kalıcı depoya yazılmamalıdır.
- Yetkisiz erişimlerde standart JSON hata çıktıları veya login yönlendirmesi tutarlı şekilde çalışmalıdır.

### NFR-02 Data Integrity

- Prisma üzerinden veri ilişkileri tutarlı kalmalıdır.
- Tag, follow, bookmark ve benzeri join/relation yapıları duplicate ve bozuk state üretmemelidir.
- Kategori normalizasyonu yeni geliştirmelerde korunmalıdır.

### NFR-03 Performance

- Yaygın kullanıcı akışlarında algılanan performans iyi olmalıdır.
- Listeleme, filtreleme ve sonsuz scroll/pagination yüzeyleri aşırı veri çekmeden çalışmalıdır.
- Harici medya ve görseller kullanıcı deneyimini bloke etmemelidir.

### NFR-04 UX Consistency

- Arayüz Türkçe kalmalıdır.
- Tasarım dili mevcut DigyNotes visual system ile uyumlu olmalıdır.
- Masaüstü ve mobil deneyim birlikte düşünülmelidir.

### NFR-05 Maintainability

- Yeni geliştirmeler mevcut route, lib ve component ayrımını takip etmelidir.
- PRD, architecture ve project-context dokümanları birlikte güncel tutulmalıdır.
- Tekrarlayan hatalar `ERRORS.md` içinde belgelenmelidir.

### NFR-06 Deployability

- Uygulama Vercel ve PostgreSQL/Neon uyumlu kalmalıdır.
- Gerekli env değişkenleri dokümante ve üretim ortamıyla uyumlu olmalıdır.
- Build süreci Prisma generate + Next build zincirini desteklemelidir.

### NFR-07 Accessibility and Reach

- Temel erişilebilirlik beklentileri, okunabilir kontrast, klavye kullanılabilirliği ve mobil uyum korunmalıdır.
- PWA ve install prompt gibi yüzeyler bozulmadan kalmalıdır.

## Constraints

- Prisma v7 adapter yaklaşımı zorunludur.
- Route koruması middleware üzerinden sağlandığı için API/public davranışları buna göre tasarlanmalıdır.
- Test altyapısı sınırlı olduğu için riskli geliştirmelerde doğrulama yaklaşımı özellikle belirtilmelidir.
- Brownfield yapı nedeniyle radikal veri modeli değişiklikleri kontrollü migration planı olmadan yapılmamalıdır.

## Risks and Open Areas

- Otomatik test kapsamının sınırlı olması regresyon riskini artırır.
- Sosyal, kişisel ve public yüzeylerin aynı repo içinde bulunması kural ihlallerini görünmez hale getirebilir.
- Analytics ve ürün başarısı metriklerinin sistematik ölçümü şu an sınırlı olabilir.
- Public/private içerik sınırları ileride daha ayrıntılı ürün kurallarına ihtiyaç duyabilir.

## Planning Recommendations

Bu PRD sonrasında önerilen sıra:

1. Architecture dokümanını bu PRD'ye referansla üretmek
2. Gerekirse UX specification oluşturmak
3. Epics ve stories listesi çıkarmak
4. Yeni özellikleri quick-spec veya story tabanlı implement etmek

## Final Note

Bu PRD, DigyNotes'un mevcut çalışan ürün kapsamını resmileştiren başlangıç sürümüdür. Bundan sonraki her önemli değişiklik, bu dokümanda tanımlanan ürün yönü ve gereksinimlerle tutarlı olmalıdır.
