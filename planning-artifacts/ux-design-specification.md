---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
inputDocuments:
  - "planning-artifacts/prd.md"
  - "planning-artifacts/architecture.md"
  - "planning-artifacts/project-context.md"
  - "CLAUDE.md"
  - "src/app/globals.css"
  - "src/components/AppShell.tsx"
status: "complete"
lastStep: 14
completedAt: "2026-03-01"
---

# UX Design Specification DigyNotes

**Author:** Ahmet  
**Date:** 2026-03-01

---

## 1. Product Understanding

DigyNotes, kişisel medya ve gezi hafızasını tek bir yerde toplayan; not alma, puanlama, etiketleme, sosyal keşif ve organizasyon araçlarını birlikte sunan bir ürün. UX tarafında temel zorluk, ürünün aynı anda hem kişisel arşiv, hem keşif yüzeyi, hem de hafif sosyal ağ davranışı göstermesi.

Bu UX spesifikasyonu mevcut brownfield ürünü sıfırdan yeniden tasarlamayı değil, mevcut davranışları daha tutarlı, daha anlaşılır ve daha sürtünmesiz hale getirmeyi hedefler.

## 2. Core Experience Definition

DigyNotes deneyiminin merkezinde şu his olmalıdır:

- Hızlı yakalama: Kullanıcı yeni bir notu düşünce hızında girebilmeli.
- Güvenli saklama: Yazdığı şeyin kaybolmayacağından emin olmalı.
- Düzenli arşiv: İçeriğini sonra kolayca bulabileceğini hissetmeli.
- Bağlamsal keşif: Başkalarının içerikleri arasında kaybolmadan kendine uygun şeyler keşfetmeli.

Ana UX hedefi, “çok özellikli ama karışık” his veren bir ürün yerine “yoğun ama okunabilir” his veren bir ürün oluşturmaktır.

## 3. Experience Principles

### 3.1 Capture First

Yeni not oluşturma ve düzenleme akışları, ürünün en hızlı ve en net yüzeyi olmalıdır. Kullanıcıya ilk olarak “arayabileceğim, seçebileceğim, doldurabileceğim ve kaydedebileceğim” duygusu verilmelidir.

### 3.2 Structure Without Friction

Kategori, puan, etiket, durum, konum gibi yapısal alanlar zorlayıcı değil yönlendirici hissettirmelidir.

### 3.3 Personal Before Social

Sosyal yüzeyler kişisel arşivin önüne geçmemeli; kullanıcı önce kendi içeriğini rahat yönetebilmeli, sonra topluluk bağlamı görmelidir.

### 3.4 Dense but Calm

Uygulama bilgi yoğun olabilir; ama görsel ritim, boşluk, tipografi ve kontrast onu sakin göstermelidir.

### 3.5 Consistent Recovery

Boş durumlar, loading, auth düşmesi, hatalı API yanıtları ve ağ kesintileri her yerde aynı güven duygusunu vermelidir.

## 4. Emotional Response Goals

DigyNotes’un hedeflediği duygusal çıktı:

- İlk kullanım: “Bu uygulama bana ait.”
- Sık kullanım: “İçeriklerim burada düzenli.”
- Keşif sırasında: “Yeni bir şey buluyorum ama kontrol bende.”
- Geri dönüp eski notları okurken: “Burası kişisel hafıza alanım.”

Kaçınılacak duygular:

- Görev listesi gibi kuru his
- Aşırı sosyal ağ kaosu
- Yoğun veri kalabalığı nedeniyle yorgunluk
- Form dolduruyormuş hissi

## 5. Inspiration and Anti-Patterns

### Alınacak yapısal ilham

- Medya detay yoğunluğu için Letterboxd/Goodreads tarzı bilgi düzeni
- Kişisel arşiv ve koleksiyon mantığı için Notion benzeri blok düşüncesi değil, sabit bilgi yoğun kart düzeni
- Sosyal keşif için hafif timeline davranışı

### Kaçınılacak anti-patternler

- Genel amaçlı “dashboard” görünümü
- Bir ekranda çok fazla primary action
- Form içinde görünmeyen zorunlu alanlar
- Mobilde alt tab + üst aksiyon + modal çakışması
- Her ekranın farklı visual grammar kullanması

## 6. Design System Strategy

Bu ürün için seçilen yaklaşım: mevcut DigyNotes görsel sisteminin rafine edilmesi.

### Sistem kararları

- Renk yönetimi CSS variables üzerinden sürmeli.
- Açık/koyu tema ayrı ürün gibi davranmamalı; aynı kimliğin iki varyantı olmalı.
- Kartlar gölgeden çok border, yüzey katmanı ve parlaklık farkı ile ayrışmalı.
- Altın vurgu, her yerde değil “karar”, “aktif durum” ve “yeni not” gibi anlamlı noktalarda kullanılmalı.

## 7. Information Architecture

### 7.1 Public Layer

- Landing
- Login/Register
- Public profile
- Tag pages

Amaç: ürünün değerini göstermek ve kayıt/girişe yönlendirmek.

### 7.2 Personal Layer

- Notes
- New Post / Edit Post
- Collections
- Wishlist / Watchlist
- Stats / Year in Review

Amaç: kullanıcının kendi medya hafızasını yönetmesi.

### 7.3 Social Layer

- Feed
- Discover
- Recommended
- Profile social details
- Notifications

Amaç: kişisel arşive sosyal bağlam eklemek.

### 7.4 Operations Layer

- Admin
- Maintenance

Amaç: yönetim ve güvenlik.

## 8. Navigation and Interaction Model

### Global Navigation

- Masaüstünde üst bar + bağlamsal sayfa aksiyonları
- Mobilde alt tab bar, hızlı erişim için korunmalı
- Composer (`/new-post`, `/posts/[id]/edit`) akışlarında dikkat dağıtan global alt tab davranışları bastırılmalı

### Search Behavior

- Search bar global keşif aracı gibi davranmalı
- Notes içi arama ve discover içi arama farklı amaçlara sahip olduğu için placeholder ve boş durum metinleri bunu açıkça yansıtmalı

### New Note Action

- “Yeni Not” tüm ürünün ana CTA’sıdır
- Not oluşturma akışı landing CTA’sı kadar net ve kolay bulunur olmalıdır

## 9. Visual Foundation

### 9.1 Color

Temel palette:

- Arka plan: `--bg-base`, `--bg-card`, `--bg-raised`
- Metin: `--text-primary`, `--text-secondary`, `--text-muted`
- Aksiyon vurgu: `--gold`, `--gold-light`
- Risk/hata: `--danger`

Renk kullanımı:

- Primary text her zaman yüksek kontrastlı yüzey üzerinde
- Secondary text yalnızca yardımcı bilgilerde
- Gold; aktif sekme, ana CTA, seçili durum, önemli badge ve vurgu alanları için

### 9.2 Typography

- Display: landing ve büyük bölüm başlıklarında `--font-display`
- Product UI: içerik yoğun yüzeylerde `--font-sans`
- Başlıklar kısa, meta bilgileri sıkı ve küçük
- Uzun açıklamalar için daha rahat satır yüksekliği kullanılmalı

### 9.3 Spacing

- Kart içi temel padding: `p-4` veya `p-5`
- Bölüm arası boşluk, kart içi alt-grup boşluğundan daha belirgin olmalı
- Mobilde sıkışık ama boğucu olmayan spacing korunmalı

### 9.4 Motion

- Landing’de sahne hissi veren motion devam etmeli
- Uygulama içinde motion daha çok state feedback amaçlı olmalı
- Kaydetme, yükleme, hover ve progress state’leri kısa ve ölçülü kalmalı

## 10. Chosen Design Direction

Seçilen yön: “Collected Night Ledger”

Bu yön:

- Maviye çalan derin arka plan
- Altın aksan
- Kütüphane hissi veren yoğun ama düzenli yüzeyler
- Kayıt, arşiv ve geri dönüş duygusu

Bu yön korunmalı; ürün daha generik SaaS görünümüne itilmemelidir.

## 11. Key User Journeys

### Journey A: İlk içerik ekleme

1. Kullanıcı giriş yapar
2. Yeni Not CTA’sını görür
3. Kategori seçer veya medya arar
4. Veri otomatik dolar
5. Kullanıcı notunu zenginleştirir
6. Kaydeder
7. Not detayına veya kendi listesine döner

### Journey B: Eski notu bulma

1. Kullanıcı Notes ekranına gelir
2. Arama/sıralama/filtre kullanır
3. Sonuç listesinden içeriği açar
4. Gerekirse düzenler, koleksiyona ekler veya bookmark yapar

### Journey C: Topluluktan keşif

1. Kullanıcı Discover veya Recommended ekranına geçer
2. Kartlar üzerinden içerik ve kişi sinyallerini görür
3. Profil veya içerik detayına iner
4. İçeriği kendi arşivine ekleme kararı verir

### Journey D: Uzun dönem geri dönüş

1. Kullanıcı Stats / Year in Review ekranını açar
2. Geçmiş içerik düzenlerini görür
3. Oradan belirli notlara veya kategorilere geri döner

## 12. Screen-Level UX Guidance

### Landing

- Tek cümlelik değer önerisi
- Medya çeşitliliğini anlatan katmanlı hero
- Kayıt/giriş aksiyonları net

### Notes

- Liste, filtre, arama ve kategori ilişkisi hızlı kavranmalı
- Kart yoğunluğu kontrol altında tutulmalı
- Boş durum kullanıcıyı yeni not oluşturmaya yönlendirmeli

### New Post / Edit Post

- Arama ve otomatik doldurma en üst zihinsel model olmalı
- Form iki blok gibi çalışmalı: metadata + içerik
- Mobilde de ilk bakışta nereden başlanacağı anlaşılmalı

### Post Detail

- Kapak görseli, meta bilgi, topluluk sinyali ve içerik arasında net bir okuma sırası olmalı
- Spoiler kontrolü dikkatli ama kaba olmayan bir bariyer sunmalı

### Discover / Feed / Recommended

- Bu üç ekran birbirinin kopyası gibi görünmemeli
- Feed: takip edilen insanlar
- Recommended: kişisel geçmişe dayalı öneri
- Discover: genel ağ ve popülerlik yüzeyi

### Profile

- Kullanıcının kimliği, koleksiyonları ve son notları tek sayfada anlamlı hiyerarşide sunulmalı

### Stats

- Grafikler “analiz paneli” değil kişisel özet gibi hissettirmeli
- Sayısal bilgi ile hatırlanabilir içerik örnekleri dengelenmeli

## 13. Component Strategy

### Core Reusable Components

- `AppShell`
- `PostsList`
- `SortFilterBar`
- `SearchBar`
- `TagInput`
- `StatusBadge`
- `StarRating`
- `CollectionCard`
- `UserCard`

### Custom UX-sensitive Components

- `MediaSearch`: ürünün capture hızı için kritik
- `PlaceSearch`: travel note akışının ayrıştırıcı parçası
- `CommunityStatsCard`: sosyal bağlam hissini güçlendirir
- `RouteProgressBar`: algılanan hız ve yön duygusu sağlar

### Component Rules

- Yeni component, yakın mevcut component ile aynı spacing ve state grammar’ı izlemeli
- CTA, badge, empty state ve skeleton davranışları ortaklaşmalı

## 14. UX Consistency Patterns

### Feedback States

- Başarılı kayıt: toast + yönlendirme
- Başarısız kayıt: inline message + toast
- Loading: skeleton veya spinner, ama ikisi aynı yerde üst üste değil

### Empty States

- Her boş durum bir sonraki aksiyonu söylemeli
- “Boş” mesajı tek başına bırakılmamalı

### Error Recovery

- Yetkisiz kullanıcı: tekrar girişe yönlendirme
- Ağ hatası: tekrar deneme çağrısı
- Veri bulunamadı: bağlamsal geri dönüş linki

### Data Density

- Her kartta en fazla bir baskın vurgu alanı
- Meta bilgiler küçük ama okunabilir
- Etiketler yardımcı rol oynamalı, başlığı bastırmamalı

## 15. Responsive and Accessibility Strategy

### Mobile

- Not oluşturma akışı mobil öncelikli test edilmelidir
- Sticky veya fixed öğeler form alanlarını engellememelidir
- Alt tab ve composer davranışı birbiriyle çakışmamalıdır

### Tablet/Desktop

- Çift kolon ve sidebar mantığı özellikle keşif, detay ve composer ekranlarında daha verimli kullanılmalıdır

### Accessibility

- Gold vurgu, salt renk ile anlam taşımamalı
- Tıklanabilir yüzeyler hover dışında focus durumuna da sahip olmalı
- Form alanları etiketli ve zorunlu durumları açık olmalı
- Grafik ve istatistik alanları yalnızca renkle ayrışmamalı

## 16. Implementation Guidance

- Yeni UI çalışmaları önce bu UX spec, sonra `planning-artifacts/architecture.md`, sonra yakın ekran referansı ile uygulanmalı
- Tasarım iyileştirmeleri bir defada tüm ürüne yayılmamalı; ekran kümeleri halinde ilerlenmeli
- İlk uygulama önceliği composer, notes, detail ve discover yüzeyleri olmalıdır

## 17. Deliverables

- Ana UX spec: `planning-artifacts/ux-design-specification.md`
- Tema referansı: `planning-artifacts/ux-color-themes.html`
- Görsel yön referansı: `planning-artifacts/ux-design-directions.html`

## 18. Final UX Position

DigyNotes için UX hedefi, medya günlüğü ile kişisel kültür hafızası arasında duran; yoğun özelliklerini daha sakin, daha yönlendirici ve daha hatırlanabilir hale getiren bir ürün deneyimidir. Tüm yeni işler bu çizgiyi güçlendirmelidir.
