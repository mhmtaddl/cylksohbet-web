import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff, ShieldCheck, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';

interface LoginModalProps {
  onClose: () => void;
  btnColor?: string;
  clickPos?: { x: number; y: number };
}

export const LoginModal = ({ onClose, btnColor = 'rgba(124, 58, 237, 0.92)', clickPos }: LoginModalProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        if (!isVerifying) {
          if (password !== confirmPassword) {
            throw new Error('Şifreler eşleşmiyor!');
          }
          if (password.length < 6) {
            throw new Error('Şifre en az 6 karakter olmalıdır.');
          }

          const { error } = await supabase.auth.signUp({ email, password });
          if (error) throw error;

          setIsVerifying(true);
          setCooldown(30);
        } else {
          const { data, error } = await supabase.auth.verifyOtp({
            email,
            token: verificationCode,
            type: 'signup',
          });
          if (error) throw error;

          if (data.user) {
            const { error: profileError } = await supabase
              .from('profiles')
              .insert([{ id: data.user.id, email: data.user.email, is_approved: false }]);
            if (profileError) console.error('Profile creation error:', profileError);
            await supabase.auth.signOut();
          }

          setSuccess('Kaydınız alındı! Yönetici onayından sonra giriş yapabilirsiniz.');
          setTimeout(() => onClose(), 3000);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          throw new Error('Giriş başarısız: E-posta veya şifre hatalı.');
        }

        if (data.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('is_approved')
            .eq('id', data.user.id)
            .single();

          if (profileError || !profile) {
            await supabase.auth.signOut();
            throw new Error('Profil bulunamadı. Lütfen yönetici ile iletişime geçin.');
          }

          if (profile.is_approved === false) {
            await supabase.auth.signOut();
            throw new Error('Üyelik onayınızı bekliyor. Lütfen yöneticinin onaylamasını bekleyin.');
          }
        }

        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (cooldown > 0) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
      setCooldown(30);
      setSuccess('Yeni kod gönderildi!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full py-4 bg-white/10 border border-white/15 rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/30 transition-all text-white placeholder:text-white/30 text-sm";

  // Modal genişliği ~384px (max-w-sm), yüksekliği ~480px civarı
  const modalW = 384;
  const modalH = 500;
  const pad = 12;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 800;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 600;
  const rawX = clickPos ? clickPos.x : vw - pad - modalW;
  const rawY = clickPos ? clickPos.y : 80;
  const posX = Math.min(Math.max(pad, rawX), vw - modalW - pad);
  const posY = Math.min(Math.max(pad, rawY), vh - modalH - pad);

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      <div className="absolute inset-0 pointer-events-auto" onClick={onClose} />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        style={{ left: posX, top: posY }}
        className="absolute w-full max-w-sm bg-black/55 backdrop-blur-xl border border-white/15 rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden pointer-events-auto"
      >
        <div className="p-6 space-y-6">
          {/* Başlık */}
          <div className="flex items-center justify-between">
            <h2 className="font-headline text-2xl font-black text-white">
              {isVerifying ? 'Doğrulama' : isSignUp ? 'Kayıt Ol' : 'Giriş Yap'}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-xl transition-colors text-white/60 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            {error && (
              <div className="flex items-center gap-3 p-3.5 bg-red-500/15 text-red-300 rounded-2xl text-sm border border-red-500/20">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-3 p-3.5 bg-emerald-500/15 text-emerald-300 rounded-2xl text-sm border border-emerald-500/20">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <div className="space-y-4">
              <AnimatePresence mode="wait">
                {isVerifying ? (
                  <motion.div
                    key="verify"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <p className="text-sm text-white/50 text-center">
                      Kod şuraya gönderildi: <span className="font-bold text-white">{email}</span>
                    </p>
                    <div className="relative">
                      <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                      <input
                        type="text"
                        required
                        maxLength={8}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                        className={`${inputClass} pl-12 pr-4 text-center text-2xl tracking-[0.5em] font-black`}
                        placeholder="00000000"
                        autoFocus
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-white/40 mb-2">E-postanıza gönderilen 8 haneli kodu girin.</p>
                      <button
                        type="button"
                        onClick={handleResendCode}
                        disabled={loading || cooldown > 0}
                        className="flex items-center gap-2 mx-auto text-xs font-bold text-white/60 hover:text-white disabled:opacity-40 transition-colors"
                      >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        {cooldown > 0 ? `Kodu Tekrar Gönder (${cooldown}s)` : 'Kodu Tekrar Gönder'}
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="auth"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-4"
                  >
                    {/* E-posta */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">E-posta</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={`${inputClass} pl-11 pr-4`}
                          placeholder="ornek@mail.com"
                        />
                      </div>
                    </div>

                    {/* Şifre */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Şifre</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className={`${inputClass} pl-11 pr-12`}
                          placeholder="••••••••"
                        />
                        <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Şifre tekrar (kayıt) */}
                    {isSignUp && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Şifre Tekrar</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`${inputClass} pl-11 pr-12`}
                            placeholder="••••••••"
                          />
                          <button type="button" tabIndex={-1} onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors">
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Ana buton — arka plan fotoğrafının rengiyle */}
            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: btnColor }}
              className="w-full py-4 rounded-2xl font-bold hover:brightness-110 transition-all active:scale-95 shadow-2xl flex items-center justify-center gap-3 disabled:opacity-60 text-white"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={22} />
              ) : (
                <span>{isVerifying ? 'Doğrula' : isSignUp ? 'Hesap Oluştur' : 'Giriş Yap'}</span>
              )}
            </button>
          </form>

          {!isVerifying && (
            <div className="text-center">
              <button
                onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
                className="text-sm font-bold text-white/50 hover:text-white transition-colors"
              >
                {isSignUp ? 'Zaten hesabınız var mı? Giriş yapın' : 'Hesabınız yok mu? Kayıt olun'}
              </button>
            </div>
          )}

          {isVerifying && (
            <div className="text-center">
              <button
                onClick={() => { setIsVerifying(false); setError(null); }}
                className="text-sm font-bold text-white/40 hover:text-white transition-colors"
              >
                Geri Dön
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
