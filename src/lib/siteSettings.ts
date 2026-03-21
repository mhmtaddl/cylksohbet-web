import { supabase } from './supabase';

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
