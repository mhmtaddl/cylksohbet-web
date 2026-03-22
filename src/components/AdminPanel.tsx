import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, Loader2, AlertCircle, UserCheck, Shield, Upload, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  email: string;
  is_approved: boolean;
  created_at: string;
}

interface SiteSettings {
  id?: string;
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

interface AdminPanelProps {
  onClose: () => void;
  onSave?: () => void;
  onStartEditMode?: () => void;
  btnColor?: string;
}

export const AdminPanel = ({ onClose, onSave, onStartEditMode, btnColor = 'rgba(124, 58, 237, 0.92)' }: AdminPanelProps) => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [settings, setSettings] = useState<SiteSettings>({
    logo_url: 'https://picsum.photos/seed/cylk-logo-v2/200/200',
    hero_baslik: 'Caylaklar ile Sohbete Doğru',
    hero_aciklama: 'Güvenli ve hızlı bağlantı sunan modern bir sesli sohbet uygulamasıdır. VPN derdine son veren kesintisiz iletişim altyapısı.',
    hero_gorseller: ['https://picsum.photos/seed/chat-app-v2/1000/800'],
    navigasyon_butonu_metni: 'Giriş Yap',
    hero_buton_metni: 'Abone Ol',
    hero_buton_metni_alternatif: 'Yakında..',
    indirme_butonu_metni: 'Hemen İndir'
  });
  const [activeTab, setActiveTab] = useState<'users' | 'settings'>('users');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, settingsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('site_ayarlari').select('*').limit(1).single()
      ]);

      if (usersRes.error) throw usersRes.error;
      setUsers(usersRes.data || []);

      if (settingsRes.data) {
        setSettings({
          id: settingsRes.data.id,
          logo_url: settingsRes.data.logo_url,
          hero_baslik: settingsRes.data.hero_baslik,
          hero_aciklama: settingsRes.data.hero_aciklama,
          hero_gorseller: settingsRes.data.hero_gorseller || [],
          navigasyon_butonu_metni: settingsRes.data.navigasyon_butonu_metni || settingsRes.data.nav_buton_metni || 'Giriş Yap',
          hero_buton_metni: settingsRes.data.hero_buton_metni || 'Abone Ol',
          hero_buton_metni_alternatif: settingsRes.data.hero_buton_metni_alternatif || settingsRes.data.hero_buton_metni_alt || 'Yakında..',
          indirme_butonu_metni: settingsRes.data.indirme_butonu_metni || settingsRes.data.indirme_buton_metni || 'Hemen İndir',
          updated_at: settingsRes.data.updated_at
        });
      }
    } catch (err: any) {
      if (err.message?.includes('column profiles.is_approved does not exist') || err.message?.includes('relation "profiles" does not exist')) {
        setError('yok');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setActionLoading('settings');
    try {
      const payload: any = {
        logo_url: settings.logo_url,
        hero_baslik: settings.hero_baslik,
        hero_aciklama: settings.hero_aciklama,
        hero_gorseller: settings.hero_gorseller,
        navigasyon_butonu_metni: settings.navigasyon_butonu_metni,
        hero_buton_metni: settings.hero_buton_metni,
        hero_buton_metni_alternatif: settings.hero_buton_metni_alternatif,
        indirme_butonu_metni: settings.indirme_butonu_metni
      };

      // If we have an ID, we update that specific record
      if (settings.id) {
        payload.id = settings.id;
      }

      let { error } = await supabase
        .from('site_ayarlari')
        .upsert(payload);

      // Fallback if columns don't exist yet
      if (error && (error.code === 'PGRST204' || error.code === '42703' || error.message?.includes('column'))) {
        console.warn('Yeni kolonlar bulunamadı, eski şema ile kaydediliyor...');
        const fallbackPayload: any = {
          logo_url: settings.logo_url,
          hero_baslik: settings.hero_baslik,
          hero_aciklama: settings.hero_aciklama,
          hero_gorseller: settings.hero_gorseller,
          nav_buton_metni: settings.navigasyon_butonu_metni,
          hero_buton_metni: settings.hero_buton_metni,
          hero_buton_metni_alt: settings.hero_buton_metni_alternatif,
          indirme_buton_metni: settings.indirme_butonu_metni
        };
        if (settings.id) fallbackPayload.id = settings.id;

        const fallbackRes = await supabase
          .from('site_ayarlari')
          .upsert(fallbackPayload);
          
        error = fallbackRes.error;
      }

      if (error) throw error;
      alert('Ayarlar başarıyla kaydedildi!');
      if (onSave) onSave();
      fetchData(); // Refresh to get the ID if it was an insert
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const addHeroImage = () => {
    setSettings(prev => ({
      ...prev,
      hero_gorseller: [...prev.hero_gorseller, '']
    }));
  };

  const removeHeroImage = (index: number) => {
    setSettings(prev => ({
      ...prev,
      hero_gorseller: prev.hero_gorseller.filter((_, i) => i !== index)
    }));
  };

  const updateHeroImage = (index: number, value: string) => {
    setSettings(prev => ({
      ...prev,
      hero_gorseller: prev.hero_gorseller.map((img, i) => i === index ? value : img)
    }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'hero', index?: number) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const uploadId = type === 'logo' ? 'logo' : `hero-${index}`;
    setUploading(uploadId);
    setError(null);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${type}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('site-assets')
        .getPublicUrl(filePath);

      if (type === 'logo') {
        setSettings(prev => ({ ...prev, logo_url: publicUrl }));
      } else if (typeof index === 'number') {
        updateHeroImage(index, publicUrl);
      }
    } catch (err: any) {
      setError(`Yükleme hatası: ${err.message}. Lütfen 'site-assets' bucket'ının oluşturulduğundan emin olun.`);
    } finally {
      setUploading(null);
    }
  };

  const handleApprove = async (userId: string) => {
    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: true })
        .eq('id', userId);

      if (error) throw error;
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_approved: true } : u));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Bu üyeyi silmek istediğinize emin misiniz?')) return;
    setActionLoading(userId);
    try {
      const { error } = await supabase.rpc('delete_user_completely', { user_id: userId });
      if (error) throw error;
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/50 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl bg-black/60 backdrop-blur-xl border border-white/15 rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="p-8 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
              <Shield size={24} />
            </div>
            <div>
              <h2 className="font-headline text-2xl font-black text-on-surface">Yönetici Paneli</h2>
              <div className="flex gap-4 mt-1">
                <button 
                  onClick={() => setActiveTab('users')}
                  className={`text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'users' ? 'text-primary' : 'text-on-surface/30 hover:text-on-surface/50'}`}
                >
                  Üyeler
                </button>
                <button 
                  onClick={() => setActiveTab('settings')}
                  className={`text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'settings' ? 'text-primary' : 'text-on-surface/30 hover:text-on-surface/50'}`}
                >
                  Görsel Ayarlar
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-container-high rounded-xl transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {error === 'yok' ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center">
                <AlertCircle size={32} />
              </div>
              <p className="text-on-surface font-bold text-lg">yok</p>
              <p className="text-on-surface/50 text-xs max-w-xs">
                Veritabanı tablosu veya 'is_approved' sütunu bulunamadı. Lütfen SQL komutlarını çalıştırın.
              </p>
            </div>
          ) : error ? (
            <div className="mb-6 flex items-center gap-3 p-4 bg-error-container text-on-error-container rounded-2xl text-sm border border-error/20">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin text-primary" size={40} />
              <p className="text-on-surface/50 font-bold uppercase tracking-widest text-xs">Yükleniyor...</p>
            </div>
          ) : activeTab === 'settings' ? (
            <div className="space-y-8">
              <div className="flex items-center justify-between bg-primary/10 p-6 rounded-3xl border border-primary/20">
                <div>
                  <h3 className="text-lg font-black text-on-surface mb-1">Görsel Düzenleyici</h3>
                  <p className="text-sm text-on-surface/60">Ana sayfa üzerinde doğrudan tıklayarak metinleri ve butonları düzenleyin.</p>
                </div>
                <button
                  onClick={onStartEditMode}
                  className="px-6 py-3 bg-primary text-on-primary rounded-2xl font-bold hover:bg-primary/90 transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-primary/20"
                >
                  <ImageIcon size={20} />
                  Düzenleyiciyi Başlat
                </button>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-on-surface/50">Site Ayarları</h3>
                <div className="p-6 bg-surface-container-low border border-outline-variant/10 rounded-3xl space-y-6">
                  <div className="flex items-center gap-4">
                    <img src={settings.logo_url} alt="Logo Preview" className="w-12 h-12 rounded-xl object-cover border border-outline-variant/20" />
                    <div className="flex-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface/40 mb-1 block">Logo URL</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={settings.logo_url}
                          onChange={(e) => setSettings(prev => ({ ...prev, logo_url: e.target.value }))}
                          className="flex-1 bg-surface-container-high border border-outline-variant/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary/30"
                        />
                        <label className="cursor-pointer p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors flex items-center justify-center min-w-[44px]">
                          {uploading === 'logo' ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface/40 mb-1 block">Hero Başlık</label>
                      <input 
                        type="text" 
                        value={settings.hero_baslik}
                        onChange={(e) => setSettings(prev => ({ ...prev, hero_baslik: e.target.value }))}
                        className="w-full bg-surface-container-high border border-outline-variant/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary/30"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface/40 mb-1 block">Hero Açıklama</label>
                      <textarea 
                        value={settings.hero_aciklama}
                        onChange={(e) => setSettings(prev => ({ ...prev, hero_aciklama: e.target.value }))}
                        rows={3}
                        className="w-full bg-surface-container-high border border-outline-variant/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary/30 resize-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-outline-variant/10">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface/40 mb-1 block">Navigasyon Butonu Metni</label>
                      <input 
                        type="text" 
                        value={settings.navigasyon_butonu_metni}
                        onChange={(e) => setSettings(prev => ({ ...prev, navigasyon_butonu_metni: e.target.value }))}
                        className="w-full bg-surface-container-high border border-outline-variant/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary/30"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface/40 mb-1 block">İndirme Butonu Metni</label>
                      <input 
                        type="text" 
                        value={settings.indirme_butonu_metni}
                        onChange={(e) => setSettings(prev => ({ ...prev, indirme_butonu_metni: e.target.value }))}
                        className="w-full bg-surface-container-high border border-outline-variant/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary/30"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface/40 mb-1 block">Hero Butonu Metni (Normal)</label>
                      <input 
                        type="text" 
                        value={settings.hero_buton_metni}
                        onChange={(e) => setSettings(prev => ({ ...prev, hero_buton_metni: e.target.value }))}
                        className="w-full bg-surface-container-high border border-outline-variant/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary/30"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface/40 mb-1 block">Hero Butonu Metni (Alternatif)</label>
                      <input 
                        type="text" 
                        value={settings.hero_buton_metni_alternatif}
                        onChange={(e) => setSettings(prev => ({ ...prev, hero_buton_metni_alternatif: e.target.value }))}
                        className="w-full bg-surface-container-high border border-outline-variant/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary/30"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-widest text-on-surface/50">Hero Görselleri</h3>
                  <button 
                    onClick={addHeroImage}
                    className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary-container transition-colors"
                  >
                    + Yeni Ekle
                  </button>
                </div>
                <div className="space-y-3">
                  {settings.hero_gorseller.map((img, idx) => (
                    <div key={idx} className="p-4 bg-surface-container-low border border-outline-variant/10 rounded-2xl flex items-center gap-4">
                      <img src={img} alt={`Hero ${idx}`} className="w-16 h-10 rounded-lg object-cover border border-outline-variant/20" />
                      <div className="flex-1 flex gap-2">
                        <input 
                          type="text" 
                          value={img}
                          onChange={(e) => updateHeroImage(idx, e.target.value)}
                          placeholder="Görsel URL"
                          className="flex-1 bg-surface-container-high border border-outline-variant/10 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-primary/30"
                        />
                        <label className="cursor-pointer p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors flex items-center justify-center min-w-[40px]">
                          {uploading === `hero-${idx}` ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'hero', idx)} />
                        </label>
                      </div>
                      <button 
                        onClick={() => removeHeroImage(idx)}
                        className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSaveSettings}
                disabled={actionLoading === 'settings'}
                className="w-full py-4 bg-primary text-on-primary font-black uppercase tracking-widest text-sm rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                {actionLoading === 'settings' ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                Ayarları Kaydet
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
              <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center text-on-surface/20">
                <UserCheck size={40} />
              </div>
              <div>
                <p className="text-on-surface font-bold text-lg">Kayıtlı üye bulunmuyor</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <motion.div
                  layout
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-5 bg-surface-container-low border border-outline-variant/10 rounded-3xl hover:bg-surface-container-high transition-colors group"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-on-surface">{user.email}</span>
                      {user.email === import.meta.env.VITE_ADMIN_EMAIL && (
                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-full border border-primary/20">
                          Admin
                        </span>
                      )}
                      {user.is_approved === false ? (
                        <span className="px-2 py-0.5 bg-warning/10 text-warning text-[10px] font-black uppercase rounded-full border border-warning/20">
                          Beklemede
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase rounded-full border border-emerald-500/20">
                          Onaylı
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-on-surface/40 font-medium">
                      {new Date(user.created_at).toLocaleDateString('tr-TR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {user.is_approved === false && (
                      <button
                        onClick={() => handleApprove(user.id)}
                        disabled={!!actionLoading}
                        className="p-3 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-2xl transition-all disabled:opacity-50"
                        title="Onayla"
                      >
                        {actionLoading === user.id ? (
                          <Loader2 className="animate-spin" size={20} />
                        ) : (
                          <Check size={20} />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(user.id)}
                      disabled={!!actionLoading}
                      className="p-3 bg-error/10 text-error hover:bg-error hover:text-white rounded-2xl transition-all disabled:opacity-50"
                      title="Sil"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
