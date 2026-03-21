-- Migration to add new button text columns to site_ayarlari table

ALTER TABLE site_ayarlari
ADD COLUMN IF NOT EXISTS navigasyon_butonu_metni TEXT DEFAULT 'Giriş Yap',
ADD COLUMN IF NOT EXISTS indirme_butonu_metni TEXT DEFAULT 'Hemen İndir',
ADD COLUMN IF NOT EXISTS hero_buton_metni TEXT DEFAULT 'Abone Ol',
ADD COLUMN IF NOT EXISTS hero_buton_metni_alternatif TEXT DEFAULT 'Yakında..';

-- Optionally, if you want to migrate data from old columns to new columns:
-- UPDATE site_ayarlari SET navigasyon_butonu_metni = nav_buton_metni WHERE nav_buton_metni IS NOT NULL;
-- UPDATE site_ayarlari SET indirme_butonu_metni = indirme_buton_metni WHERE indirme_buton_metni IS NOT NULL;
-- UPDATE site_ayarlari SET hero_buton_metni = hero_buton_metni WHERE hero_buton_metni IS NOT NULL;
-- UPDATE site_ayarlari SET hero_buton_metni_alternatif = hero_buton_metni_alt WHERE hero_buton_metni_alt IS NOT NULL;

-- After verifying data migration, you can drop the old columns (uncomment if desired):
-- ALTER TABLE site_ayarlari DROP COLUMN IF EXISTS nav_buton_metni;
-- ALTER TABLE site_ayarlari DROP COLUMN IF EXISTS indirme_buton_metni;
-- ALTER TABLE site_ayarlari DROP COLUMN IF EXISTS hero_buton_metni_alt;
