import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "DigyNotes",
    short_name: "DigyNotes",
    description: "Film, dizi, oyun, kitap ve gezi notlarini tek yerde tut ve kesfet.",
    lang: "tr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui", "browser"],
    orientation: "portrait",
    background_color: "#0f1117",
    theme_color: "#0f1117",
    categories: ["entertainment", "books", "lifestyle", "social"],
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Yeni Not",
        short_name: "Yeni Not",
        description: "Hemen yeni bir not olustur",
        url: "/new-post",
        icons: [{ src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Notlar",
        short_name: "Notlar",
        description: "Kayitli notlarina git",
        url: "/notes",
        icons: [{ src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
