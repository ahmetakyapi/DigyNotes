import { FixedCategory, isOtherCategory, isTravelCategory } from "@/lib/categories";

export const CATEGORY_EXAMPLE_TAGS: Record<FixedCategory, string[]> = {
  movies: ["drama", "bilim-kurgu", "festival", "aksiyon", "senaryo"],
  series: ["mini-dizi", "drama", "suç", "fantastik", "kurgu"],
  game: ["indie", "soulslike", "co-op", "hikâye-odaklı", "pixel-art"],
  book: ["bilim-kurgu", "fantastik", "kurgu-dışı", "felsefe", "şiir"],
  travel: ["gezi", "müze", "rota", "kahve-durağı", "doğa"],
  other: ["ilham-verici", "üretkenlik", "deneme", "favori", "arşiv"],
};

export function categorySupportsSpoiler(category: string) {
  return !isTravelCategory(category) && !isOtherCategory(category);
}

export function categorySupportsAutofill(category: string) {
  return !isOtherCategory(category);
}

export interface PostComposerGuidance {
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  searchTitle: string;
  searchDescription: string;
  searchHint: string;
  titlePlaceholder: string;
  titleHint: string;
  statusHint: string;
  contentHint: string;
  contentTemplateHint: string;
  imageHint: string;
  locationHint: string;
  manualHint: string;
}

const CATEGORY_COMPOSER_GUIDANCE: Record<FixedCategory, PostComposerGuidance> = {
  movies: {
    heroEyebrow: "İzlediğini hızla yakala",
    heroTitle: "Film notunu tek akışta başlat",
    heroDescription:
      "Önce filmi bul, sonra başlığı ve durumunu netleştir. Form geri kalan alanları buna göre sakinleştirir.",
    searchTitle: "Filmi ara",
    searchDescription: "Arama sonuçlarıyla başlık, yönetmen, yıl ve kapak hızlıca yerleşsin.",
    searchHint:
      "Doğru filmi seçtiğinde temel alanlar dolar; sen doğrudan yorumunu ve puanını eklemeye geçersin.",
    titlePlaceholder: "Örn. Perfect Days",
    titleHint: "Notun arşivde ve detay sayfasında görünecek adı burada netleşir.",
    statusHint:
      "Durum, filmi nerede bıraktığını ve listelerde nasıl görünmesi gerektiğini belirler.",
    contentHint: "İlk satırda neden kaydettiğini yaz, sonra sahne, his ve çağrışımlarını ekle.",
    contentTemplateHint:
      "Şablon başlangıç ritmini kurar; başlıkları silip kendi akışına göre yeniden şekillendirebilirsin.",
    imageHint:
      "Kapak boşsa aramadan doldurabilir ya da kendi görsel bağlantını doğrudan yapıştırabilirsin.",
    locationHint: "Film notlarında konum alanı kullanılmaz; odak yapımın kendisinde kalır.",
    manualHint: "",
  },
  series: {
    heroEyebrow: "Takibi kaybetme",
    heroTitle: "Dizi notunu bölüm bölüm değil, niyetle aç",
    heroDescription:
      "Diziyi bul, izleme durumunu seç ve sonra sezonlar arasında kaybolmadan notunu yapılandır.",
    searchTitle: "Diziyi ara",
    searchDescription:
      "Başlık, yayın yılları, yapım bilgisi ve kapak mümkün olduğunca otomatik dolsun.",
    searchHint:
      "Önce doğru diziyi seç; sonra hangi aşamada olduğunu ve seni neyin tuttuğunu yazmak daha kolay olur.",
    titlePlaceholder: "Örn. Severance",
    titleHint: "Dizi adı, notun ana kimliği olur; kısa ve tanınabilir bırak.",
    statusHint: "Durum, yarım kalan, takip edilen ya da bitirilen dizileri ayırır.",
    contentHint:
      "Spoiler vermeden genel hissi, ardından sezon ya da karakter odaklı notlarını ekleyebilirsin.",
    contentTemplateHint:
      "Şablon, dizi notlarında tempo ve sezon izini korumak için başlangıç başlıkları sunar.",
    imageHint:
      "Afiş yoksa arama sonucu çoğu zaman yeterlidir; gerekirse başka bir görsel URL'si ekleyebilirsin.",
    locationHint: "Dizi notlarında konum alanı kullanılmaz.",
    manualHint: "",
  },
  game: {
    heroEyebrow: "Oynadığın şeyi bağlamıyla sakla",
    heroTitle: "Oyun notunu hızla kur",
    heroDescription: "Önce oyunu seç, sonra durum ve kişisel notlarla deneyimini arşive sabitle.",
    searchTitle: "Oyunu ara",
    searchDescription:
      "Başlık, geliştirici, çıkış yılı ve kapak aramayla gelsin; sen oynanış hissine odaklan.",
    searchHint:
      "Sonucu seçtikten sonra özellikle başlık ve geliştirici alanlarını kontrol edip ince ayar yapabilirsin.",
    titlePlaceholder: "Örn. Disco Elysium",
    titleHint: "Aradığın oyunun adı arşivde arama ve filtrelemeyi kolaylaştırır.",
    statusHint: "Durum, başladığın, bitirdiğin ya da geri dönmek istediğin oyunları ayırır.",
    contentHint:
      "Mekanik, atmosfer ve sende bıraktığı etkiyi birkaç kısa paragrafla tutmak iyi çalışır.",
    contentTemplateHint:
      "Şablon, oyun notlarında oynanış ve his katmanını ayırman için iskelet sağlar.",
    imageHint:
      "Kapak alanı boşsa arama sonucu kullanabilir ya da özel bir ekran görüntüsü bağlantısı ekleyebilirsin.",
    locationHint: "Oyun notlarında konum alanı kullanılmaz.",
    manualHint: "",
  },
  book: {
    heroEyebrow: "Okuduğunu düşünceyle kaydet",
    heroTitle: "Kitap notunu sade ama yönlendirilmiş başlat",
    heroDescription:
      "Kitabı bul, başlığı ve yılı oturt, sonra altını çizmek istediğin fikirleri yerleştir.",
    searchTitle: "Kitabı ara",
    searchDescription: "Başlık, yazar, yayın yılı ve kapak gibi temel alanları aramayla toparla.",
    searchHint:
      "Kitabı seçtikten sonra ilk satıra senden hangi fikri ya da duyguyu aldığına yazmak iyi bir başlangıçtır.",
    titlePlaceholder: "Örn. Körlük",
    titleHint: "Başlık alanı kitap sayfasının ana girişidir; seri adı gerekiyorsa burada belirt.",
    statusHint: "Durum, okumaya başlanmış ve tamamlanmış kitapları ayırt eder.",
    contentHint:
      "İçerikte tema, alıntı hissi ve kişisel yorum arasında net ama rahat bir akış kur.",
    contentTemplateHint:
      "Şablon, kitap notlarında tema ve alıntı düşüncesi için temel başlıklar sunar.",
    imageHint:
      "Kapak bağlantısı yoksa arama sonucu yeterlidir; istersen baskıya özel kapağı ayrıca ekleyebilirsin.",
    locationHint: "Kitap notlarında konum alanı kullanılmaz.",
    manualHint: "",
  },
  travel: {
    heroEyebrow: "Yeri kaydet, hissi kaçırma",
    heroTitle: "Gezi notunu rota gibi aç",
    heroDescription:
      "Önce yeri seç, sonra başlık ve ziyaret bilgisini netleştir. Koordinatlar yalnızca gezi akışında görünür.",
    searchTitle: "Yeri bul",
    searchDescription:
      "Konumu seçtiğinde başlık, koordinatlar ve varsa görsel daha anlaşılır bir başlangıç oluşturur.",
    searchHint:
      "Doğru yeri seçmek, gezi notunun harita ve detay sayfasında bağlamını korumasını sağlar.",
    titlePlaceholder: "Örn. Balat sokaklarında akşam yürüyüşü",
    titleHint: "Başlıkta yer adı tek başına yetmiyorsa anı ya da rota tonunu ekle.",
    statusHint: "Durum, gezi planı ile gerçekleşmiş ziyaretleri birbirinden ayırır.",
    contentHint:
      "İlk paragrafta niçin gittiğini ya da nasıl hissettirdiğini, sonra rota detaylarını ekle.",
    contentTemplateHint:
      "Şablon, gezi notlarında rota, atmosfer ve pratik ipuçlarını ayrı katmanlarda tutmana yardım eder.",
    imageHint:
      "Kapak yoksa sorun değil; önce konumu seç, sonra istersen kendi çektiğin görselin bağlantısını ekle.",
    locationHint:
      "Haritada görünmesi için bir yer seç ve koordinatların dolduğunu aşağıdaki kutudan doğrula.",
    manualHint: "",
  },
  other: {
    heroEyebrow: "Serbest ama başıboş değil",
    heroTitle: "Diğer notunu niyetle kur",
    heroDescription:
      "Bu kategori manuel giriş içindir. Başlığı, durumu ve kaynağı sen belirlersin; form geri kalanını sade tutar.",
    searchTitle: "Manuel başlangıç",
    searchDescription:
      "Bu kategoride otomatik arama yok. Notu doğrudan başlık ve içerik üzerinden kur.",
    searchHint:
      "İstersen kaynak kişiyi ya da bağlamı creator alanında tutup kapak görselini ayrıca ekleyebilirsin.",
    titlePlaceholder: "Örn. Bir sergi notu, makale ya da ilham kırıntısı",
    titleHint: "Bu başlık, serbest notun daha sonra aranabilir ve hatırlanabilir kalmasını sağlar.",
    statusHint: "Durum, serbest notun fikir aşamasında mı yoksa tamamlanmış mı olduğunu gösterir.",
    contentHint:
      "Bu alanda bağlam, ana fikir ve senden geriye ne kaldığını birkaç net blokta topla.",
    contentTemplateHint:
      "Şablon, serbest notlarda bile giriş ve ana düşünceyi boş bırakmaman için hafif bir çerçeve sunar.",
    imageHint:
      "Bir görsel şart değil; ama kapağın olması arşiv içinde notu çok daha hızlı ayırt etmeyi sağlar.",
    locationHint: "Bu kategoride konum alanı kullanılmaz.",
    manualHint:
      "Makale, sergi, podcast bölümü ya da kişisel bir fikir kırıntısıysa bu akış senin için doğru yer.",
  },
};

export function getPostComposerGuidance(category: string): PostComposerGuidance {
  return CATEGORY_COMPOSER_GUIDANCE[category as FixedCategory] ?? CATEGORY_COMPOSER_GUIDANCE.other;
}
