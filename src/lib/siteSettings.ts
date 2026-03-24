import { supabase } from './supabase';

// Bilinen istenmeyen görsel URL kalıpları (araba fotoğrafı vb.)
const BLOCKED_IMAGE_PATTERNS = [
  'picsum.photos',
];

/**
 * Hero görsel listesini temizler:
 * - Boş stringleri kaldırır
 * - Duplicate URL'leri kaldırır
 * - Engellenen URL kalıplarını filtreler
 */
export function sanitizeHeroImages(images: string[] | null | undefined): string[] {
  if (!images || !Array.isArray(images)) return [];
  const seen = new Set<string>();
  return images.filter((url) => {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    if (!trimmed) return false;
    if (seen.has(trimmed)) return false;
    seen.add(trimmed);
    return !BLOCKED_IMAGE_PATTERNS.some((pattern) => trimmed.includes(pattern));
  });
}

export interface SiteSettings {
  id: string;
  logo_url: string;
  hero_baslik: string;
  hero_aciklama: string;
  hero_gorseller: string[];
  navigasyon_butonu_metni: string;
  hero_buton_metni: string;
  hero_buton_metni_alternatif: string;
  indirme_butonu_metni: string;
  updated_at?: string;
}

export const getSiteSettings = async (): Promise<SiteSettings | null> => {
  try {
    const { data, error } = await supabase
      .from('site_ayarlari')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Site ayarları çekilirken hata oluştu:', error);
      }
      return null;
    }

    return data as SiteSettings;
  } catch (err) {
    console.error('Beklenmedik bir hata oluştu:', err);
    return null;
  }
};
