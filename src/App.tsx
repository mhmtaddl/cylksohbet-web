/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Rocket,
  Loader2,
  CheckCircle2,
  LogOut,
  User,
  Settings,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Mic,
  Headphones,
  Gamepad2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchGitHubReleaseData, GitHubReleaseData } from './services/githubService';
import { incrementDownloadCount } from './services/downloadStats';
import { LoginModal } from './components/LoginModal';
import { AdminPanel } from './components/AdminPanel';
import { supabase } from './lib/supabase';
import { getSiteSettings, sanitizeHeroImages } from './lib/siteSettings';

// Ses seviyesi çubukları — deterministik (Math.random kullanmaz)
const EQ_BARS = Array.from({ length: 52 }, (_, i) => ({
  peak: 0.12 + ((i * 13 + 7) % 17) / 17 * 0.82,
  duration: 0.38 + ((i * 7 + 3) % 9) / 12,
  delay: ((i * 11 + 5) % 13) / 13 * 0.65,
  hue: 270 - (i / 52) * 90, // violet→blue→cyan
}));

// GitHub Repository Configuration
// Replace with your actual repository owner and name
const GITHUB_OWNER = 'mhmtaddl';
const GITHUB_REPO = 'caylaklar-sesli-sohbet';

export default function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginClickPos, setLoginClickPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [siteSettings, setSiteSettings] = useState({
    id: '',
    logo_url: '',
    hero_baslik: 'Caylaklar ile Sohbete Doğru',
    hero_aciklama: 'Güvenli ve hızlı bağlantı sunan modern bir sesli sohbet uygulamasıdır. VPN derdine son veren kesintisiz iletişim altyapısı.',
    hero_gorseller: [],
    navigasyon_butonu_metni: 'Giriş Yap',
    hero_buton_metni: 'Abone Ol',
    hero_buton_metni_alternatif: 'Yakında..',
    indirme_butonu_metni: 'Hemen İndir',
    updated_at: ''
  });
  const [user, setUser] = useState<any>(null);
  const [subscribeBtnText, setSubscribeBtnText] = useState('Abone Ol');
  const [downloadingPlatform, setDownloadingPlatform] = useState<'windows' | 'android' | null>(null);
  const [completePlatform, setCompletePlatform] = useState<'windows' | 'android' | null>(null);
  const [releaseData, setReleaseData] = useState<GitHubReleaseData>({
    version: 'v0.0.0',
    totalDownloads: 0,
    downloadUrl: null,
    androidDownloadUrl: null,
    publishedAt: null,
  });
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroDirection, setHeroDirection] = useState(1);
  const [heroPaused, setHeroPaused] = useState(false);
  const [btnColor, setBtnColor] = useState('rgba(124, 58, 237, 0.92)');
  const [isLightBg, setIsLightBg] = useState(false);

  // Fetch GitHub Release Data + download count
  useEffect(() => {
    async function getReleaseData() {
      const data = await fetchGitHubReleaseData(GITHUB_OWNER, GITHUB_REPO);
      setReleaseData(data);
    }
    getReleaseData();

    // Fetch site settings
    const fetchSettings = async () => {
      setIsSettingsLoading(true);
      const data = await getSiteSettings();
      if (data) {
        setSiteSettings({
          id: data.id || '',
          logo_url: data.logo_url || '',
          hero_baslik: data.hero_baslik,
          hero_aciklama: data.hero_aciklama,
          hero_gorseller: sanitizeHeroImages(data.hero_gorseller),
          navigasyon_butonu_metni: data.navigasyon_butonu_metni || (data as any).nav_buton_metni || 'Giriş Yap',
          hero_buton_metni: data.hero_buton_metni || 'Abone Ol',
          hero_buton_metni_alternatif: data.hero_buton_metni_alternatif || (data as any).hero_buton_metni_alt || 'Yakında..',
          indirme_butonu_metni: data.indirme_butonu_metni || (data as any).indirme_buton_metni || 'Hemen İndir',
          updated_at: data.updated_at || ''
        });
      }
      setIsSettingsLoading(false);
    };
    fetchSettings();

    // Check current auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Alternating text animation for the subscribe button
  useEffect(() => {
    setSubscribeBtnText(siteSettings.hero_buton_metni);
    const interval = setInterval(() => {
      setSubscribeBtnText(prev => prev === siteSettings.hero_buton_metni ? siteSettings.hero_buton_metni_alternatif : siteSettings.hero_buton_metni);
    }, 3000);
    return () => clearInterval(interval);
  }, [siteSettings.hero_buton_metni, siteSettings.hero_buton_metni_alternatif]);

  // Dark mod her zaman aktif
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const heroImages = sanitizeHeroImages(siteSettings.hero_gorseller);

  const goHero = useCallback((index: number, dir: number) => {
    setHeroDirection(dir);
    setHeroIndex(index);
  }, []);

  const heroNext = useCallback(() => {
    if (heroImages.length <= 1) return;
    goHero((heroIndex + 1) % heroImages.length, 1);
  }, [heroIndex, heroImages.length, goHero]);

  const heroPrev = useCallback(() => {
    if (heroImages.length <= 1) return;
    goHero((heroIndex - 1 + heroImages.length) % heroImages.length, -1);
  }, [heroIndex, heroImages.length, goHero]);

  useEffect(() => {
    if (heroImages.length <= 1 || heroPaused) return;
    const timer = setInterval(() => {
      setHeroDirection(1);
      setHeroIndex(prev => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroImages.length, heroPaused, heroIndex]);

  // Görselin dominant rengini çıkar → buton rengi olarak kullan
  useEffect(() => {
    const src = heroImages[heroIndex];
    if (!src) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, img.naturalHeight * 0.6, img.naturalWidth, img.naturalHeight * 0.4, 0, 0, 16, 16);
        const d = ctx.getImageData(0, 0, 16, 16).data;
        let r = 0, g = 0, b = 0;
        for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
        const n = d.length / 4;
        r = Math.round(r / n); g = Math.round(g / n); b = Math.round(b / n);
        // Doygunluğu artır, çok koyu/açık ise düzelt
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        const factor = max < 60 ? 1.8 : max > 200 ? 0.7 : 1.2;
        r = Math.min(255, Math.round(r * factor));
        g = Math.min(255, Math.round(g * factor));
        b = Math.min(255, Math.round(b * factor));
        setBtnColor(`rgba(${r}, ${g}, ${b}, 0.95)`);

        // Tüm görselin ortalama parlaklığını hesapla (arka plan açık mı koyu mu?)
        const canvas2 = document.createElement('canvas');
        canvas2.width = 16; canvas2.height = 16;
        const ctx2 = canvas2.getContext('2d');
        if (ctx2) {
          ctx2.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, 16, 16);
          const d2 = ctx2.getImageData(0, 0, 16, 16).data;
          let lum = 0;
          for (let i = 0; i < d2.length; i += 4) {
            lum += 0.299 * d2[i] + 0.587 * d2[i + 1] + 0.114 * d2[i + 2];
          }
          setIsLightBg(lum / (d2.length / 4) > 135);
        }
      } catch {}
    };
    img.src = src;
  }, [heroIndex, heroImages]);


  const handleDownload = async (e: React.MouseEvent, platform: 'windows' | 'android') => {
    const url = platform === 'windows' ? releaseData.downloadUrl : releaseData.androidDownloadUrl;
    if (downloadingPlatform || !url) return;

    setDownloadingPlatform(platform);

    await incrementDownloadCount();

    window.open(url, '_blank');

    setTimeout(() => {
      setDownloadingPlatform(null);
      setCompletePlatform(platform);
      setTimeout(() => setCompletePlatform(null), 5000);
    }, 3000);
  };

  const handleSaveEdits = async () => {
    setIsSavingEdit(true);
    try {
      const payload: any = {
        logo_url: siteSettings.logo_url,
        hero_baslik: siteSettings.hero_baslik,
        hero_aciklama: siteSettings.hero_aciklama,
        hero_gorseller: siteSettings.hero_gorseller,
        navigasyon_butonu_metni: siteSettings.navigasyon_butonu_metni,
        hero_buton_metni: siteSettings.hero_buton_metni,
        hero_buton_metni_alternatif: siteSettings.hero_buton_metni_alternatif,
        indirme_butonu_metni: siteSettings.indirme_butonu_metni
      };
      if (siteSettings.id) payload.id = siteSettings.id;

      let { error } = await supabase
        .from('site_ayarlari')
        .upsert(payload);

      // Fallback if columns don't exist yet
      if (error && (error.code === 'PGRST204' || error.code === '42703' || error.message?.includes('column'))) {
        console.warn('Yeni kolonlar bulunamadı, eski şema ile kaydediliyor...');
        const fallbackPayload: any = {
          logo_url: siteSettings.logo_url,
          hero_baslik: siteSettings.hero_baslik,
          hero_aciklama: siteSettings.hero_aciklama,
          hero_gorseller: siteSettings.hero_gorseller,
          nav_buton_metni: siteSettings.navigasyon_butonu_metni,
          hero_buton_metni: siteSettings.hero_buton_metni,
          hero_buton_metni_alt: siteSettings.hero_buton_metni_alternatif,
          indirme_buton_metni: siteSettings.indirme_butonu_metni
        };
        if (siteSettings.id) fallbackPayload.id = siteSettings.id;

        const fallbackRes = await supabase
          .from('site_ayarlari')
          .upsert(fallbackPayload);
          
        error = fallbackRes.error;
      }

      if (error) throw error;
      alert('Değişiklikler başarıyla kaydedildi!');
      setIsEditMode(false);
    } catch (err: any) {
      console.error(err);
      alert('Kaydedilirken hata oluştu: ' + err.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className={`min-h-screen selection:bg-primary-container selection:text-on-primary ${isEditMode ? 'ring-4 ring-primary/50 ring-inset' : ''}`}>
      {/* Edit Mode Toolbar */}
      <AnimatePresence>
        {isEditMode && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[400] bg-surface-container-highest border border-outline-variant/20 p-4 rounded-3xl shadow-2xl flex items-center gap-4"
          >
            <span className="text-sm font-bold text-on-surface px-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Görsel Düzenleyici Modu
            </span>
            <button 
              onClick={handleSaveEdits} 
              disabled={isSavingEdit}
              className="px-6 py-2 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary/90 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSavingEdit ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
              Kaydet
            </button>
            <button 
              onClick={() => setIsEditMode(false)} 
              disabled={isSavingEdit}
              className="px-6 py-2 bg-error/10 text-error rounded-xl font-bold hover:bg-error/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <X size={18} />
              İptal
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isSettingsLoading && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-surface-container-lowest flex flex-col items-center justify-center gap-6"
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl animate-pulse"></div>
              <Loader2 className="animate-spin text-primary relative" size={48} />
            </div>
            <p className="text-on-surface/50 font-black uppercase tracking-[0.3em] text-xs animate-pulse">
              Yükleniyor...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <div
              onClick={(e) => { if (!user) { setLoginClickPos({ x: e.clientX, y: e.clientY }); setIsLoginOpen(true); } }}
              className={`w-12 h-12 overflow-hidden rounded-2xl shadow-xl shadow-primary/20 border-2 border-primary/20 bg-surface-container-low ${!user ? 'cursor-pointer hover:scale-105 hover:border-primary/50 transition-all' : ''}`}
              title={!user ? 'Giriş Yap' : undefined}
            >
              {!isSettingsLoading && siteSettings.logo_url && (
                <img
                  src={`${siteSettings.logo_url}${siteSettings.logo_url.includes('?') ? '&' : '?'}t=${siteSettings.updated_at || Date.now()}`}
                  alt="CYLK Logo"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
            <span className="font-headline text-2xl font-black tracking-tighter text-white drop-shadow">
              CYLK <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">Sohbet</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-2xl border border-white/20">
                <User size={15} className="text-white/70 shrink-0" />
                <span className="text-sm font-bold text-white">{user.email?.split('@')[0]}</span>
                {user.email === import.meta.env.VITE_ADMIN_EMAIL && (
                  <>
                    <span className="text-white/20 mx-1">|</span>
                    <button
                      onClick={() => setIsAdminPanelOpen(true)}
                      className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors"
                      title="Yönetici Paneli"
                    >
                      <Settings size={14} />
                      <span className="text-xs font-bold">Ayarlar</span>
                    </button>
                  </>
                )}
                <span className="text-white/20 mx-1">|</span>
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors"
                >
                  <LogOut size={14} />
                  <span className="text-xs font-bold">Çıkış</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </nav>

      {/* Admin Panel Modal */}
      <AnimatePresence>
        {isAdminPanelOpen && (
          <AdminPanel
            btnColor={btnColor}
            onClose={() => setIsAdminPanelOpen(false)}
            onStartEditMode={() => {
              setIsAdminPanelOpen(false);
              setIsEditMode(true);
            }}
            onSave={() => {
              // Re-fetch settings when admin saves
              const fetchSettings = async () => {
                const data = await getSiteSettings();
                if (data) {
                  setSiteSettings({
                    id: data.id || '',
                    logo_url: data.logo_url || '',
                    hero_baslik: data.hero_baslik,
                    hero_aciklama: data.hero_aciklama,
                    hero_gorseller: sanitizeHeroImages(data.hero_gorseller),
                    navigasyon_butonu_metni: data.navigasyon_butonu_metni || (data as any).nav_buton_metni || 'Giriş Yap',
                    hero_buton_metni: data.hero_buton_metni || 'Abone Ol',
                    hero_buton_metni_alternatif: data.hero_buton_metni_alternatif || (data as any).hero_buton_metni_alt || 'Yakında..',
                    indirme_butonu_metni: data.indirme_butonu_metni || (data as any).indirme_buton_metni || 'Hemen İndir',
                    updated_at: data.updated_at || ''
                  });
                }
              };
              fetchSettings();
            }}
          />
        )}
      </AnimatePresence>

      {/* Hero — tam ekran görsel + gradient overlay + içerik */}
      <div
        className="relative w-full h-screen overflow-hidden bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(109,40,217,0.35)_0%,rgba(30,10,60,0.7)_50%,#050508_100%)]"
        onMouseEnter={() => setHeroPaused(true)}
        onMouseLeave={() => setHeroPaused(false)}
      >
        {/* Arka plan görseli + oklar — mobilde nav ile içerik arasında, desktop'ta tam ekran */}
        <div className={`absolute top-20 left-0 right-0 bottom-80 sm:inset-0 transition-opacity duration-500 ${isSettingsLoading ? 'opacity-0' : 'opacity-100'}`}>
          {!isSettingsLoading && heroImages.length > 0 && (
          <AnimatePresence mode="sync" custom={heroDirection}>
            <motion.img
              key={heroIndex}
              custom={heroDirection}
              variants={{
                enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
                center: { x: 0, opacity: 1 },
                exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
              src={heroImages[heroIndex]}
              alt="Hero"
              className="absolute inset-0 w-full h-full object-contain sm:object-cover"
              referrerPolicy="no-referrer"
            />
          </AnimatePresence>
          )}

          {/* Sol / Sağ oklar */}
          {heroImages.length > 1 && (
            <>
              <button onClick={heroPrev} className="absolute left-5 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-full bg-black/25 text-white border border-white/15 hover:bg-black/45 transition-all">
                <ChevronLeft size={22} />
              </button>
              <button onClick={heroNext} className="absolute right-5 top-1/2 -translate-y-1/2 z-10 p-2.5 rounded-full bg-black/25 text-white border border-white/15 hover:bg-black/45 transition-all">
                <ChevronRight size={22} />
              </button>
            </>
          )}

          {/* İlerleme çubukları */}
          {heroImages.length > 1 && (
            <div className="absolute bottom-[calc(50%-28.125vw)] sm:bottom-5 left-1/2 -translate-x-1/2 z-10 flex gap-2 items-center">
              {heroImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goHero(idx, idx > heroIndex ? 1 : -1)}
                  className={`relative h-1.5 rounded-full overflow-hidden transition-all duration-300 ${
                    idx === heroIndex ? 'w-16' : 'w-1.5 bg-white/40 hover:bg-white/70'
                  }`}
                >
                  {idx === heroIndex && (
                    <>
                      <span className="absolute inset-0 bg-white/30 rounded-full" />
                      <motion.span
                        key={heroIndex}
                        className="absolute inset-y-0 left-0 bg-white rounded-full"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 5, ease: 'linear' }}
                      />
                    </>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Gradient overlay — alttan yukarı koyulaşır, yazıları okunabilir kılar */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />

        {/* Film grain texture */}
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{
            opacity: 0.045,
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
          }}
        />

        {/* İçerik — altta */}

        {/* Alt içerik — başlık + açıklama + butonlar */}
        <div className="absolute bottom-0 left-0 right-0 z-10 px-8 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="max-w-5xl mx-auto flex flex-col items-center gap-6 text-center"
          >
            {/* Başlık + açıklama */}
            <div className="space-y-2 w-full">
              {isEditMode ? (
                <textarea
                  value={siteSettings.hero_baslik}
                  onChange={(e) => setSiteSettings({...siteSettings, hero_baslik: e.target.value})}
                  className="w-full bg-black/30 border-2 border-dashed border-white/40 outline-none resize-none font-headline text-3xl md:text-4xl font-black text-white tracking-tight leading-tight rounded-xl p-2"
                  rows={2}
                />
              ) : (
                <h1 className="relative font-headline font-black tracking-tight leading-snug text-center">
                  {/* Ses seviyesi çubukları — açık/koyu arka plana göre renk değişir */}
                  <span
                    className="absolute inset-x-0 bottom-0 top-0 flex items-end justify-around overflow-hidden pointer-events-none"
                    aria-hidden="true"
                  >
                    {EQ_BARS.map(({ peak, duration, delay, hue }, i) => (
                      <motion.span
                        key={i}
                        className="rounded-t-sm origin-bottom shrink-0"
                        style={{
                          width: 3,
                          height: '100%',
                          backgroundColor: isLightBg
                            ? `hsla(${hue}, 72%, 28%, 0.55)`
                            : `hsla(${hue}, 75%, 65%, 0.32)`,
                          transition: 'background-color 700ms ease',
                        }}
                        animate={{ scaleY: [0.03, peak, 0.03] }}
                        transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    ))}
                  </span>

                  {/* Caylaklar ile — arka plana göre metin rengi */}
                  <span
                    className="flex flex-col items-center gap-1 text-3xl md:text-5xl relative z-10 drop-shadow-lg max-sm:text-white!"
                    style={{
                      color: isLightBg ? '#1e1035' : 'white',
                      transition: 'color 700ms ease',
                    }}
                  >
                    <span className="flex items-center gap-3">
                      <Headphones size={18} />
                      <Mic size={22} />
                      <Gamepad2 size={18} />
                    </span>
                    Caylaklar ile
                  </span>

                  {/* Sohbete Doğru — açık/koyu tema + çok renkli gradient */}
                  <span
                    className="block text-4xl md:text-6xl relative z-10 drop-shadow-lg bg-clip-text text-transparent animate-gradient-x"
                    style={{
                      backgroundImage: isLightBg
                        ? 'linear-gradient(to right, #6d28d9, #7c3aed, #2563eb, #0369a1, #0e7490, #2563eb, #6d28d9)'
                        : 'linear-gradient(to right, #c084fc, #e879f9, #818cf8, #38bdf8, #22d3ee, #818cf8, #c084fc)',
                      transition: 'background-image 700ms ease',
                    }}
                  >
                    Sohbete Doğru
                  </span>
                </h1>
              )}
              {isEditMode ? (
                <textarea
                  value={siteSettings.hero_aciklama}
                  onChange={(e) => setSiteSettings({...siteSettings, hero_aciklama: e.target.value})}
                  className="w-full bg-black/30 border-2 border-dashed border-white/40 outline-none resize-none text-white/70 text-sm leading-relaxed rounded-xl p-2"
                  rows={3}
                />
              ) : (
                <p className="text-white/65 text-sm leading-relaxed max-w-lg drop-shadow mx-auto">
                  {siteSettings.hero_aciklama}
                </p>
              )}
            </div>

            {/* Versiyon + indirme + butonlar — ortalı */}
            <div className="flex flex-col items-center gap-3">
              <div className="flex flex-col items-center gap-1">
                <span className="inline-flex items-center gap-1.5 text-white/55 text-xs font-semibold">
                  <Rocket size={11} className="text-white/35" /> {releaseData.version}
                </span>
                {releaseData.publishedAt && (
                  <span className="text-white/35 text-[11px]">
                    {new Date(releaseData.publishedAt).toLocaleString('tr-TR', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                )}
              </div>
            <div className="flex flex-row gap-2.5">
              {/* Windows İndir butonu */}
              {releaseData.downloadUrl && (
              <div className="relative">
                {!completePlatform && !downloadingPlatform && (
                  <motion.span
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    animate={{
                      boxShadow: [
                        `0 0 0 0px ${btnColor.replace('0.95', '0.7').replace('0.92', '0.7')}`,
                        `0 0 0 10px ${btnColor.replace('0.95', '0').replace('0.92', '0')}`,
                      ],
                    }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                  />
                )}
              <button
                onClick={(e) => { if (isEditMode) { e.preventDefault(); return; } handleDownload(e, 'windows'); }}
                disabled={!!downloadingPlatform && !isEditMode}
                style={completePlatform === 'windows' ? {} : { backgroundColor: btnColor }}
                className={`group relative overflow-hidden w-[52px] h-[52px] rounded-2xl font-bold flex items-center justify-center transition-all active:scale-95 shadow-2xl text-white ${
                  completePlatform === 'windows' ? 'bg-emerald-500' : 'hover:brightness-110 hover:scale-105'
                } disabled:opacity-90 disabled:cursor-wait`}
                title="Windows İndir"
              >
                <AnimatePresence mode="wait">
                  {downloadingPlatform === 'windows' ? (
                    <motion.div key="loading" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                      <Loader2 className="animate-spin" size={24} />
                    </motion.div>
                  ) : completePlatform === 'windows' ? (
                    <motion.div key="complete" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                      <CheckCircle2 size={24} />
                    </motion.div>
                  ) : (
                    <motion.div key="default" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/></svg>
                    </motion.div>
                  )}
                </AnimatePresence>
                {downloadingPlatform === 'windows' && (
                  <motion.div initial={{ height: '0%' }} animate={{ height: '100%' }} transition={{ duration: 3.8, ease: [0.22, 1, 0.36, 1] }} className="absolute bottom-0 left-0 w-full bg-white/15 rounded-2xl" />
                )}
              </button>
              </div>
              )}

              {/* Android İndir butonu */}
              {releaseData.androidDownloadUrl && (
              <div className="relative">
              <button
                onClick={(e) => { if (isEditMode) { e.preventDefault(); return; } handleDownload(e, 'android'); }}
                disabled={!!downloadingPlatform && !isEditMode}
                style={completePlatform === 'android' ? {} : { backgroundColor: btnColor }}
                className={`group relative overflow-hidden w-[52px] h-[52px] rounded-2xl font-bold flex items-center justify-center transition-all active:scale-95 shadow-2xl text-white ${
                  completePlatform === 'android' ? 'bg-emerald-500' : 'hover:brightness-110 hover:scale-105'
                } disabled:opacity-90 disabled:cursor-wait`}
                title="Android İndir"
              >
                <AnimatePresence mode="wait">
                  {downloadingPlatform === 'android' ? (
                    <motion.div key="loading" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                      <Loader2 className="animate-spin" size={24} />
                    </motion.div>
                  ) : completePlatform === 'android' ? (
                    <motion.div key="complete" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                      <CheckCircle2 size={24} />
                    </motion.div>
                  ) : (
                    <motion.div key="default" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V7H6v11zM3.5 7C2.67 7 2 7.67 2 8.5v7c0 .83.67 1.5 1.5 1.5S5 16.33 5 15.5v-7C5 7.67 4.33 7 3.5 7zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48A5.84 5.84 0 0 0 12 0c-.96 0-1.86.23-2.66.63L7.85.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31A5.983 5.983 0 0 0 6 6h12c0-2.21-1.2-4.15-2.97-5.18-.14-.09-.19-.17-.5.16zM10 4H9V3h1v1zm5 0h-1V3h1v1z"/></svg>
                    </motion.div>
                  )}
                </AnimatePresence>
                {downloadingPlatform === 'android' && (
                  <motion.div initial={{ height: '0%' }} animate={{ height: '100%' }} transition={{ duration: 3.8, ease: [0.22, 1, 0.36, 1] }} className="absolute bottom-0 left-0 w-full bg-white/15 rounded-2xl" />
                )}
              </button>
              </div>
              )}

              {/* Üye Ol butonu — sabit genişlik */}
              <div className="relative overflow-hidden bg-white/10 backdrop-blur-md text-white rounded-2xl font-bold flex items-center justify-center cursor-default border border-white/20 text-sm w-[130px] h-[50px]">
                {isEditMode ? (
                  <div className="flex flex-col gap-1 px-3">
                    <input type="text" value={siteSettings.hero_buton_metni} onChange={(e) => setSiteSettings({...siteSettings, hero_buton_metni: e.target.value})} className="bg-transparent border-b border-dashed border-white/40 outline-none w-full text-center text-xs" onClick={(e) => e.stopPropagation()} placeholder="Normal" />
                    <input type="text" value={siteSettings.hero_buton_metni_alternatif} onChange={(e) => setSiteSettings({...siteSettings, hero_buton_metni_alternatif: e.target.value})} className="bg-transparent border-b border-dashed border-white/40 outline-none w-full text-center text-xs" onClick={(e) => e.stopPropagation()} placeholder="Alternatif" />
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.span key={subscribeBtnText} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35, ease: 'easeInOut' }} className="whitespace-nowrap absolute">
                      {subscribeBtnText}
                    </motion.span>
                  </AnimatePresence>
                )}
              </div>
            </div>
            </div>
          </motion.div>
        </div>


      </div>


      {/* Login Modal */}
      <AnimatePresence>
        {isLoginOpen && <LoginModal onClose={() => setIsLoginOpen(false)} btnColor={btnColor} clickPos={loginClickPos} />}
      </AnimatePresence>
    </div>
  );
}
