import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { Button } from '@/components/ui/button'
import Image from 'next/image'

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
            const email = phone.includes('@') ? phone : `${phone}@ykri.com`;
            await login(email, password);
        } catch (error) {
            console.error(error);
            if (error instanceof Error) {
                if (error.message === 'Invalid credentials') {
                    alert(t('login.invalidCredentials'));
                } else if (error.message === 'Account pending approval') {
                    alert(t('login.accountPendingApproval'));
                } else if (error.message === 'Account access denied') {
                    alert(t('login.generalError'));
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
            {/* Left Panel - Brand Green Background */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#4C9A2A] via-[#4C9A2A] to-[#3d8422] p-12 flex-col justify-between relative overflow-hidden">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-white rounded-full -translate-x-1/3 -translate-y-1/3"></div>
                    <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-white rounded-full translate-x-1/3 translate-y-1/3"></div>
                </div>

                {/* Logo */}
                <div className="relative z-10">
                    <div className="flex items-center gap-3 text-white">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg p-1">
                            <Image src="/Logo YKRI.png" alt="YKRI" width={56} height={56} className="object-contain" />
                        </div>
                        <span className="text-3xl font-bold tracking-tight font-heading">YKRI</span>
                    </div>
                </div>

                {/* Welcome Message */}
                <div className="relative z-10 text-white space-y-4">
                    <h1 className="text-5xl font-bold leading-tight font-heading">
                        Bon retour<br />parmi nous
                    </h1>
                    <p className="text-xl text-white/90 leading-relaxed font-body">
                        Accédez à votre compte pour gérer vos<br />
                        réservations et vos machines.
                    </p>
                </div>

                {/* Footer */}
                <div className="relative z-10 text-white/80 text-sm font-body">
                    © 2025 YKRI - Le Bon Matériel, au Bon Moment
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex justify-center mb-8">
                        <div className="w-20 h-20 rounded-xl overflow-hidden">
                            <Image src="/Logo YKRI.png" alt="YKRI" width={80} height={80} className="w-full h-full object-contain" />
                        </div>
                    </div>

                    {/* Form Container */}
                    <div className="bg-white rounded-2xl shadow-lg p-8 lg:p-10">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-[#4C9A2A] mb-2 font-heading">YKRI</h2>
                            <p className="text-[#555] text-sm font-body">Le Bon Matériel, au Bon Moment</p>
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
                                    className="block w-full px-4 py-3 bg-gray-50 text-slate-900 border border-gray-200 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4C9A2A] focus:border-transparent transition-all duration-200"
                                />
                            </div>

                            {/* Password Input */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                                        Mot de passe
                                    </label>
                                    <button type="button" className="text-sm text-[#4C9A2A] hover:text-[#3d8422] font-medium">
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
                                        className="block w-full px-4 py-3 bg-gray-50 text-slate-900 border border-gray-200 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#4C9A2A] focus:border-transparent transition-all duration-200"
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
                                className="w-full py-3 px-4 bg-[#4C9A2A] hover:bg-[#3d8422] text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
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
                                    className="w-full py-3 px-4 bg-white border-2 border-[#4C9A2A] text-[#4C9A2A] font-semibold rounded-lg hover:bg-green-50 transition-all duration-200"
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
