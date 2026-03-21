import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, Loader2, AlertCircle, Eye, EyeOff, ShieldCheck, ArrowRight, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';

interface LoginModalProps {
  onClose: () => void;
}

export const LoginModal = ({ onClose }: LoginModalProps) => {
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
  const [cooldown, setCooldown] = useState(0);

  // Cooldown timer for resending code
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
          // Step 1: Sign Up with Password
          if (password !== confirmPassword) {
            throw new Error('Şifreler eşleşmiyor!');
          }
          if (password.length < 6) {
            throw new Error('Şifre en az 6 karakter olmalıdır.');
          }

          const { error } = await supabase.auth.signUp({
            email,
            password,
          });
          if (error) throw error;
          
          setIsVerifying(true);
          setCooldown(30);
        } else {
          // Step 2: Verify OTP
          const { data, error } = await supabase.auth.verifyOtp({
            email,
            token: verificationCode,
            type: 'signup',
          });
          if (error) throw error;
          
          // Create profile with pending status
          if (data.user) {
            const { error: profileError } = await supabase
              .from('profiles')
              .insert([
                { id: data.user.id, email: data.user.email, status: 'pending' }
              ]);
            if (profileError) {
              console.error('Profile creation error:', profileError);
              // We don't throw here to not block the user if profile fails but auth worked, 
              // but ideally we should handle it.
            }
          }

          alert('Kaydınız alındı! Yönetici onayından sonra giriş yapabilirsiniz.');
          onClose();
        }
      } else {
        // Login with Password
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        // Admin check
        const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
        const isAdmin = adminEmail && data.user?.email === adminEmail;

        if (!isAdmin) {
          // Check profile status for non-admin users
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('status')
            .eq('id', data.user.id)
            .single();

          if (profileError || !profile || profile.status === 'pending') {
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
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      if (error) throw error;
      setCooldown(30);
      alert('Yeni kod gönderildi!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Transparent Backdrop */}
      <div 
        className="absolute inset-0 pointer-events-auto" 
        onClick={onClose}
      />

      {/* Popover Bubble */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: -20, x: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0, x: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: -20, x: 20 }}
        className="absolute top-20 right-6 w-full max-w-sm bg-surface-container-lowest border border-outline-variant/20 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden pointer-events-auto"
      >
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-headline text-2xl font-black text-on-surface">
              {isVerifying ? 'Doğrulama' : isSignUp ? 'Kayıt Ol' : 'Giriş Yap'}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-surface-container-high rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            {error && (
              <div className="flex items-center gap-3 p-4 bg-error-container text-on-error-container rounded-2xl text-sm border border-error/20">
                <AlertCircle size={18} />
                <span>{error}</span>
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
                    <div className="space-y-2 text-center">
                      <p className="text-sm text-on-surface/60">
                        Kod şuraya gönderildi: <span className="font-bold text-primary">{email}</span>
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-on-surface/50 ml-1">
                        8 Haneli Kod
                      </label>
                      <div className="relative">
                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface/40" size={20} />
                        <input
                          type="text"
                          required
                          maxLength={8}
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                          className="w-full pl-12 pr-4 py-4 bg-surface-container-high border border-outline-variant/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-center text-2xl tracking-[0.5em] font-black"
                          placeholder="00000000"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-on-surface/60 mb-2">
                        E-postanıza gönderilen 8 haneli kodu girin.
                      </p>
                      <button
                        type="button"
                        onClick={handleResendCode}
                        disabled={loading || cooldown > 0}
                        className="flex items-center gap-2 mx-auto text-xs font-bold text-primary hover:underline disabled:opacity-50"
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
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-on-surface/50 ml-1">
                        E-posta
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface/40" size={20} />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 bg-surface-container-high border border-outline-variant/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                          placeholder="ornek@mail.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-on-surface/50 ml-1">
                        Şifre
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface/40" size={20} />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-12 pr-12 py-4 bg-surface-container-high border border-outline-variant/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface/40 hover:text-primary transition-colors"
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>

                    {isSignUp && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="space-y-2"
                      >
                        <label className="text-xs font-bold uppercase tracking-widest text-on-surface/50 ml-1">
                          Şifre Tekrar
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface/40" size={20} />
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full pl-12 pr-12 py-4 bg-surface-container-high border border-outline-variant/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface/40 hover:text-primary transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-primary text-on-primary rounded-2xl font-bold hover:scale-[1.02] transition-all active:scale-95 shadow-xl shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <span>
                  {isVerifying ? 'Doğrula' : isSignUp ? 'Hesap Oluştur' : 'Giriş Yap'}
                </span>
              )}
            </button>
          </form>

          {!isVerifying && (
            <div className="text-center">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                }}
                className="text-sm font-bold text-primary hover:underline"
              >
                {isSignUp ? 'Zaten hesabınız var mı? Giriş yapın' : 'Hesabınız yok mu? Kayıt olun'}
              </button>
            </div>
          )}
          
          {isVerifying && (
            <div className="text-center">
              <button
                onClick={() => {
                  setIsVerifying(false);
                  setError(null);
                }}
                className="text-sm font-bold text-on-surface/40 hover:text-primary"
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
