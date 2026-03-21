-- Site Ayarları Tablosu
create table site_ayarlari (
  id uuid primary key default gen_random_uuid(),
  logo_url text default 'https://picsum.photos/seed/cylk-logo-v2/200/200',
  hero_baslik text default 'Caylaklar ile Sohbete Doğru',
  hero_aciklama text default 'Güvenli ve hızlı bağlantı sunan modern bir sesli sohbet uygulamasıdır. VPN derdine son veren kesintisiz iletişim altyapısı.',
  hero_gorseller text[] default array['https://picsum.photos/seed/chat-app-v2/1000/800']::text[],
  nav_buton_metni text default 'Giriş Yap',
  hero_buton_metni text default 'Abone Ol',
  hero_buton_metni_alt text default 'Yakında..',
  indirme_buton_metni text default 'Hemen İndir',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- İlk ayarları ekle
insert into site_ayarlari (logo_url, hero_baslik, hero_aciklama, hero_gorseller, nav_buton_metni, hero_buton_metni, hero_buton_metni_alt, indirme_buton_metni) 
values (
  'https://picsum.photos/seed/cylk-logo-v2/200/200', 
  'Caylaklar ile Sohbete Doğru',
  'Güvenli ve hızlı bağlantı sunan modern bir sesli sohbet uygulamasıdır. VPN derdine son veren kesintisiz iletişim altyapısı.',
  array['https://picsum.photos/seed/chat-app-v2/1000/800'],
  'Giriş Yap',
  'Abone Ol',
  'Yakında..',
  'Hemen İndir'
);

-- RLS Etkinleştir
alter table site_ayarlari enable row level security;

-- Herkese okuma izni ver
create policy "Public read access" on site_ayarlari
  for select using (true);

-- Sadece admin güncelleyebilir
create policy "Admin update access" on site_ayarlari
  for update using (auth.jwt() ->> 'email' = 'mhmtadl460@gmail.com');

create policy "Admin insert access" on site_ayarlari
  for insert with check (auth.jwt() ->> 'email' = 'mhmtadl460@gmail.com');

-- STORAGE SETUP
-- Create a bucket for site assets
insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do nothing;

-- Allow public access to read files
create policy "Public Access" on storage.objects
  for select using (bucket_id = 'site-assets');

-- Allow admin to upload/delete files
create policy "Admin Upload" on storage.objects
  for insert with check (
    bucket_id = 'site-assets' AND 
    auth.jwt() ->> 'email' = 'mhmtadl460@gmail.com'
  );

create policy "Admin Delete" on storage.objects
  for delete using (
    bucket_id = 'site-assets' AND 
    auth.jwt() ->> 'email' = 'mhmtadl460@gmail.com'
  );
