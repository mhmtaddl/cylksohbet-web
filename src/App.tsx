/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Rocket, 
  Globe, 
  Mail, 
  Sun, 
  Moon,
  Loader2,
  CheckCircle2,
  LogIn,
  User,
  Settings,
  X,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchGitHubReleaseData, GitHubReleaseData } from './services/githubService';
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
  const [isDarkMode, setIsDarkMode] = useState(false);
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

  // Fetch GitHub Release Data
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

  const formatDownloadCount = (count: number) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M+';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K+';
    }
    return count.toString();
  };

  const handleDownload = (e: React.MouseEvent) => {
    if (isDownloading || !releaseData.downloadUrl || releaseData.downloadUrl === '#') return;
    
    setIsDownloading(true);
    
    // Simulate a short delay for the "loading" feel before actual download starts
    setTimeout(() => {
      const link = document.createElement('a');
      link.href = releaseData.downloadUrl!;
      link.setAttribute('download', '');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Keep loading state for a bit to show the "indiriliyor" text
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadComplete(true);
        // Reset complete state after a few seconds
        setTimeout(() => setDownloadComplete(false), 5000);
      }, 3000);
    }, 800);
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
      <nav className="fixed top-0 w-full z-50 bg-surface-container-lowest/85 backdrop-blur-xl border-b border-outline-variant/10">
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
            <span className="font-headline text-2xl font-black tracking-tighter text-on-surface">
              CYLK <span className="text-primary">Sohbet</span>
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 rounded-2xl bg-surface-container-low text-on-surface hover:bg-surface-container-highest transition-all hover:scale-110 active:scale-90"
              aria-label="Toggle Theme"
            >
              {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
            </button>

            {user ? (
              <div className="flex items-center gap-3 px-4 py-2 bg-surface-container-high rounded-2xl border border-outline-variant/20">
                <User size={18} className="text-primary" />
                <div className="flex flex-col items-start leading-none">
                  <span className="text-sm font-bold text-on-surface">
                    {user.email?.split('@')[0]}
                  </span>
                  {user.email === import.meta.env.VITE_ADMIN_EMAIL && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-primary uppercase tracking-tighter">
                        Admin
                      </span>
                      <button
                        onClick={() => setIsAdminPanelOpen(true)}
                        className="p-1.5 hover:bg-surface-container-highest rounded-lg text-primary transition-colors"
                        title="Yönetici Paneli"
                      >
                        <Settings size={16} />
                      </button>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => supabase.auth.signOut()}
                  className="ml-2 text-xs font-bold text-primary hover:underline"
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
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary text-on-primary rounded-2xl font-bold hover:scale-105 transition-all active:scale-95 shadow-lg shadow-primary/20"
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

      {/* Hero Section */}
      <header className="relative pt-40 pb-24 px-6 overflow-hidden min-h-screen flex items-center">
        {/* Background Decorative Elements */}
        <div className="absolute -z-10 top-1/4 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute -z-10 bottom-1/4 left-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px]" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-20 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="lg:col-span-7 space-y-10"
          >
            <div className="flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-widest uppercase border border-primary/20">
                <Rocket size={14} />
                Sürüm {releaseData.version} Yayında
              </div>
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-secondary/10 text-secondary text-xs font-bold tracking-widest uppercase border border-secondary/20">
                <Download size={14} />
                {formatDownloadCount(releaseData.totalDownloads)} İndirme
              </div>
            </div>

            <div className="space-y-4">
              {isEditMode ? (
                <textarea
                  value={siteSettings.hero_baslik}
                  onChange={(e) => setSiteSettings({...siteSettings, hero_baslik: e.target.value})}
                  className="w-full bg-transparent border-2 border-dashed border-primary/50 focus:border-primary focus:bg-surface-container-low/50 outline-none resize-none font-headline text-6xl md:text-8xl font-black text-on-surface tracking-[-0.05em] leading-[0.9] lg:max-w-3xl rounded-2xl p-2"
                  rows={2}
                />
              ) : (
                <h1 className="font-headline text-6xl md:text-8xl font-black text-on-surface tracking-[-0.05em] leading-[0.9] lg:max-w-3xl">
                  {siteSettings.hero_baslik.split(' ').slice(0, -2).join(' ')} <br />
                  <span className="bg-gradient-to-r from-primary to-primary-container bg-clip-text text-transparent">
                    {siteSettings.hero_baslik.split(' ').slice(-2).join(' ')}
                  </span>
                </h1>
              )}
              
              {isEditMode ? (
                <textarea
                  value={siteSettings.hero_aciklama}
                  onChange={(e) => setSiteSettings({...siteSettings, hero_aciklama: e.target.value})}
                  className="w-full bg-transparent border-2 border-dashed border-primary/50 focus:border-primary focus:bg-surface-container-low/50 outline-none resize-none text-on-surface/80 text-xl md:text-2xl max-w-2xl leading-relaxed font-medium rounded-2xl p-2"
                  rows={3}
                />
              ) : (
                <p className="text-on-surface/80 text-xl md:text-2xl max-w-2xl leading-relaxed font-medium">
                  {siteSettings.hero_aciklama}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-5 pt-6">
              <button 
                onClick={(e) => {
                  if (isEditMode) {
                    e.preventDefault();
                    return;
                  }
                  handleDownload(e);
                }}
                disabled={isDownloading && !isEditMode}
                className={`group relative overflow-hidden px-10 py-5 rounded-2xl font-bold flex items-center justify-center gap-4 transition-all active:scale-95 min-w-[280px] ${
                  downloadComplete 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                    : 'bg-primary text-on-primary hover:scale-[1.05] hover:shadow-2xl hover:shadow-primary/40'
                } disabled:opacity-90 disabled:cursor-wait`}
              >
                <AnimatePresence mode="wait">
                  {isDownloading ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-3"
                    >
                      <Loader2 className="animate-spin" size={24} />
                      <span>Sürüm {releaseData.version} indiriliyor...</span>
                    </motion.div>
                  ) : downloadComplete ? (
                    <motion.div
                      key="complete"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-3"
                    >
                      <CheckCircle2 size={24} />
                      <span>İndirme Başlatıldı!</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="default"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-3"
                    >
                      <Download size={24} />
                      {isEditMode ? (
                        <input
                          type="text"
                          value={siteSettings.indirme_butonu_metni}
                          onChange={(e) => setSiteSettings({...siteSettings, indirme_butonu_metni: e.target.value})}
                          className="bg-transparent border-b-2 border-dashed border-white/50 focus:border-white outline-none w-32 text-center"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span>{siteSettings.indirme_butonu_metni}</span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Progress bar background animation during download */}
                {isDownloading && (
                  <motion.div 
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ 
                      duration: 3.8, 
                      ease: [0.22, 1, 0.36, 1] // Custom cubic-bezier for a more dynamic "fast start, slow end" feel
                    }}
                    className="absolute bottom-0 left-0 h-1 bg-white/40 w-full"
                  />
                )}
              </button>
              
              <div className="relative overflow-hidden bg-surface-container-high text-on-surface px-10 py-5 rounded-2xl font-bold flex items-center justify-center cursor-default min-w-[180px] border border-outline-variant/20">
                {isEditMode ? (
                  <div className="flex flex-col gap-1 z-10">
                    <input
                      type="text"
                      value={siteSettings.hero_buton_metni}
                      onChange={(e) => setSiteSettings({...siteSettings, hero_buton_metni: e.target.value})}
                      className="bg-transparent border-b-2 border-dashed border-primary/50 focus:border-primary outline-none w-24 text-center text-xs"
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Normal"
                    />
                    <input
                      type="text"
                      value={siteSettings.hero_buton_metni_alternatif}
                      onChange={(e) => setSiteSettings({...siteSettings, hero_buton_metni_alternatif: e.target.value})}
                      className="bg-transparent border-b-2 border-dashed border-primary/50 focus:border-primary outline-none w-24 text-center text-xs"
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Alternatif"
                    />
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={subscribeBtnText}
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 50, opacity: 0 }}
                      transition={{ duration: 0.6, ease: "easeInOut" }}
                      className="whitespace-nowrap"
                    >
                      {subscribeBtnText}
                    </motion.span>
                  </AnimatePresence>
                )}
              </div>
            </div>
          </motion.div>

          {siteSettings.hero_gorseller.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: "backOut" }}
              className="lg:col-span-5 relative"
            >
              <HeroImageCarousel images={siteSettings.hero_gorseller} />
              {/* Decorative Orbs */}
              <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary/30 rounded-full blur-3xl animate-pulse" />
              <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
            </motion.div>
          )}
        </div>
      </header>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-outline-variant/10 bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto flex justify-center items-center">
          <p className="text-sm text-on-surface/50 font-medium text-center">
            © 2024 CYLK Sohbet. Tüm hakları saklıdır.
          </p>
        </div>
      </footer>

      {/* Login Modal */}
      <AnimatePresence>
        {isLoginOpen && <LoginModal onClose={() => setIsLoginOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
