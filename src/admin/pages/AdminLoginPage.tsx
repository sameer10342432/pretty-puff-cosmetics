import React, { useState } from 'react';
import { Lock, Mail, Sparkles, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { api } from '../../services/api';

export const AdminLoginPage: React.FC = () => {
  const { login } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid email or password credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseDemo = () => {
    setEmail('sameerliaqat81@gmail.com');
    setPassword('Admin@PrettyPuff2026');
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    try {
      await api.auth.forgotPassword(forgotEmail);
      setForgotSuccess(true);
    } catch {
      setForgotSuccess(true); // Always display success for security
    }
  };

  return (
    <div className="min-h-screen bg-[#141418] text-gray-100 flex items-center justify-center p-4 selection:bg-[#C24560] selection:text-white">
      <div className="w-full max-w-md bg-[#1C1C22] border border-[#2E2E38] rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#C24560]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center mb-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C24560]/20 text-[#F8CAD1] border border-[#C24560]/30 text-xs font-semibold uppercase tracking-widest mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pretty Puff Portal</span>
          </div>
          <h1 className="font-serif text-3xl text-white tracking-wide">Welcome Back</h1>
          <p className="text-xs text-gray-400 mt-1.5">
            Log in to manage your luxury cosmetics storefront, orders, and catalog.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-950/50 border border-red-800/60 text-xs text-red-200">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="sameerliaqat81@gmail.com"
                className="w-full pl-10 pr-4 py-2.5 bg-[#25252E] border border-[#3A3A46] rounded-xl text-sm text-white focus:outline-none focus:border-[#C24560] placeholder-gray-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-300">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-xs text-[#F8CAD1] hover:underline"
              >
                Forgot?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-[#25252E] border border-[#3A3A46] rounded-xl text-sm text-white focus:outline-none focus:border-[#C24560] placeholder-gray-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 bg-[#C24560] hover:bg-[#A3354E] text-white text-xs font-semibold uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Account Helper */}
        <div className="mt-6 pt-6 border-t border-[#2E2E38] text-center">
          <button
            type="button"
            onClick={handleUseDemo}
            className="inline-flex items-center gap-2 text-xs text-[#F8CAD1] hover:text-white px-3 py-1.5 rounded-lg bg-[#25252E] border border-[#3A3A46] transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Autofill Super Admin Demo Credentials</span>
          </button>
        </div>

        {/* Return to website */}
        <div className="mt-4 text-center">
          <a href="/" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
            ← Return to Pretty Puff customer store
          </a>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#1C1C22] border border-[#2E2E38] rounded-2xl p-6 text-left">
            <h3 className="text-lg font-serif text-white mb-2">Reset Admin Password</h3>
            {forgotSuccess ? (
              <div className="space-y-4">
                <p className="text-xs text-green-300">
                  Password reset instructions have been dispatched if this account exists.
                </p>
                <button
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotSuccess(false);
                  }}
                  className="w-full py-2 bg-[#25252E] text-white text-xs rounded-lg"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <p className="text-xs text-gray-400">
                  Enter your registered admin email address to receive reset instructions.
                </p>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  placeholder="admin@prettypuff.pk"
                  className="w-full px-3 py-2 bg-[#25252E] border border-[#3A3A46] rounded-lg text-sm text-white focus:outline-none focus:border-[#C24560]"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-2 bg-[#25252E] text-gray-300 text-xs rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-[#C24560] text-white text-xs rounded-lg font-semibold"
                  >
                    Send Instructions
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
