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
    verb: "İzlediklerin",
    statuses: ["İzlendi", "İzleniyor", "İzlenecek"],
    description:
      "Filmin adını yazman yeter; yönetmeni, yılı ve afişi kendiliğinden gelir. Sen sadece ne hissettiğini yaz.",
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
    verb: "Takip Ettiklerin",
    statuses: ["İzlendi", "İzleniyor", "İzlenecek"],
    description: "Yarım kalan sezonları, bitirdiklerini ve sırada bekleyenleri tek bakışta gör.",
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
    verb: "Oynadıkların",
    statuses: ["Tamamlandı", "Oynanıyor", "Oynanacak"],
    description:
      "Geliştiricisi ve çıkış yılı kendiliğinden gelir. Saatlerini verdiğin oyunlar burada unutulmaz.",
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
    verb: "Okudukların",
    statuses: ["Okundu", "Okunuyor", "Okunacak"],
    description:
      "Yazarı ve kapağı otomatik gelir. Altını çizdiğin cümleler, kenara aldığın notlar burada durur.",
    images: [
      {
        src: `${MEDIA}/kurk-mantolu-madonna.webp`,
        title: "Kürk Mantolu Madonna",
        meta: "Sabahattin Ali · 1943",
      },
      { src: `${MEDIA}/stoner.webp`, title: "Stoner", meta: "John Williams · 1965" },
      {
        src: `${MEDIA}/klara-and-the-sun.webp`,
        title: "Klara and the Sun",
        meta: "Kazuo Ishiguro · 2021",
      },
    ],
    source: "Open Library",
  },
  {
    key: "gezi",
    index: "05",
    label: "Gezi",
    verb: "Gezdiklerin",
    statuses: ["Gidildi", "Planlandı"],
    description: "Gittiğin yerler haritada işaretlenir. Bir sokağın kokusunu bile not alabilirsin.",
    images: [
      { src: `${MEDIA}/kyoto.webp`, title: "Kyoto", meta: "Japonya · 2024" },
      { src: `${MEDIA}/kapadokya.webp`, title: "Kapadokya", meta: "Nevşehir · 2025" },
      { src: `${MEDIA}/lizbon.webp`, title: "Lizbon", meta: "Portekiz · 2024" },
    ],
    source: "OpenStreetMap",
  },
];

export type ReelItem = { src: string; title: string; kind: string };

export const REEL: ReelItem[] = [
  { src: `${MEDIA}/perfect-days.webp`, title: "Perfect Days", kind: "Film" },
  { src: `${MEDIA}/elden-ring.webp`, title: "Elden Ring", kind: "Oyun" },
  { src: `${MEDIA}/disco-elysium.webp`, title: "Disco Elysium", kind: "Oyun" },
  { src: `${MEDIA}/kyoto.webp`, title: "Kyoto", kind: "Gezi" },
  { src: `${MEDIA}/severance.webp`, title: "Severance", kind: "Dizi" },
  { src: `${MEDIA}/aftersun.webp`, title: "Aftersun", kind: "Film" },
];

export const REEL_B: ReelItem[] = [
  { src: `${MEDIA}/dune-part-two.webp`, title: "Dune: Part Two", kind: "Film" },
  { src: `${MEDIA}/stoner.webp`, title: "Stoner", kind: "Kitap" },
  { src: `${MEDIA}/outer-wilds.webp`, title: "Outer Wilds", kind: "Oyun" },
  { src: `${MEDIA}/mardin.webp`, title: "Mardin", kind: "Gezi" },
  { src: `${MEDIA}/shogun.webp`, title: "Shōgun", kind: "Dizi" },
  { src: `${MEDIA}/hades.webp`, title: "Hades", kind: "Oyun" },
];
