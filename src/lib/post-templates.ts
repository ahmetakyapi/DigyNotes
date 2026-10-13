import { normalizeCategory } from "@/lib/categories";
import { stripHtml } from "@/lib/text";

export interface PostTemplate {
  label: string;
  description: string;
  html: string;
}

const POST_TEMPLATES: Record<string, PostTemplate> = {
  movies: {
    label: "Film İnceleme Şablonu",
    description: "Yönetmen dili, teknik tercih ve hikaye ritmi için hızlı bir iskelet.",
    html: `<h2>İlk izlenim</h2><p>Filmin sende bıraktığı ilk duyguyu yaz.</p><h2>Yönetmen ve teknik taraf</h2><p>Kurgu, görüntü, müzik ve tempo hakkında notlar.</p><h2>Hikaye ve karakterler</h2><p>Karakterlerin işleyişi, temalar ve dikkat çeken sahneler.</p><h2>Son söz</h2><p>Kime önereceğini ve nedenini kısaca yaz.</p>`,
  },
  series: {
    label: "Dizi Not Şablonu",
    description: "Sezon akışı, bölüm temposu ve karakter gelişimi için düzenli yapı.",
    html: `<h2>Genel bakış</h2><p>Dizinin tonu, dünyası ve ilk kancası nasıl çalışıyor?</p><h2>Sezon ritmi</h2><p>Bazı bölümler özellikle önde mi, tempo nerede düşüyor?</p><h2>Karakter dinamikleri</h2><p>İlişkiler, gelişimler ve seni etkileyen karakterler.</p><h2>Devam eder miyim?</h2><p>Sonraki sezon veya bölümler için beklentini yaz.</p>`,
  },
  game: {
    label: "Oyun Değerlendirme Şablonu",
    description: "Oynanış döngüsü, teknik durum ve tekrar oynanabilirlik için tasarlandı.",
    html: `<h2>Oynanış hissi</h2><p>Temel mekanikler, kontroller ve akıcılık nasıl?</p><h2>Dünya ve tasarım</h2><p>Bölüm yapısı, sanat yönü, atmosfer ve görev kalitesi.</p><h2>Teknik durum</h2><p>Performans, hatalar ve arayüz deneyimi hakkında notlar.</p><h2>Kime gider?</h2><p>Oyunu hangi oyuncu tipine önereceğini yaz.</p>`,
  },
  book: {
    label: "Kitap Not Şablonu",
    description: "Dil, kurgu ve sende kalan fikirleri hızlıca toparlamak için.",
    html: `<h2>Okuma deneyimi</h2><p>Kitabın dili, akıcılığı ve ritmi nasıldı?</p><h2>Temalar</h2><p>Öne çıkan fikirler, alıntılar veya sorular.</p><h2>Karakterler ve kurgu</h2><p>Hikaye yapısı ve karakterlerin etkisi.</p><h2>Sende kalan</h2><p>Bitirdikten sonra aklında kalan en güçlü şey ne?</p>`,
  },
  travel: {
    label: "Gezi Not Şablonu",
    description: "Rota, mekan önerileri ve pratik notları düzenli tutar.",
    html: `<h2>Rota özeti</h2><p>Nereden nereye gittin, gezi akışı nasıldı?</p><h2>Öne çıkan noktalar</h2><p>En beğendiğin mekanlar, manzaralar veya deneyimler.</p><h2>Pratik notlar</h2><p>Ulaşım, bütçe, kalabalık durumu veya dikkat edilmesi gerekenler.</p><h2>Tavsiye</h2><p>Bir daha gitsen neyi farklı yapardın, kime önerirsin?</p>`,
  },
  other: {
    label: "Genel Not Şablonu",
    description: "Serbest kategori için esnek ama düzenli bir yazı iskeleti.",
    html: `<h2>Kısa özet</h2><p>Konuyu veya içeriği kısaca tanımla.</p><h2>Öne çıkanlar</h2><p>Sende iz bırakan güçlü ve zayıf yanlar.</p><h2>Kişisel yorum</h2><p>Neden ilginç, neden önemli veya neden unutulabilir?</p><h2>Sonuç</h2><p>Tek cümlelik net görüşün.</p>`,
  },
};

export function getPostTemplate(category: string) {
  return POST_TEMPLATES[normalizeCategory(category)] ?? null;
}

export function getTemplateSignature(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const TEMPLATE_SIGNATURES = new Set(
  Object.values(POST_TEMPLATES).map((template) => getTemplateSignature(template.html))
);

/** True when the editor holds nothing the user wrote: it is empty or still an untouched template. */
export function isBlankOrTemplateContent(html: string) {
  if (/<img\b/i.test(html)) return false;
  if (!stripHtml(html)) return true;
  return TEMPLATE_SIGNATURES.has(getTemplateSignature(html));
}

/** What "Şablonu Kaldır" brings back: the editor content from before the template went in. */
export interface TemplateUndo {
  previousContent: string;
}

/**
 * Puts the category template into the editor and remembers what was there before, so the
 * template can be taken out again. Without `force` (category switch) it only replaces an
 * empty editor or an untouched template; with `force` (the button) it always applies and
 * the user's text waits in the undo state. An existing undo is kept, so switching between
 * templates still leads back to the user's own text. Returns null when nothing changes.
 */
export function applyTemplateToContent(
  content: string,
  category: string,
  undo: TemplateUndo | null,
  options?: { force?: boolean }
): { content: string; undo: TemplateUndo } | null {
  const template = getPostTemplate(category);
  if (!template) return null;
  if (!options?.force && !isBlankOrTemplateContent(content)) return null;
  if (getTemplateSignature(content) === getTemplateSignature(template.html)) return null;

  return {
    content: template.html,
    undo: undo ?? { previousContent: isBlankOrTemplateContent(content) ? "" : content },
  };
}
