import React from 'react';

const LogoutModal = ({ isOpen, onClose, onConfirm, userEmail }) => {
  if (!isOpen) return null;

  return (
    // CAMBIO: Ventana simétrica, oscura, industrial, eliminando formas circulares blandas
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#111217] border border-zinc-800 w-[400px] rounded-xl p-8 shadow-2xl shadow-black mx-4 text-center">
        
        <div className="w-10 h-10 bg-red-600/10 border border-red-500/20 text-red-500 rounded-lg flex items-center justify-center mx-auto mb-4 font-mono font-bold text-xl">
          !
        </div>

        <h2 className="text-xl font-black text-white uppercase tracking-tight mb-2">
          ¿Interrumpir Telemetría?
        </h2>
        
        <p className="text-zinc-500 font-mono text-xs mb-6 leading-relaxed">
          Vas a cerrar sesión y apagar los canales activos en el terminal F1 Agent asignados a:<br/>
          <span className="font-bold text-red-500 break-all text-[11px] block mt-2 bg-zinc-900/60 p-2 rounded border border-zinc-800">{userEmail}</span>
        </p>

        <div className="flex flex-col gap-2">
          <button 
            onClick={onConfirm}
            className="w-full bg-red-600 text-white rounded-lg py-3 font-bold text-sm hover:bg-red-700 transition-all shadow-md shadow-red-950/30"
          >
            SÍ, APAGAR_CONSOLA
          </button>
          
          <button 
            onClick={onClose}
            className="w-full bg-zinc-900 text-zinc-400 border border-zinc-800 rounded-lg py-3 font-bold text-sm hover:bg-zinc-800 hover:text-zinc-200 transition-all"
          >
            CANCELAR_DISRUPCION
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;