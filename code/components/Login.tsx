import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { Button } from '@/components/ui/button'

interface LoginProps {
    onSwitchToRegister?: () => void;
}

const Login: React.FC<LoginProps> = ({ onSwitchToRegister }) => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const { t } = useLanguage();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Convert phone to email format for backend
            const email = phone.includes('@') ? phone : `${phone}@ikri.com`;
            await login(email, password);
        } catch (error) {
            console.error(error);
            if (error instanceof Error) {
                if (error.message === 'Account pending approval') {
                    alert(t('login.accountPendingApproval'));
                } else if (error.message === 'User not found') {
                    alert(t('login.userNotFound'));
                } else if (error.message === 'Invalid password') {
                    alert(t('login.invalidPassword'));
                } else {
                    alert(t('login.generalError'));
                }
            } else {
                alert(t('login.generalError'));
            }
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Green Background */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-500 via-emerald-500 to-emerald-600 p-12 flex-col justify-between relative overflow-hidden">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-white rounded-full -translate-x-1/3 -translate-y-1/3"></div>
                    <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-white rounded-full translate-x-1/3 translate-y-1/3"></div>
                </div>

                {/* Logo */}
                <div className="relative z-10">
                    <div className="flex items-center gap-3 text-white">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                            <svg className="w-8 h-8 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.53-.85-6-4.03-6-7.5V8.3l6-3.11 6 3.11v4.2c0 3.47-2.47 6.65-6 7.5z"/>
                                <path d="M9.5 11l-2 2 3.5 3.5 6-6-2-2-4 4z"/>
                            </svg>
                        </div>
                        <span className="text-3xl font-bold tracking-tight">YKRI</span>
                    </div>
                </div>

                {/* Welcome Message */}
                <div className="relative z-10 text-white space-y-4">
                    <h1 className="text-5xl font-bold leading-tight">
                        Bon retour<br />parmi nous
                    </h1>
                    <p className="text-xl text-white/90 leading-relaxed">
                        Accédez à votre compte pour gérer vos<br />
                        réservations et vos machines.
                    </p>
                </div>

                {/* Footer */}
                <div className="relative z-10 text-white/80 text-sm">
                    © 2024 YKRI - Tous droits réservés
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex justify-center mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                                <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.53-.85-6-4.03-6-7.5V8.3l6-3.11 6 3.11v4.2c0 3.47-2.47 6.65-6 7.5z"/>
                                    <path d="M9.5 11l-2 2 3.5 3.5 6-6-2-2-4 4z"/>
                                </svg>
                            </div>
                            <span className="text-2xl font-bold text-slate-800">YKRI</span>
                        </div>
                    </div>

                    {/* Form Container */}
                    <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-10">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-slate-800 mb-2">YKRI</h2>
                            <p className="text-slate-500 text-sm">Moins de Contraintes, Plus de Rendement</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Phone Input */}
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
                                    Téléphone
                                </label>
                                <input
                                    id="phone"
                                    type="text"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                    placeholder="06 12 34 56 78"
                                    className="block w-full px-4 py-3 bg-gray-50 text-slate-900 border border-gray-200 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                                />
                            </div>

                            {/* Password Input */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                                        Mot de passe
                                    </label>
                                    <button type="button" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                                        Mot de passe oublié ?
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        placeholder="Votre mot de passe"
                                        className="block w-full px-4 py-3 bg-gray-50 text-slate-900 border border-gray-200 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                Se connecter
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </Button>

                            {/* Divider */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-slate-500">ou</span>
                                </div>
                            </div>

                            {/* Register Button */}
                            {onSwitchToRegister && (
                                <button
                                    type="button"
                                    onClick={onSwitchToRegister}
                                    className="w-full py-3 px-4 bg-white border-2 border-emerald-500 text-emerald-600 font-semibold rounded-lg hover:bg-emerald-50 transition-all duration-200"
                                >
                                    Créer un nouveau compte
                                </button>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
