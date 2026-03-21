/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Download,
  Rocket,
  Sun,
  Moon,
  Loader2,
  CheckCircle2,
  LogIn,
  User,
  Settings,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchGitHubReleaseData, GitHubReleaseData } from './services/githubService';
import { fetchDownloadCount, incrementDownloadCount } from './services/downloadStats';
import { LoginModal } from './components/LoginModal';
import { AdminPanel } from './components/AdminPanel';
import { HeroImageCarousel } from './components/HeroImageCarousel';
import { supabase } from './lib/supabase';
import { getSiteSettings } from './lib/siteSettings';

// GitHub Repository Configuration
// Replace with your actual repository owner and name
const GITHUB_OWNER = 'mhmtaddl';
const GITHUB_REPO = 'caylaklar-sesli-sohbet';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [siteSettings, setSiteSettings] = useState({
    id: '',
    logo_url: '',
    hero_baslik: 'Caylaklar ile Sohbete Doğru',
    hero_aciklama: 'Güvenli ve hızlı bağlantı sunan modern bir sesli sohbet uygulamasıdır. VPN derdine son veren kesintisiz iletişim altyapısı.',
    hero_gorseller: ['https://picsum.photos/seed/chat-app-v2/1000/800'],
    navigasyon_butonu_metni: 'Giriş Yap',
    hero_buton_metni: 'Abone Ol',
    hero_buton_metni_alternatif: 'Yakında..',
    indirme_butonu_metni: 'Hemen İndir',
    updated_at: ''
  });
  const [user, setUser] = useState<any>(null);
  const [subscribeBtnText, setSubscribeBtnText] = useState('Abone Ol');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [releaseData, setReleaseData] = useState<GitHubReleaseData>({
    version: 'v0.0.0',
    totalDownloads: 0,
    downloadUrl: null
  });
  const [downloadCount, setDownloadCount] = useState(0);
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroDirection, setHeroDirection] = useState(1);
  const [heroPaused, setHeroPaused] = useState(false);

  // Fetch GitHub Release Data + download count
  useEffect(() => {
    async function getReleaseData() {
      const data = await fetchGitHubReleaseData(GITHUB_OWNER, GITHUB_REPO);
      setReleaseData(data);
    }
    async function getDownloadCount() {
      const count = await fetchDownloadCount();
      setDownloadCount(count);
    }
    getReleaseData();
    getDownloadCount();

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
          hero_gorseller: data.hero_gorseller || [],
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

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const heroImages = siteSettings.hero_gorseller;

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

  const formatDownloadCount = (count: number) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M+';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K+';
    }
    return count.toString();
  };

  const handleDownload = async (e: React.MouseEvent) => {
    if (isDownloading || !releaseData.downloadUrl) return;

    setIsDownloading(true);

    await incrementDownloadCount();
    setDownloadCount(prev => prev + 1);

    window.open(releaseData.downloadUrl!, '_blank');

    setTimeout(() => {
      setIsDownloading(false);
      setDownloadComplete(true);
      setTimeout(() => setDownloadComplete(false), 5000);
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
            <div className="w-12 h-12 overflow-hidden rounded-2xl shadow-xl shadow-primary/20 border-2 border-primary/20 bg-surface-container-low">
              <img 
                src={siteSettings.logo_url 
                  ? `${siteSettings.logo_url}${siteSettings.logo_url.includes('?') ? '&' : '?'}t=${siteSettings.updated_at || Date.now()}` 
                  : 'https://picsum.photos/seed/cylk-logo-v2/200/200'
                } 
                alt="CYLK Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/cylk-logo-v2/200/200';
                }}
              />
            </div>
            <span className="font-headline text-2xl font-black tracking-tighter text-white drop-shadow">
              CYLK <span className="text-white/70">Sohbet</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all hover:scale-110 active:scale-90"
              aria-label="Toggle Theme"
            >
              {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
            </button>

            {user ? (
              <div className="flex items-center gap-3 px-4 py-2 bg-white/10 rounded-2xl border border-white/20">
                <User size={18} className="text-white" />
                <div className="flex flex-col items-start leading-none">
                  <span className="text-sm font-bold text-white">
                    {user.email?.split('@')[0]}
                  </span>
                  {user.email === import.meta.env.VITE_ADMIN_EMAIL && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-white/70 uppercase tracking-tighter">Admin</span>
                      <button
                        onClick={() => setIsAdminPanelOpen(true)}
                        className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 transition-colors"
                        title="Yönetici Paneli"
                      >
                        <Settings size={16} />
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="ml-2 text-xs font-bold text-white/70 hover:text-white hover:underline"
                >
                  Çıkış
                </button>
              </div>
            ) : (
              isEditMode ? (
                <input 
                  type="text"
                  value={siteSettings.navigasyon_butonu_metni}
                  onChange={(e) => setSiteSettings({...siteSettings, navigasyon_butonu_metni: e.target.value})}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary text-on-primary rounded-2xl font-bold shadow-lg shadow-primary/20 outline-none border-2 border-dashed border-white/50 focus:border-white w-32 text-center"
                />
              ) : (
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-white/15 text-white border border-white/25 rounded-2xl font-bold hover:bg-white/25 hover:scale-105 transition-all active:scale-95 backdrop-blur-sm"
                >
                  <LogIn size={18} />
                  <span>{siteSettings.navigasyon_butonu_metni}</span>
                </button>
              )
            )}
          </div>
        </div>
      </nav>

      {/* Admin Panel Modal */}
      <AnimatePresence>
        {isAdminPanelOpen && (
          <AdminPanel 
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
                    hero_gorseller: data.hero_gorseller || [],
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
        className="relative w-full h-screen overflow-hidden"
        onMouseEnter={() => setHeroPaused(true)}
        onMouseLeave={() => setHeroPaused(false)}
      >
        {/* Arka plan görseli */}
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
            src={heroImages[heroIndex] || 'https://picsum.photos/seed/chat-app-v2/1600/900'}
            alt="Hero"
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </AnimatePresence>

        {/* Gradient overlay — alttan yukarı koyulaşır, yazıları okunabilir kılar */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />

        {/* İçerik — altta */}
        <div className="absolute bottom-0 left-0 right-0 z-10 px-8 pb-12 pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="max-w-5xl mx-auto flex flex-col md:flex-row items-end justify-between gap-8"
          >
            {/* Sol — başlık + açıklama */}
            <div className="space-y-3 flex-1">
              <div className="flex gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/80 text-[10px] font-bold tracking-widest uppercase border border-white/20 backdrop-blur-sm">
                  <Rocket size={10} /> {releaseData.version}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/80 text-[10px] font-bold tracking-widest uppercase border border-white/20 backdrop-blur-sm">
                  <Download size={10} /> {formatDownloadCount(downloadCount)} İndirme
                </span>
              </div>

              {isEditMode ? (
                <textarea
                  value={siteSettings.hero_baslik}
                  onChange={(e) => setSiteSettings({...siteSettings, hero_baslik: e.target.value})}
                  className="w-full bg-black/30 border-2 border-dashed border-white/40 outline-none resize-none font-headline text-3xl md:text-4xl font-black text-white tracking-tight leading-tight rounded-xl p-2"
                  rows={2}
                />
              ) : (
                <h1 className="font-headline text-3xl md:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-lg">
                  {siteSettings.hero_baslik}
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
                <p className="text-white/70 text-sm leading-relaxed max-w-lg drop-shadow">
                  {siteSettings.hero_aciklama}
                </p>
              )}
            </div>

            {/* Sağ — butonlar */}
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <button
                onClick={(e) => { if (isEditMode) { e.preventDefault(); return; } handleDownload(e); }}
                disabled={isDownloading && !isEditMode}
                className={`group relative overflow-hidden px-7 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2.5 transition-all active:scale-95 text-sm shadow-2xl ${
                  downloadComplete
                    ? 'bg-emerald-500 text-white'
                    : 'bg-primary text-on-primary hover:scale-[1.04]'
                } disabled:opacity-90 disabled:cursor-wait`}
              >
                <AnimatePresence mode="wait">
                  {isDownloading ? (
                    <motion.div key="loading" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex items-center gap-2">
                      <Loader2 className="animate-spin" size={18} /><span>{releaseData.version} indiriliyor...</span>
                    </motion.div>
                  ) : downloadComplete ? (
                    <motion.div key="complete" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex items-center gap-2">
                      <CheckCircle2 size={18} /><span>İndirme Başlatıldı!</span>
                    </motion.div>
                  ) : (
                    <motion.div key="default" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex items-center gap-2">
                      <Download size={18} />
                      {isEditMode ? (
                        <input type="text" value={siteSettings.indirme_butonu_metni} onChange={(e) => setSiteSettings({...siteSettings, indirme_butonu_metni: e.target.value})} className="bg-transparent border-b border-dashed border-white/50 outline-none w-24 text-center" onClick={(e) => e.stopPropagation()} />
                      ) : (
                        <span>{siteSettings.indirme_butonu_metni}</span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
                {isDownloading && (
                  <motion.div initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 3.8, ease: [0.22, 1, 0.36, 1] }} className="absolute bottom-0 left-0 h-0.5 bg-white/40" />
                )}
              </button>

              <div className="relative overflow-hidden bg-white/10 backdrop-blur-md text-white px-7 py-3.5 rounded-2xl font-bold flex items-center justify-center cursor-default border border-white/20 text-sm">
                {isEditMode ? (
                  <div className="flex flex-col gap-1">
                    <input type="text" value={siteSettings.hero_buton_metni} onChange={(e) => setSiteSettings({...siteSettings, hero_buton_metni: e.target.value})} className="bg-transparent border-b border-dashed border-white/40 outline-none w-24 text-center text-xs" onClick={(e) => e.stopPropagation()} placeholder="Normal" />
                    <input type="text" value={siteSettings.hero_buton_metni_alternatif} onChange={(e) => setSiteSettings({...siteSettings, hero_buton_metni_alternatif: e.target.value})} className="bg-transparent border-b border-dashed border-white/40 outline-none w-24 text-center text-xs" onClick={(e) => e.stopPropagation()} placeholder="Alternatif" />
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.span key={subscribeBtnText} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} transition={{ duration: 0.4, ease: 'easeInOut' }} className="whitespace-nowrap">
                      {subscribeBtnText}
                    </motion.span>
                  </AnimatePresence>
                )}
              </div>
            </div>
          </motion.div>
        </div>

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

        {/* Nokta göstergeleri */}
        {heroImages.length > 1 && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex gap-2">
            {heroImages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goHero(idx, idx > heroIndex ? 1 : -1)}
                className={`h-1.5 rounded-full transition-all duration-300 ${idx === heroIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'}`}
              />
            ))}
          </div>
        )}
      </div>


      {/* Login Modal */}
      <AnimatePresence>
        {isLoginOpen && <LoginModal onClose={() => setIsLoginOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
