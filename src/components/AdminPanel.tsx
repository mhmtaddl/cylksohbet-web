import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, Loader2, AlertCircle, UserCheck, Shield, Upload, Image as ImageIcon, KeyRound, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { sanitizeHeroImages } from '../lib/siteSettings';

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

const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;

export const AdminPanel = ({ onClose, onSave, onStartEditMode, btnColor = 'rgba(124, 58, 237, 0.92)' }: AdminPanelProps) => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [settings, setSettings] = useState<SiteSettings>({
    logo_url: '',
    hero_baslik: 'Caylaklar ile Sohbete Doğru',
    hero_aciklama: 'Güvenli ve hızlı bağlantı sunan modern bir sesli sohbet uygulamasıdır.',
    hero_gorseller: [],
    navigasyon_butonu_metni: 'Giriş Yap',
    hero_buton_metni: 'Abone Ol',
    hero_buton_metni_alternatif: 'Yakında..',
    indirme_butonu_metni: 'Hemen İndir'
  });
  const [activeTab, setActiveTab] = useState<'users' | 'settings' | 'account'>('users');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Hesap sekmesi state
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [accountMsg, setAccountMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => { fetchData(); }, []);

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
          hero_gorseller: sanitizeHeroImages(settingsRes.data.hero_gorseller),
          navigasyon_butonu_metni: settingsRes.data.navigasyon_butonu_metni || settingsRes.data.nav_buton_metni || 'Giriş Yap',
          hero_buton_metni: settingsRes.data.hero_buton_metni || 'Abone Ol',
          hero_buton_metni_alternatif: settingsRes.data.hero_buton_metni_alternatif || settingsRes.data.hero_buton_metni_alt || 'Yakında..',
          indirme_butonu_metni: settingsRes.data.indirme_butonu_metni || settingsRes.data.indirme_buton_metni || 'Hemen İndir',
          updated_at: settingsRes.data.updated_at
        });
      }
    } catch (err: any) {
      setError(err.message?.includes('relation "profiles"') ? 'yok' : err.message);
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
        hero_gorseller: sanitizeHeroImages(settings.hero_gorseller),
        navigasyon_butonu_metni: settings.navigasyon_butonu_metni,
        hero_buton_metni: settings.hero_buton_metni,
        hero_buton_metni_alternatif: settings.hero_buton_metni_alternatif,
        indirme_butonu_metni: settings.indirme_butonu_metni
      };
      if (settings.id) payload.id = settings.id;

      let { error } = await supabase.from('site_ayarlari').upsert(payload);
      if (error && (error.code === 'PGRST204' || error.code === '42703' || error.message?.includes('column'))) {
        const fallback: any = { ...payload, nav_buton_metni: payload.navigasyon_butonu_metni, hero_buton_metni_alt: payload.hero_buton_metni_alternatif, indirme_buton_metni: payload.indirme_butonu_metni };
        delete fallback.navigasyon_butonu_metni; delete fallback.hero_buton_metni_alternatif; delete fallback.indirme_butonu_metni;
        const res = await supabase.from('site_ayarlari').upsert(fallback);
        error = res.error;
      }
      if (error) throw error;
      alert('Ayarlar başarıyla kaydedildi!');
      if (onSave) onSave();
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail) return;
    setActionLoading('email');
    setAccountMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      setAccountMsg({ type: 'success', text: 'Doğrulama e-postası gönderildi. Yeni e-postanızı onaylayın.' });
      setNewEmail('');
    } catch (err: any) {
      setAccountMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmNewPassword) {
      setAccountMsg({ type: 'error', text: 'Yeni şifreler eşleşmiyor.' });
      return;
    }
    if (newPassword.length < 6) {
      setAccountMsg({ type: 'error', text: 'Şifre en az 6 karakter olmalıdır.' });
      return;
    }
    setActionLoading('password');
    setAccountMsg(null);
    try {
      // Re-auth with current password first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('Kullanıcı bulunamadı.');
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
      if (signInErr) throw new Error('Mevcut şifre hatalı.');
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setAccountMsg({ type: 'success', text: 'Şifre başarıyla değiştirildi.' });
      setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword('');
    } catch (err: any) {
      setAccountMsg({ type: 'error', text: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const addHeroImage = () => setSettings(prev => ({ ...prev, hero_gorseller: [...prev.hero_gorseller, ''] }));
  const removeHeroImage = (i: number) => setSettings(prev => ({ ...prev, hero_gorseller: prev.hero_gorseller.filter((_, idx) => idx !== i) }));
  const updateHeroImage = (i: number, v: string) => setSettings(prev => ({ ...prev, hero_gorseller: prev.hero_gorseller.map((img, idx) => idx === i ? v : img) }));

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'hero', index?: number) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const uploadId = type === 'logo' ? 'logo' : `hero-${index}`;
    setUploading(uploadId);
    setError(null);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${type}/${Math.random().toString(36).substring(2)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('site-assets').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('site-assets').getPublicUrl(filePath);
      if (type === 'logo') setSettings(prev => ({ ...prev, logo_url: publicUrl }));
      else if (typeof index === 'number') updateHeroImage(index, publicUrl);
    } catch (err: any) {
      setError(`Yükleme hatası: ${err.message}`);
    } finally {
      setUploading(null);
    }
  };

  const handleApprove = async (userId: string) => {
    setActionLoading(userId);
    try {
      const { error } = await supabase.from('profiles').update({ is_approved: true }).eq('id', userId);
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

  const inputClass = "w-full bg-white/10 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/35 transition-colors";
  const tabClass = (tab: string) => `text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === tab ? 'text-white' : 'text-white/30 hover:text-white/60'}`;

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
        {/* Header */}
        <div className="p-8 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl" style={{ backgroundColor: `${btnColor}22` }}>
              <Shield size={24} style={{ color: btnColor }} />
            </div>
            <div>
              <h2 className="font-headline text-2xl font-black text-white">Yönetici Paneli</h2>
              <div className="flex gap-4 mt-1">
                <button onClick={() => setActiveTab('users')} className={tabClass('users')}
                  style={activeTab === 'users' ? { color: btnColor } : {}}>Üyeler</button>
                <button onClick={() => setActiveTab('settings')} className={tabClass('settings')}
                  style={activeTab === 'settings' ? { color: btnColor } : {}}>Görsel Ayarlar</button>
                <button onClick={() => setActiveTab('account')} className={tabClass('account')}
                  style={activeTab === 'account' ? { color: btnColor } : {}}>Hesap</button>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/60 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8">
          {error === 'yok' ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <AlertCircle size={40} className="text-red-400" />
              <p className="text-white font-bold text-lg">Veritabanı tablosu bulunamadı</p>
              <p className="text-white/40 text-xs max-w-xs">SQL komutlarını Supabase'de çalıştırın.</p>
            </div>
          ) : error ? (
            <div className="mb-6 flex items-center gap-3 p-4 bg-red-500/15 text-red-300 rounded-2xl text-sm border border-red-500/20">
              <AlertCircle size={18} /><span>{error}</span>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin" size={40} style={{ color: btnColor }} />
              <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Yükleniyor...</p>
            </div>

          ) : activeTab === 'account' ? (
            /* ── HESAP sekmesi ── */
            <div className="space-y-8 max-w-md mx-auto">
              {accountMsg && (
                <div className={`flex items-center gap-3 p-4 rounded-2xl text-sm border ${accountMsg.type === 'success' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20' : 'bg-red-500/15 text-red-300 border-red-500/20'}`}>
                  {accountMsg.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                  <span>{accountMsg.text}</span>
                </div>
              )}

              {/* E-posta değiştir */}
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                  <Mail size={14} /> E-posta Değiştir
                </h3>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Yeni e-posta adresi"
                  className={inputClass}
                />
                <button
                  onClick={handleChangeEmail}
                  disabled={actionLoading === 'email' || !newEmail}
                  style={{ backgroundColor: btnColor }}
                  className="w-full py-3 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2 hover:brightness-110 transition-all active:scale-95 disabled:opacity-50"
                >
                  {actionLoading === 'email' ? <Loader2 className="animate-spin" size={18} /> : <Mail size={18} />}
                  E-posta Güncelle
                </button>
              </div>

              <div className="border-t border-white/10" />

              {/* Şifre değiştir */}
              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                  <KeyRound size={14} /> Şifre Değiştir
                </h3>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Mevcut şifre"
                  className={inputClass}
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Yeni şifre"
                  className={inputClass}
                />
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Yeni şifre tekrar"
                  className={inputClass}
                />
                <button
                  onClick={handleChangePassword}
                  disabled={actionLoading === 'password' || !currentPassword || !newPassword}
                  style={{ backgroundColor: btnColor }}
                  className="w-full py-3 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2 hover:brightness-110 transition-all active:scale-95 disabled:opacity-50"
                >
                  {actionLoading === 'password' ? <Loader2 className="animate-spin" size={18} /> : <KeyRound size={18} />}
                  Şifreyi Güncelle
                </button>
              </div>
            </div>

          ) : activeTab === 'settings' ? (
            /* ── GÖRSEL AYARLAR sekmesi ── */
            <div className="space-y-8">
              <div className="flex items-center justify-between p-6 rounded-3xl border" style={{ backgroundColor: `${btnColor}18`, borderColor: `${btnColor}33` }}>
                <div>
                  <h3 className="text-lg font-black text-white mb-1">Görsel Düzenleyici</h3>
                  <p className="text-sm text-white/50">Ana sayfa üzerinde metinleri ve butonları düzenleyin.</p>
                </div>
                <button onClick={onStartEditMode} style={{ backgroundColor: btnColor }}
                  className="px-6 py-3 rounded-2xl font-bold text-white hover:brightness-110 transition-all active:scale-95 flex items-center gap-2">
                  <ImageIcon size={18} /> Düzenleyiciyi Başlat
                </button>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-white/40">Site Ayarları</h3>
                <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-6">
                  {/* Logo */}
                  <div className="flex items-center gap-4">
                    <img src={settings.logo_url} alt="Logo" className="w-12 h-12 rounded-xl object-cover border border-white/15" />
                    <div className="flex-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1 block">Logo URL</label>
                      <div className="flex gap-2">
                        <input type="text" value={settings.logo_url}
                          onChange={(e) => setSettings(prev => ({ ...prev, logo_url: e.target.value }))}
                          className={inputClass} />
                        <label className="cursor-pointer p-2.5 rounded-xl flex items-center justify-center min-w-[44px] hover:brightness-110 transition-all"
                          style={{ backgroundColor: `${btnColor}33`, color: btnColor }}>
                          {uploading === 'logo' ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1 block">Hero Başlık</label>
                      <input type="text" value={settings.hero_baslik}
                        onChange={(e) => setSettings(prev => ({ ...prev, hero_baslik: e.target.value }))}
                        className={inputClass} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1 block">Hero Açıklama</label>
                      <textarea value={settings.hero_aciklama}
                        onChange={(e) => setSettings(prev => ({ ...prev, hero_aciklama: e.target.value }))}
                        rows={3} className={`${inputClass} resize-none`} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10">
                    {[
                      { label: 'Navigasyon Butonu', key: 'navigasyon_butonu_metni' },
                      { label: 'İndirme Butonu', key: 'indirme_butonu_metni' },
                      { label: 'Hero Butonu (Normal)', key: 'hero_buton_metni' },
                      { label: 'Hero Butonu (Alternatif)', key: 'hero_buton_metni_alternatif' },
                    ].map(({ label, key }) => (
                      <div key={key}>
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1 block">{label}</label>
                        <input type="text" value={(settings as any)[key]}
                          onChange={(e) => setSettings(prev => ({ ...prev, [key]: e.target.value }))}
                          className={inputClass} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Hero görselleri */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-widest text-white/40">Hero Görselleri</h3>
                  <button onClick={addHeroImage} style={{ color: btnColor }}
                    className="text-[10px] font-black uppercase tracking-widest hover:brightness-125 transition-all">
                    + Yeni Ekle
                  </button>
                </div>
                <div className="space-y-3">
                  {settings.hero_gorseller.map((img, idx) => (
                    <div key={idx} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4">
                      <img src={img} alt={`Hero ${idx}`} className="w-16 h-10 rounded-lg object-cover border border-white/15" />
                      <div className="flex-1 flex gap-2">
                        <input type="text" value={img}
                          onChange={(e) => updateHeroImage(idx, e.target.value)}
                          placeholder="Görsel URL"
                          className={`${inputClass} text-xs`} />
                        <label className="cursor-pointer p-2 rounded-xl flex items-center justify-center min-w-[40px] hover:brightness-110 transition-all"
                          style={{ backgroundColor: `${btnColor}33`, color: btnColor }}>
                          {uploading === `hero-${idx}` ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'hero', idx)} />
                        </label>
                      </div>
                      <button onClick={() => removeHeroImage(idx)}
                        className="p-2 text-red-400 hover:bg-red-500/15 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={handleSaveSettings} disabled={actionLoading === 'settings'}
                style={{ backgroundColor: btnColor }}
                className="w-full py-4 font-black uppercase tracking-widest text-sm text-white rounded-2xl hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60">
                {actionLoading === 'settings' ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                Ayarları Kaydet
              </button>
            </div>

          ) : users.length === 0 ? (
            /* ── Boş üyeler ── */
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <UserCheck size={40} className="text-white/20" />
              <p className="text-white/60 font-bold">Kayıtlı üye bulunmuyor</p>
            </div>

          ) : (
            /* ── ÜYE LİSTESİ ── */
            <div className="space-y-4">
              {users.map((user) => (
                <motion.div layout key={user.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/8 transition-colors"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm">{user.email}</span>
                      {user.email === adminEmail && (
                        <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-full border"
                          style={{ backgroundColor: `${btnColor}22`, color: btnColor, borderColor: `${btnColor}44` }}>
                          Admin
                        </span>
                      )}
                      {user.is_approved === false ? (
                        <span className="px-2 py-0.5 bg-yellow-500/15 text-yellow-400 text-[10px] font-black uppercase rounded-full border border-yellow-500/20">Beklemede</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-400 text-[10px] font-black uppercase rounded-full border border-emerald-500/20">Onaylı</span>
                      )}
                    </div>
                    <span className="text-xs text-white/30">
                      {new Date(user.created_at).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {user.is_approved === false && (
                      <button onClick={() => handleApprove(user.id)} disabled={!!actionLoading}
                        style={{ backgroundColor: `${btnColor}22`, color: btnColor }}
                        className="p-3 rounded-2xl transition-all disabled:opacity-50 hover:brightness-125"
                        title="Onayla">
                        {actionLoading === user.id ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                      </button>
                    )}
                    {/* Admin kendi hesabını silemez */}
                    {user.email !== adminEmail && (
                      <button onClick={() => handleDelete(user.id)} disabled={!!actionLoading}
                        className="p-3 bg-red-500/15 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl transition-all disabled:opacity-50"
                        title="Sil">
                        <Trash2 size={20} />
                      </button>
                    )}
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
