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
    heroEyebrow: "Film Notu",
    heroTitle: "İzlediğin Filmi Not Al",
    heroDescription: "Filmi ara, durumunu seç ve ne düşündüğünü yaz.",
    searchTitle: "Filmi Ara",
    searchDescription: "Filmi seçince adı, yönetmeni, yılı ve afişi kendiliğinden dolar.",
    searchHint: "Filmi seçince temel bilgiler dolar; sana sadece yorumunu ve puanını yazmak kalır.",
    titlePlaceholder: "Örn. Perfect Days",
    titleHint: "Notun bu adla listelenecek.",
    statusHint: "Filmi izledin mi, yoksa izlemeyi mi düşünüyorsun?",
    contentHint: "Filmi neden not aldığını yaz; sonra aklında kalan sahneleri ve hislerini ekle.",
    contentTemplateHint:
      "Şablon sadece başlamana yardım eder. Başlıkları silebilir ya da değiştirebilirsin.",
    imageHint:
      "Afiş boşsa aramadan seçebilir ya da kendi görselinin bağlantısını yapıştırabilirsin.",
    locationHint: "Film notlarında konum kullanılmıyor.",
    manualHint: "",
  },
  series: {
    heroEyebrow: "Dizi Notu",
    heroTitle: "İzlediğin Diziyi Not Al",
    heroDescription: "Diziyi ara, nerede kaldığını seç ve ne düşündüğünü yaz.",
    searchTitle: "Diziyi Ara",
    searchDescription: "Diziyi seçince adı, yayın yılları ve afişi kendiliğinden dolar.",
    searchHint: "Önce diziyi seç; sonra nerede kaldığını ve neyi sevdiğini yazman kolaylaşır.",
    titlePlaceholder: "Örn. Severance",
    titleHint: "Notun bu adla listelenecek. Kısa ve tanıdık bırakmak iyi olur.",
    statusHint: "İzliyor musun, bitirdin mi, yoksa yarıda mı bıraktın?",
    contentHint:
      "Önce genel izlenimini yaz; istersen sonra sezonlar ya da karakterler hakkında not ekle.",
    contentTemplateHint:
      "Şablon sadece başlamana yardım eder. Başlıkları silebilir ya da değiştirebilirsin.",
    imageHint:
      "Afiş genelde aramadan gelir; istersen başka bir görselin bağlantısını ekleyebilirsin.",
    locationHint: "Dizi notlarında konum kullanılmıyor.",
    manualHint: "",
  },
  game: {
    heroEyebrow: "Oyun Notu",
    heroTitle: "Oynadığın Oyunu Not Al",
    heroDescription: "Oyunu ara, durumunu seç ve neler yaşadığını yaz.",
    searchTitle: "Oyunu Ara",
    searchDescription:
      "Oyunu seçince adı, geliştiricisi, çıkış yılı ve kapağı kendiliğinden dolar.",
    searchHint: "Oyunu seçtikten sonra adını ve geliştiricisini bir kontrol et.",
    titlePlaceholder: "Örn. Disco Elysium",
    titleHint: "Notun bu adla listelenecek; sonra aramada da bu adla bulursun.",
    statusHint: "Oynuyor musun, bitirdin mi, yoksa sonra mı döneceksin?",
    contentHint: "Oynanışı, atmosferi ve sende bıraktığı etkiyi birkaç kısa paragrafta anlat.",
    contentTemplateHint:
      "Şablon sadece başlamana yardım eder. Başlıkları silebilir ya da değiştirebilirsin.",
    imageHint:
      "Kapak boşsa aramadan seçebilir ya da bir ekran görüntüsünün bağlantısını ekleyebilirsin.",
    locationHint: "Oyun notlarında konum kullanılmıyor.",
    manualHint: "",
  },
  book: {
    heroEyebrow: "Kitap Notu",
    heroTitle: "Okuduğun Kitabı Not Al",
    heroDescription: "Kitabı ara, durumunu seç ve aklında kalanları yaz.",
    searchTitle: "Kitabı Ara",
    searchDescription: "Kitabı seçince adı, yazarı, yayın yılı ve kapağı kendiliğinden dolar.",
    searchHint: "Kitabı seçtikten sonra işe ondan ne aldığını yazarak başlayabilirsin.",
    titlePlaceholder: "Örn. Körlük",
    titleHint: "Notun bu adla listelenecek. Bir serinin parçasıysa seri adını da ekleyebilirsin.",
    statusHint: "Okuyor musun, bitirdin mi, yoksa sonra mı okuyacaksın?",
    contentHint: "Kitabın konusunu, sevdiğin alıntıları ve kendi yorumunu yaz.",
    contentTemplateHint:
      "Şablon sadece başlamana yardım eder. Başlıkları silebilir ya da değiştirebilirsin.",
    imageHint: "Kapak genelde aramadan gelir; istersen kendi baskının kapağını ekleyebilirsin.",
    locationHint: "Kitap notlarında konum kullanılmıyor.",
    manualHint: "",
  },
  travel: {
    heroEyebrow: "Gezi Notu",
    heroTitle: "Gezdiğin Yeri Not Al",
    heroDescription: "Yeri ara, ne zaman gittiğini seç ve neler gördüğünü yaz.",
    searchTitle: "Yeri Ara",
    searchDescription: "Yeri seçince adı, konumu ve varsa bir görseli kendiliğinden dolar.",
    searchHint: "Yeri seçersen notun haritada da görünür.",
    titlePlaceholder: "Örn. Balat sokaklarında akşam yürüyüşü",
    titleHint: "Yerin adı yetmiyorsa ne yaptığını da ekle; sonra hatırlaması kolay olur.",
    statusHint: "Gittin mi, yoksa gitmeyi mi planlıyorsun?",
    contentHint: "Neden gittiğini ve nasıl hissettirdiğini yaz; sonra rotanı ve ipuçlarını ekle.",
    contentTemplateHint:
      "Şablon sadece başlamana yardım eder. Başlıkları silebilir ya da değiştirebilirsin.",
    imageHint: "Görsel şart değil. İstersen kendi çektiğin bir fotoğrafın bağlantısını ekle.",
    locationHint: "Notunun haritada görünmesi için bir yer seç.",
    manualHint: "",
  },
  other: {
    heroEyebrow: "Serbest Not",
    heroTitle: "Aklındakini Not Al",
    heroDescription: "Bu kategoride arama yok; başlığı ve içeriği sen yazarsın.",
    searchTitle: "Başlıkla Başla",
    searchDescription: "Bu kategoride arama yok. Bir başlık yazarak başla.",
    searchHint:
      "İstersen kaynağı ya da kimden olduğunu ayrıca yazabilir, bir görsel ekleyebilirsin.",
    titlePlaceholder: "Örn. Bir sergi, bir makale ya da aklına gelen bir fikir",
    titleHint: "Sonra kolayca bulabilmen için açıklayıcı bir başlık yaz.",
    statusHint: "Bu not bir fikir mi, yoksa tamamlandı mı?",
    contentHint: "Ne olduğunu, ana fikrini ve sende ne bıraktığını kısaca yaz.",
    contentTemplateHint:
      "Şablon sadece başlamana yardım eder. Başlıkları silebilir ya da değiştirebilirsin.",
    imageHint: "Görsel şart değil ama notunu listede daha kolay bulmanı sağlar.",
    locationHint: "Bu kategoride konum kullanılmıyor.",
    manualHint:
      "Bir makale, sergi, podcast ya da aklına gelen bir fikir için bu kategoriyi kullanabilirsin.",
  },
};

export function getPostComposerGuidance(category: string): PostComposerGuidance {
  return CATEGORY_COMPOSER_GUIDANCE[category as FixedCategory] ?? CATEGORY_COMPOSER_GUIDANCE.other;
}
