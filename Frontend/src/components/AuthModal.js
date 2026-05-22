import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';

const AuthModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  // eslint-disable-next-line
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin, // Vuelve a http://localhost:3000
        // 🏎️ EL TRUCO DE BOXES: Obliga a Google a mostrar el selector de cuentas siempre
        queryParams: {
          prompt: 'select_account',
          access_type: 'offline'
        }
      },
    });
    if (error) alert("Error con Google: " + error.message);
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    loading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      alert("Error: " + error.message);
    } else {
      alert("¡Enlace de telemetría enviado! Revisa tu casilla de correo electrónico.");
    }
    loading(false);
  };

  return (
    // CAMBIO: Fondo opaco desenfocado oscuro y contenedor con look de fibra de carbono/boxes (#111217)
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#111217] border border-zinc-800 w-[440px] rounded-xl p-10 relative shadow-2xl shadow-black/80 mx-4">
        
        <button onClick={onClose} className="absolute top-5 right-5 text-zinc-500 hover:text-red-500 hover:bg-zinc-900 p-1.5 rounded-md transition-all">
          <X size={18} />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-6 bg-red-600 rounded mx-auto mb-4 flex items-center justify-center p-1 font-black text-[9px] text-white font-mono tracking-widest uppercase">
            PADDOCK
          </div>
          <h2 className="text-2xl font-black text-white leading-tight uppercase tracking-tight">
            Acceso a Terminal
          </h2>
          <p className="text-zinc-500 text-xs font-mono mt-1">Autenticación Encriptada del Servidor de Boxes</p>
        </div>

        {/* Botón de Google */}
        <div className="space-y-3">
          <button 
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 border border-zinc-800 bg-zinc-900 text-zinc-200 rounded-lg py-3.5 text-[14px] font-bold hover:bg-zinc-800 hover:border-zinc-700 transition-all active:scale-[0.98]"
          >
            <img src="https://www.google.com/favicon.ico" className="w-4 h-4 brightness-90" alt="google" />
            Autenticar vía Google
          </button>
        </div>

        <div className="relative my-6 flex items-center justify-center">
          <hr className="w-full border-zinc-800" />
          <span className="absolute bg-[#111217] px-4 text-zinc-600 text-xs font-mono uppercase">O</span>
        </div>

        {/* Formulario Magic Link */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="relative">
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="F1_PILOT_EMAIL@DIRECCION.COM" 
              className="w-full bg-zinc-900/60 border border-zinc-800 rounded-lg px-4 py-3.5 text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-red-600/60 font-mono text-xs tracking-wide transition-all"
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white rounded-lg py-3.5 font-bold text-sm hover:bg-red-700 transition-all shadow-md shadow-red-950/40 disabled:bg-zinc-800 disabled:text-zinc-600 active:scale-[0.98]"
          >
            {loading ? "GENERANDO ENLACE..." : "Enviar por mail"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;