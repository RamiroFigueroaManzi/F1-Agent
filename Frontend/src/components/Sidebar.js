import React from 'react';
import { Plus, MessageSquare, LogOut, User } from 'lucide-react';

const Sidebar = ({ user, historial = [], onLoginClick, onLogoutClick, onNuevoChat, onSeleccionarChat }) => {
  return (
    // CAMBIO: Fondo del Sidebar oscurecido a juego (#111217) con bordes zinc sutiles
    <aside className="w-[260px] bg-[#111217] border-r border-zinc-900 h-screen flex flex-col p-3 fixed left-0 top-0 z-30 text-zinc-300">
      
      {/* Botón Nuevo Chat */}
      <button 
        onClick={onNuevoChat} 
        className="flex items-center gap-3 w-full p-3 bg-zinc-900/50 border border-zinc-800 hover:bg-zinc-800 rounded-lg hover:border-red-600/50 hover:text-white transition-all mb-2 group text-left"
      >
        <div className="bg-zinc-800 border border-zinc-700 p-1 rounded shadow-sm group-hover:border-red-500 group-hover:bg-red-600 group-hover:text-white transition-colors">
          <Plus size={16} />
        </div>
        <span className="text-sm font-bold font-mono tracking-tight">NUEVO_CHAT</span>
      </button>

      {/* Card de Historial para Invitados */}
      {!user && (
        <div className="mt-4 p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl shadow-inner">
          <div className="h-24 w-full bg-gradient-to-br from-red-950/40 to-zinc-900 rounded-xl mb-4 border border-red-900/10 flex items-center justify-center">
            <span className="text-[10px] font-mono text-red-500 tracking-widest uppercase">Telemetry Locked</span>
          </div>
          <h3 className="text-sm font-bold text-zinc-200 mb-1">Historial del Pit Lane</h3>
          <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
            Inicia sesión para sincronizar tu consola de ingeniero, archivar directivas de la FIA y guardar tus análisis de carrera.
          </p>
          <button 
            onClick={onLoginClick}
            className="w-full bg-red-600 text-white text-xs font-bold py-2.5 rounded-lg hover:bg-red-700 transition-all shadow-md shadow-red-950/30"
          >
            Establecer Conexión
          </button>
        </div>
      )}

      {/* ÁREA DE HISTORIAL DINÁMICA DE SUPABASE */}
      <div className="flex-1 overflow-y-auto mt-4 pr-1 scrollbar-thin">
        {user && historial.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-bold font-mono text-zinc-600 px-3 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
              DATA_LOGS_HISTORIAL
            </p>
            
            {historial.map((chat) => (
              <button 
                key={chat.id}
                onClick={() => onSeleccionarChat(chat.id)}
                className="flex items-center gap-3 w-full p-2.5 hover:bg-zinc-900/80 border border-transparent hover:border-zinc-800 rounded-lg text-sm text-zinc-400 hover:text-white text-left transition-all group"
              >
                <MessageSquare size={14} className="flex-shrink-0 text-zinc-600 group-hover:text-red-500 transition-colors" />
                <span className="truncate flex-1 font-mono text-[13px]">{chat.titulo}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Perfil de Usuario Abajo */}
      <div className="border-t border-zinc-900 pt-4 mt-auto px-1">
        {user ? (
          <div className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-600 text-white rounded-lg flex items-center justify-center text-xs font-black tracking-tighter shadow-md shadow-red-900/30">
                {user.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-200 leading-none truncate max-w-[140px]">{user.name}</p>
                <p className="text-[10px] font-mono text-green-500 font-bold mt-1 uppercase tracking-wider">● TELEM_ACTIVE</p>
              </div>
            </div>
            <button 
              onClick={onLogoutClick}
              className="text-zinc-600 hover:text-red-500 p-1.5 hover:bg-zinc-900 rounded-md transition-all"
              title="Desconectar Consola"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button 
            onClick={onLoginClick}
            className="flex items-center gap-3 w-full p-2.5 bg-zinc-900/40 border border-zinc-800 rounded-lg text-sm font-bold font-mono tracking-tight text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
          >
            <User size={16} className="text-zinc-500" />
            iniciar Sesion
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;