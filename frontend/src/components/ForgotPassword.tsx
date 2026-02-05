import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import logoFaurg from '../assets/FAURG-logo-horizontal-reduzida.png';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLogoLoaded(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Password reset requested for:', email);
    setIsSubmitted(true);
    
    setTimeout(() => {
      setIsSubmitted(false);
      setEmail('');
    }, 3000);
  };

  return (
    <div className="min-h-screen w-screen bg-gray-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md overflow-hidden">
        
        <div className="flex justify-center items-center h-32 bg-gradient-to-b from-gray-50 to-white px-6 py-8">
          <div className={`transition-all duration-1000 ease-out transform ${
            logoLoaded 
              ? 'opacity-100 translate-y-0 scale-100' 
              : 'opacity-0 translate-y-4 scale-95'
          }`}>
            <img 
              src={logoFaurg} 
              alt="FAURG" 
              className="h-20 w-auto object-contain drop-shadow-sm"
              onLoad={() => setLogoLoaded(true)}
            />
          </div>
        </div>

        <div className="p-8 pt-4">
          {!isSubmitted ? (
            <>
              <div className="text-center mb-6">
                <p className="text-gray-600 text-sm leading-relaxed">
                  Digite o e-mail associado à sua conta e enviaremos um link para recuperação de senha.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="email"
                    placeholder="E-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700 placeholder-gray-400 transition-all duration-200"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!email.trim()}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-md transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer hover:shadow-lg"
                >
                  Enviar
                </button>
              </form>

              <div className="text-center mt-6">
                <Link 
                  to="/"
                  className="text-blue-900 text-sm hover:underline transition-colors duration-200"
                >
                  Voltar ao login
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="mb-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">E-mail enviado!</h3>
                <p className="text-gray-600 text-sm">
                  Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
                </p>
              </div>
              
              <Link 
                to="/"
                className="text-blue-900 text-sm hover:underline transition-colors duration-200"
              >
                Voltar ao login
              </Link>
            </div>
          )}

          <div className="text-center mt-8 pt-4 border-t border-gray-200">
            <p className="text-gray-500 text-sm">© FAURG 2025</p>
          </div>
        </div>
      </div>
    </div>
  );
}