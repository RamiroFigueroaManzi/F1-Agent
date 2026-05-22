import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase'; 
import Sidebar from './components/Sidebar';
import AuthModal from './components/AuthModal';
import LogoutModal from './components/LogoutModal';
import ReactMarkdown from 'react-markdown'; 
// CAMBIO: Importamos los iconos Menu y X para el switch de cabina
import { Menu, X } from 'lucide-react';

function App() {
  // --- ESTADOS ---
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [chatIniciado, setChatIniciado] = useState(false);
  
  // CAMBIO: Estado para abrir/cerrar la sidebar en pantallas móviles
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // --- ESTADOS PARA EL CHAT ---
  const [inputTexto, setInputTexto] = useState(''); 
  const [mensajes, setMensajes] = useState([]);    

  // --- ESTADOS PARA EL HISTORIAL ---
  const [chatId, setChatId] = useState(null);      
  const [historial, setHistorial] = useState([]);   

  // --- FUNCIÓN PARA CARGAR EL HISTORIAL ---
  const cargarHistorial = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('conversaciones')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistorial(data || []);
    } catch (err) {
      console.error("Error al cargar historial:", err.message);
    }
  };

  // --- ESCUCHAR SESIÓN ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const userData = {
          id: session.user.id,
          name: session.user.user_metadata.full_name || "Usuario",
          email: session.user.email,
          avatar: session.user.user_metadata.avatar_url
        };
        setUser(userData);
        cargarHistorial(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const userData = {
          id: session.user.id,
          name: session.user.user_metadata.full_name || "Usuario",
          email: session.user.email,
          avatar: session.user.user_metadata.avatar_url
        };
        setUser(userData);
        cargarHistorial(session.user.id);
        setIsAuthOpen(false); 
      }
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setChatIniciado(false);
        setMensajes([]); 
        setHistorial([]);
        setChatId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- MANEJADORES ---
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLogoutOpen(false);
  };

  const handleSeleccionarChat = async (idDelChat) => {
    try {
      setChatId(idDelChat);
      setChatIniciado(true);
      // Cerramos automáticamente la barra al cambiar de chat en celular
      setSidebarOpen(false);
      const { data, error } = await supabase
        .from('mensajes')
        .select('*')
        .eq('conversacion_id', idDelChat)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMensajes(data.map(m => ({ id: m.id, rol: m.rol, texto: m.texto })));
    } catch (err) {
      console.error("Error cargando mensajes:", err.message);
    }
  };

  const handleEnviar = async (texto) => {
    if (!texto.trim()) return;

    setChatIniciado(true);
    setSidebarOpen(false); // Cerramos barra al enviar consulta en celular
    let currentChatId = chatId;

    if (user && !currentChatId) {
      try {
        const tituloChat = texto.length > 30 ? texto.substring(0, 30) + "..." : texto;
        const { data, error } = await supabase
          .from('conversaciones')
          .insert([{ user_id: user.id, titulo: tituloChat }])
          .select().single();
        if (error) throw error;
        currentChatId = data.id;
        setChatId(currentChatId); 
        setHistorial(prev => [data, ...prev]); 
      } catch (err) {
        console.error("Error:", err.message);
      }
    }

    const nuevoMensajeUsuario = { id: Date.now(), rol: 'usuario', texto: texto };
    setMensajes(prev => [...prev, nuevoMensajeUsuario]);
    setInputTexto('');

    if (user && currentChatId) {
      await supabase.from('mensajes').insert([{ conversacion_id: currentChatId, rol: 'usuario', texto: texto }]);
    }

    const idPensando = Date.now() + 1;
    setMensajes(prev => [...prev, { 
      id: idPensando, 
      rol: 'asistente', 
      texto: '⏳ *DRIVER_INPUT RECIBIDO. Analizando telemetría y directivas técnicas de la FIA... Reajustando mapa de motor...*' 
    }]);

    try {
      const respuesta = await fetch('https://f1-agent-74ik.onrender.com/preguntar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pregunta: texto })
      });
      if (!respuesta.ok) throw new Error('Error en el servidor');
      const data = await respuesta.json();

      if (user && currentChatId) {
        await supabase.from('mensajes').insert([{ conversacion_id: currentChatId, rol: 'asistente', texto: data.respuesta }]);
      }

      setMensajes(prev => prev.map(msg => msg.id === idPensando ? { ...msg, texto: data.respuesta } : msg));
    } catch (error) {
      setMensajes(prev => prev.map(msg => msg.id === idPensando ? { ...msg, texto: '❌ **PIT LANE ERROR**: Desconexión con el servidor central de telemetría de la FIA. Revisa el archivo `main.py`.' } : msg));
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0a0b0d] font-sans text-zinc-100 selection:bg-red-600 selection:text-white">
      
      {/* CAMBIO: Pasamos el estado de apertura y cierre a la barra lateral */}
      <Sidebar 
        user={user} 
        historial={historial}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLoginClick={() => setIsAuthOpen(true)}
        onLogoutClick={() => setIsLogoutOpen(true)}
        onSeleccionarChat={handleSeleccionarChat}
        onNuevoChat={() => {
          setChatIniciado(false);
          setMensajes([]); 
          setChatId(null); 
          setSidebarOpen(false); // Cerramos barra al presionar nuevo chat
        }}
      />

      {/* CAMBIO: Botón Interruptor Flotante (Oculto en desktop `md:hidden`, visible en celular) */}
      <button 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-40 bg-red-600 hover:bg-red-700 text-white p-2.5 rounded-lg border border-red-500 shadow-lg transition-transform active:scale-95"
        title="Consola de Telemetría"
      >
        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* CAMBIO: Eliminamos ml-[260px] fijo por uno condicional (ml-0 en celular, ml-[260px] en desktop) */}
      <div className="flex-1 ml-0 md:ml-[260px] relative flex flex-col h-screen overflow-hidden">
        
        {/* HEADER */}
        {!user && (
          // CAMBIO: pr-6 a pr-6 pt-16 md:pt-6 para que las opciones no se pisen con el botón flotante en móvil
          <nav className="absolute top-0 right-0 p-6 pt-16 md:pt-6 flex items-center gap-4 z-10">
            <button onClick={() => setIsAuthOpen(true)} className="bg-red-600 text-white px-5 py-2 rounded-lg font-bold text-sm hover:bg-red-700 transition-all shadow-md shadow-red-900/20 active:scale-[0.98]">
              Iniciar sesión
            </button>
            <button onClick={() => setIsAuthOpen(true)} className="bg-zinc-900 text-zinc-300 border border-zinc-800 px-5 py-2 rounded-lg font-semibold text-sm hover:bg-zinc-800 transition-all active:scale-[0.98]">
              Registrarse
            </button>
          </nav>
        )}

        {/* CONTENIDO CENTRAL */}
        {/* CAMBIO: pt-20 md:pt-0 para darle aire al header inicial en celulares */}
        <main className={`flex-1 flex flex-col items-center px-4 pt-20 md:pt-0 relative h-full w-full ${chatIniciado ? 'justify-start' : 'justify-center'}`}>
          
          {/* TÍTULO INICIAL */}
          {!chatIniciado && (
            <div className="text-center mb-10 animate-in fade-in zoom-in duration-500">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-600/10 border border-red-500/20 rounded-full text-red-500 text-xs font-mono font-bold tracking-widest uppercase mb-4">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                FIA RAG Engine Conectado
              </div>
              <h1 className="text-3xl md:text-[44px] font-black text-white tracking-tight uppercase leading-tight">
                F1 <span className="text-red-600 font-extrabold">Agent</span>
              </h1>
              <p className="text-zinc-500 text-xs md:text-sm font-mono mt-2">Soporte Técnico Especializado en Reglamentos de Carreras 2026</p>
            </div>
          )}

          {/* ÁREA DE CHAT COMPONENTES OSCUROS */}
          {chatIniciado && (
            // CAMBIO: pt-10 a pt-12 md:pt-10 para no pisarse con el botón móvil
            <div className="w-full max-w-3xl h-[calc(100vh-180px)] overflow-y-auto pt-12 md:pt-10 pb-12 pr-2 space-y-6 scroll-smooth">
              {mensajes.map((msg) => (
                <div key={msg.id} className="flex gap-3 md:gap-4 items-start animate-in fade-in slide-in-from-bottom-3 duration-300">
                  
                  {/* AVATARES DEPORTIVOS */}
                  <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden shadow-md">
                    {msg.rol === 'usuario' ? (
                      <div className="bg-zinc-800 border border-zinc-700 w-full h-full flex items-center justify-center text-zinc-400">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M2 10h20"/><path d="M21.2 14.8a10 10 0 1 0-18.4 0"/><path d="M12 2a10 10 0 0 1 7.5 16.5L12 22l-7.5-3.5A10 10 0 0 1 12 2z"/>
                        </svg>
                      </div>
                    ) : (
                      <div className="bg-red-600 w-full h-full flex items-center justify-center p-2">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/3/33/F1.svg" alt="FIA" className="w-full h-auto brightness-0 invert" />
                      </div>
                    )}
                  </div>
                  
                  {/* BURBUJAS DE TELEMETRÍA */}
                  <div className={`p-4 md:p-5 rounded-xl max-w-[88%] md:max-w-[85%] border transition-all ${
                    msg.rol === 'usuario' 
                      ? 'bg-zinc-900/60 border-zinc-800 text-zinc-100 shadow-sm' 
                      : 'bg-[#111217] border-zinc-800/80 border-l-4 border-l-red-600 text-zinc-200 shadow-[0_10px_30px_rgba(225,6,0,0.02)]'
                  }`}>
                    <div className={`text-[9px] md:text-[10px] font-mono font-bold tracking-widest uppercase mb-2 ${
                      msg.rol === 'usuario' ? 'text-zinc-500' : 'text-red-500'
                    }`}>
                      {msg.rol === 'usuario' ? '● DRIVER_REQUEST_CH_01' : '▲ F1 Agent'}
                    </div>

                    <div className="prose prose-sm max-w-none prose-zinc text-left text-[13.5px] md:text-[14.5px] leading-relaxed space-y-1 text-zinc-300 prose-headings:text-white prose-strong:text-red-500 prose-code:text-red-400">
                      <ReactMarkdown>
                        {msg.texto}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>  
              ))}
            </div>
          )}
          
          {/* BARRA DE INPUT ESTILO CABINA */}
          <div className={`w-full max-w-3xl bg-[#111217] rounded-xl border border-zinc-800 p-3 md:p-4 flex items-center gap-3 transition-all ${
            chatIniciado 
              ? 'absolute bottom-6 left-1/2 -translate-x-1/2 border-zinc-700/60 shadow-[0_15px_30px_rgba(0,0,0,0.5)] z-20 w-[92%] md:w-full' 
              : 'group focus-within:border-red-600/50 focus-within:shadow-[0_0_20px_rgba(225,6,0,0.05)] shadow-lg'
          }`}>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse ml-1 flex-shrink-0" title="Telemetría Activa"></div>
            <input 
              type="text" 
              value={inputTexto}
              onChange={(e) => setInputTexto(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEnviar(inputTexto)}
              placeholder="Pregunta a Boxes sobre reglamentos de la FIA..." 
              className="flex-1 bg-transparent outline-none text-zinc-200 ml-1 text-sm md:text-[15px] placeholder-zinc-700 font-sans"
            />
            <button 
              onClick={() => handleEnviar(inputTexto)}
              className="bg-zinc-800 p-2 md:p-2.5 rounded-lg hover:bg-red-600 hover:text-white transition-all text-zinc-400 border border-zinc-700 hover:border-red-500"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
            </button>
          </div>

          {/* TARJETAS SUGERIDAS BENTO GRID */}
          {!chatIniciado && (
            // CAMBIO: grid-cols-2 a grid-cols-1 md:grid-cols-2 para que se apilen verticalmente en celulares
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-3xl mt-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
               <div 
                 onClick={() => handleEnviar("Explícame las reglas del Reglamento Técnico de motores 2026")}
                 className="bg-[#111217] border border-zinc-800/80 rounded-xl p-4 md:p-5 cursor-pointer hover:border-red-600/40 hover:bg-[#15171f] transition-all text-left group shadow-sm"
               >
                 <div className="text-red-500 mb-2">
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v1"/><path d="M18 8h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-4"/><circle cx="6" cy="12" r="2"/><circle cx="14" cy="12" r="2"/></svg>
                 </div>
                 <h4 className="text-sm font-bold text-white mb-1 group-hover:text-red-500 transition-colors">Reglamento Técnico</h4>
                 <p className="text-xs text-zinc-500 leading-normal">Unidades de potencia, aerodinámica activa y límites de combustible para el 2026.</p>
               </div>

               <div 
                 onClick={() => handleEnviar("¿Cuáles son las penalizaciones del Reglamento Deportivo?")}
                 className="bg-[#111217] border border-zinc-800/80 rounded-xl p-4 md:p-5 cursor-pointer hover:border-red-600/40 hover:bg-[#15171f] transition-all text-left group shadow-sm"
               >
                 <div className="text-red-500 mb-2">
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                 </div>
                 <h4 className="text-sm font-bold text-white mb-1 group-hover:text-red-500 transition-colors">Reglamento Deportivo</h4>
                 <p className="text-xs text-zinc-500 leading-normal">Límites de pista, procedimientos de Safety Car, banderas y sanciones de los comisarios.</p>
               </div>
            </div>
          )}
        </main>
      </div>

      {/* MODALES */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <LogoutModal isOpen={isLogoutOpen} onClose={() => setIsLogoutOpen(false)} onConfirm={handleLogout} userEmail={user?.email} />
    </div>
  );
}

export default App;