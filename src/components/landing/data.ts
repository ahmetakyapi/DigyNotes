export const MEDIA = "/landing/media";

export type ArchiveItem = {
  key: string;
  index: string;
  label: string;
  verb: string;
  statuses: string[];
  description: string;
  images: { src: string; title: string; meta: string }[];
  source: string;
};

export const ARCHIVES: ArchiveItem[] = [
  {
    key: "film",
    index: "01",
    label: "Film",
    verb: "izlediklerin",
    statuses: ["İzlendi", "İzleniyor", "İzlenecek"],
    description: "Yönetmen, yıl ve afiş TMDB'den kendiliğinden gelir. Sen yalnızca o sahnenin sende bıraktığını yaz.",
    images: [
      { src: `${MEDIA}/perfect-days.webp`, title: "Perfect Days", meta: "Wim Wenders · 2023" },
      { src: `${MEDIA}/aftersun.webp`, title: "Aftersun", meta: "Charlotte Wells · 2022" },
      { src: `${MEDIA}/past-lives.webp`, title: "Past Lives", meta: "Celine Song · 2023" },
    ],
    source: "TMDB",
  },
  {
    key: "dizi",
    index: "02",
    label: "Dizi",
    verb: "takip ettiklerin",
    statuses: ["İzlendi", "İzleniyor", "İzlenecek"],
    description: "Yarım bıraktığın sezonları, bitirdiğin finalleri ve sırada bekleyenleri tek bakışta ayır.",
    images: [
      { src: `${MEDIA}/severance.webp`, title: "Severance", meta: "Apple TV+ · 2022–" },
      { src: `${MEDIA}/shogun.webp`, title: "Shōgun", meta: "FX · 2024" },
      { src: `${MEDIA}/dark.webp`, title: "Dark", meta: "Netflix · 2017–2020" },
    ],
    source: "TMDB",
  },
  {
    key: "oyun",
    index: "03",
    label: "Oyun",
    verb: "oynadıkların",
    statuses: ["Tamamlandı", "Oynanıyor", "Oynanacak"],
    description: "Geliştirici ve çıkış yılı RAWG'den dolar; saatlerce kaybolduğun dünyalar not defterinde yerini alır.",
    images: [
      { src: `${MEDIA}/outer-wilds.webp`, title: "Outer Wilds", meta: "Mobius Digital · 2019" },
      { src: `${MEDIA}/elden-ring.webp`, title: "Elden Ring", meta: "FromSoftware · 2022" },
      { src: `${MEDIA}/disco-elysium.webp`, title: "Disco Elysium", meta: "ZA/UM · 2019" },
    ],
    source: "RAWG",
  },
  {
    key: "kitap",
    index: "04",
    label: "Kitap",
    verb: "okudukların",
    statuses: ["Okundu", "Okunuyor", "Okunacak"],
    description: "Yazar ve kapak Open Library'den. Altını çizdiğin cümleler, kenara düştüğün notlar burada kalır.",
    images: [
      { src: `${MEDIA}/kurk-mantolu-madonna.webp`, title: "Kürk Mantolu Madonna", meta: "Sabahattin Ali · 1943" },
      { src: `${MEDIA}/stoner.webp`, title: "Stoner", meta: "John Williams · 1965" },
      { src: `${MEDIA}/klara-and-the-sun.webp`, title: "Klara and the Sun", meta: "Kazuo Ishiguro · 2021" },
    ],
    source: "Open Library",
  },
  {
    key: "gezi",
    index: "05",
    label: "Gezi",
    verb: "gezdiklerin",
    statuses: ["Gidildi", "Planlandı"],
    description: "Yerler OpenStreetMap'ten bulunur, haritada iğneye dönüşür. Bir sokağın kokusunu bile not edebilirsin.",
    images: [
      { src: `${MEDIA}/kyoto.webp`, title: "Kyoto", meta: "Japonya · 2024" },
      { src: `${MEDIA}/kapadokya.webp`, title: "Kapadokya", meta: "Nevşehir · 2025" },
      { src: `${MEDIA}/lizbon.webp`, title: "Lizbon", meta: "Portekiz · 2024" },
    ],
    source: "OpenStreetMap",
  },
];

export const REEL = [
  `${MEDIA}/perfect-days.webp`,
  `${MEDIA}/elden-ring.webp`,
  `${MEDIA}/kurk-mantolu-madonna.webp`,
  `${MEDIA}/kyoto.webp`,
  `${MEDIA}/severance.webp`,
  `${MEDIA}/aftersun.webp`,
];

export const REEL_B = [
  `${MEDIA}/dune-part-two.webp`,
  `${MEDIA}/stoner.webp`,
  `${MEDIA}/outer-wilds.webp`,
  `${MEDIA}/mardin.webp`,
  `${MEDIA}/shogun.webp`,
  `${MEDIA}/hades.webp`,
];
