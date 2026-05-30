import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NOMBRES_MESES = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
const DIAS_SEMANA = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function App() {
  // Estado de los Shows (LocalStorage)
  const [shows, setShows] = useState(() => {
    const guardados = localStorage.getItem('showsFreestylePro');
    return guardados ? JSON.parse(guardados) : [];
  });

  // Controles de interfaz y filtros
  const [pestaña, setPestaña] = useState('proximos');
  const [filtroTiempo, setFiltroTiempo] = useState('todos');
  const [filtroDiaSemana, setFiltroDiaSemana] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [showDetalle, setShowDetalle] = useState(null);
  const [modoEscenario, setModoEscenario] = useState(false);

  // Controla qué mes está expandido en el Historial (null significa todos cerrados)
  const [mesExpandido, setMesExpandido] = useState(null);

  // Formulario
  const [editId, setEditId] = useState(null);
  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState('');
  const [lugar, setLugar] = useState('');
  const [maps, setMaps] = useState('');
  const [monto, setMonto] = useState('');
  const [requisitos, setRequisitos] = useState('');
  const [gastos, setGastos] = useState([]);

  // Guardar en LocalStorage automáticamente ante cambios
  useEffect(() => {
    localStorage.setItem('showsFreestylePro', JSON.stringify(shows));
  }, [shows]);

  // Manejadores de acciones
  const manejarGuardarShow = (e) => {
    e.preventDefault();
    const datos = {
      id: editId || Math.random().toString(36).substr(2, 9),
      nombre, fecha, lugar, maps, monto, requisitos, gastos
    };

    if (editId) {
      setShows(shows.map(s => s.id === editId ? datos : s));
      setEditId(null);
    } else {
      setShows([...shows, datos]);
    }

    // Resetear formulario
    setNombre(''); setFecha(''); setLugar(''); setMaps(''); setMonto(''); setRequisitos(''); setGastos([]);
  };

  const iniciarEdición = (s) => {
    setEditId(s.id);
    setNombre(s.nombre);
    setFecha(s.fecha);
    setLugar(s.lugar);
    setMaps(s.maps);
    setMonto(s.monto);
    setRequisitos(s.requisitos);
    setGastos(s.gastos ? s.gastos.map(g => ({ id: Math.random(), concepto: g.concepto, monto: g.monto })) : []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const eliminarRegistro = (id) => {
    if (window.confirm("¿Eliminar este show?")) {
      setShows(shows.filter(s => s.id !== id));
    }
  };

  const copiarWhatsApp = (s) => {
    const f = new Date(s.fecha + 'T00:00:00'); // Evita desfase de zona horaria
    const gTot = s.gastos ? s.gastos.reduce((acc, g) => acc + Number(g.monto), 0) : 0;
    const texto = `📋 *RESUMEN DE SHOW*\n\n🔥 *Evento:* ${s.nombre}\n📅 *Fecha:* ${DIAS_SEMANA[f.getDay()]} ${f.toLocaleDateString('es-AR')}\n📍 *Lugar:* ${s.lugar}\n💰 *Monto:* $${s.monto}\n📉 *Gastos Totales:* $${gTot}\n📌 *Requisitos:* ${s.requisitos || 'Ninguno'}`;
    navigator.clipboard.writeText(texto);
    alert("¡Copiado para WhatsApp con éxito!");
  };

  // Filtrado lógico de los shows según búsqueda y filtros de tiempo/día
  const showsFiltrados = useMemo(() => {
    return shows.filter(show => {
      const coincideBusqueda = show.nombre.toLowerCase().includes(busqueda.toLowerCase()) || show.lugar.toLowerCase().includes(busqueda.toLowerCase());
      
      const fechaShow = new Date(show.fecha + 'T00:00:00');
      const hoy = new Date();
      let coincideTiempo = true;

      if (filtroTiempo === 'semana') {
        const inicioSemana = new Date(hoy.setDate(hoy.getDate() - hoy.getDay()));
        const finSemana = new Date(hoy.setDate(hoy.getDate() - hoy.getDay() + 6));
        coincideTiempo = fechaShow >= inicioSemana && fechaShow <= finSemana;
      } else if (filtroTiempo === 'mes') {
        coincideTiempo = fechaShow.getMonth() === new Date().getMonth() && fechaShow.getFullYear() === new Date().getFullYear();
      }

      let coincideDia = true;
      if (filtroDiaSemana !== 'todos') {
        coincideDia = fechaShow.getDay() === Number(filtroDiaSemana);
      }

      return coincideBusqueda && coincideTiempo && coincideDia;
    });
  }, [shows, busqueda, filtroTiempo, filtroDiaSemana]);

  // Separamos los próximos shows (fechas futuras o de hoy) ordenados de forma ascendente
  const proximosShows = useMemo(() => {
    const hoyStr = new Date().toISOString().slice(0, 10);
    return showsFiltrados
      .filter(s => s.fecha >= hoyStr)
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [showsFiltrados]);

  // Renderizado de una tarjeta de show con todas sus opciones completas
  const RenderTarjetaShow = ({ show }) => {
    const f = new Date(show.fecha + 'T00:00:00');
    return (
      <div className="bg-bgCard border border-white/10 p-4 rounded-xl flex justify-between items-center transition-all hover:border-white/20 shadow-md">
        <div className="space-y-1">
          <h4 className="font-bold text-sm text-white tracking-wide">{show.nombre}</h4>
          <p className="text-[11px] text-gray-400 flex items-center">📍 {show.lugar}</p>
          <p className="text-[11px] text-accentGold font-bold">
            📅 {DIAS_SEMANA[f.getDay()]} {f.toLocaleDateString('es-AR')} • 💰 ${show.monto}
          </p>
          {show.requisitos && (
            <p className="text-[10px] text-gray-500 italic max-w-[200px] truncate">📌 Req: {show.requisitos}</p>
          )}
        </div>
        
        {/* BOTONES DE ACCIÓN COMPLETOS */}
        <div className="flex items-center space-x-1.5">
          <button 
            onClick={() => copiarWhatsApp(show)} 
            title="Copiar para WhatsApp" 
            className="p-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-lg text-xs transition-colors"
          >
            🟢
          </button>
          <button 
            onClick={() => iniciarEdición(show)} 
            title="Editar Registro" 
            className="p-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-xs transition-colors"
          >
            ✏️
          </button>
          <button 
            onClick={() => eliminarRegistro(show.id)} 
            title="Eliminar Registro" 
            className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-xs transition-colors"
          >
            ❌
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <div className="bg-bgCard/95 border border-white/5 rounded-2xl p-5 shadow-2xl relative">
        <header className="text-center mb-5">
          <h1 className="text-2xl font-black text-white tracking-wider">SHOWS DE FREESTYLE</h1>
          <p className="text-xs text-accentGold font-bold tracking-widest mt-0.5">MANAGER DASHBOARD</p>
        </header>

        {/* ================= FORMULARIO GUARDA / EDITAR ================= */}
        <form onSubmit={manejarGuardarShow} className="space-y-3 mb-6 bg-black/20 p-4 rounded-xl border border-white/5">
          <input 
            type="text" placeholder="Nombre del Evento / Show" value={nombre} onChange={e => setNombre(e.target.value)} required
            className="w-full bg-bgCard border border-white/10 p-2.5 rounded-lg text-sm text-white focus:outline-none focus:border-accentGold"
          />
          <div className="grid grid-cols-2 gap-2">
            <input 
              type="date" value={fecha} onChange={e => setFecha(e.target.value)} required
              className="w-full bg-bgCard border border-white/10 p-2.5 rounded-lg text-sm text-white focus:outline-none"
            />
            <input 
              type="number" placeholder="Monto ($)" value={monto} onChange={e => setMonto(e.target.value)} required
              className="w-full bg-bgCard border border-white/10 p-2.5 rounded-lg text-sm text-white focus:outline-none"
            />
          </div>
          <input 
            type="text" placeholder="Lugar o Establecimiento" value={lugar} onChange={e => setLugar(e.target.value)} required
            className="w-full bg-bgCard border border-white/10 p-2.5 rounded-lg text-sm text-white focus:outline-none"
          />
          <input 
            type="text" placeholder="Requisitos / Notas (opcional)" value={requisitos} onChange={e => setRequisitos(e.target.value)}
            className="w-full bg-bgCard border border-white/10 p-2.5 rounded-lg text-sm text-white focus:outline-none"
          />
          <button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-black font-black text-xs py-3 rounded-lg tracking-wider uppercase transition-colors">
            {editId ? '⚡ Actualizar Show' : '➕ Guardar Show'}
          </button>
        </form>

        {/* ================= NAVEGACIÓN DE PESTAÑAS ================= */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button onClick={() => setPestaña('proximos')} className={`py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-colors ${pestaña === 'proximos' ? 'bg-accentGold text-black' : 'bg-white/5 text-gray-400'}`}>
            Próximos
          </button>
          <button onClick={() => setPestaña('historial')} className={`py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-colors ${pestaña === 'historial' ? 'bg-accentGold text-black' : 'bg-white/5 text-gray-400'}`}>
            Historial Pro
          </button>
        </div>

        {/* ================= FILTROS DE BÚSQUEDA ================= */}
        <div className="space-y-2 mb-5 bg-black/10 p-3 rounded-xl border border-white/5">
          <input 
            type="text" placeholder="🔍 Buscar por nombre o dirección..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
            className="w-full bg-bgCard border border-white/10 p-2 rounded-lg text-xs text-white focus:outline-none"
          />
          
          <div className="grid grid-cols-2 gap-2">
            <select value={filtroTiempo} onChange={e => setFiltroTiempo(e.target.value)} className="bg-bgCard border border-white/10 p-2 rounded-lg text-xs text-white focus:outline-none">
              <option value="todos">Cualquier momento</option>
              <option value="semana">Esta semana</option>
              <option value="mes">Este mes</option>
            </select>

            <select value={filtroDiaSemana} onChange={e => setFiltroDiaSemana(e.target.value)} className="bg-bgCard border border-white/10 p-2 rounded-lg text-xs text-white focus:outline-none">
              <option value="todos">Cualquier día</option>
              {DIAS_SEMANA.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </div>
        </div>

        {/* ================= CONTENIDO DINÁMICO DE PESTAÑAS ================= */}
        <div className="space-y-3 min-h-[150px]">
          
          {/* PESTAÑA 1: PRÓXIMOS (Muestra lista directa ordenada cronológicamente) */}
          {pestaña === 'proximos' && (
            proximosShows.length === 0 ? (
              <p className="text-center text-xs text-gray-500 py-8">No hay shows futuros programados.</p>
            ) : (
              proximosShows.map(show => <RenderTarjetaShow key={show.id} show={show} />)
            )
          )}

          {/* PESTAÑA 2: HISTORIAL PRO (Agrupa todos los registros usando el Acordeón Colapsable) */}
          {pestaña === 'historial' && (
            showsFiltrados.length === 0 ? (
              <p className="text-center text-xs text-gray-500 py-8">Sin registros bajo los filtros actuales.</p>
            ) : (
              NOMBRES_MESES.map((mes, index) => {
                const showsDelMes = showsFiltrados.filter(show => {
                  const fechaShow = new Date(show.fecha + 'T00:00:00');
                  return fechaShow.getMonth() === index;
                });

                if (showsDelMes.length === 0) return null;

                const estaAbierto = mesExpandido === index;

                return (
                  <div key={mes} className="border border-white/5 rounded-xl bg-bgCard/40 overflow-hidden shadow-sm">
                    {/* BOTÓN DEL MES */}
                    <button
                      type="button"
                      onClick={() => setMesExpandido(estaAbierto ? null : index)}
                      className="w-full flex justify-between items-center p-3.5 font-bold text-xs tracking-wider uppercase transition-colors hover:bg-white/5"
                    >
                      <span className={estaAbierto ? "text-accentGold" : "text-white"}>
                        📁 {mes} ({showsDelMes.length})
                      </span>
                      <span className="text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded-full">
                        {estaAbierto ? '▲ OCULTAR' : '▼ VER SHOWS'}
                      </span>
                    </button>

                    {/* CONTENEDOR DE TARJETAS COMPLETAS */}
                    {estaAbierto && (
                      <div className="p-3 bg-black/20 border-t border-white/5 space-y-2.5">
                        {showsDelMes.map(show => (
                          <RenderTarjetaShow key={show.id} show={show} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )
          )}
        </div>

        {/* ================= ZONA DE SEGURIDAD ================= */}
        <div className="mt-8 bg-black/30 border border-white/5 rounded-xl p-4 text-center">
          <p className="text-[11px] text-gray-400 mb-3 tracking-wide">Zona de Seguridad (Evita perder tus datos)</p>
          <div className="flex flex-col space-y-2">
            <button 
              type="button"
              onClick={() => {
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(shows));
                const downloadAnchor = document.createElement('a');
                downloadAnchor.setAttribute("href", dataStr);
                downloadAnchor.setAttribute("download", `respaldo_shows_${new Date().toISOString().slice(0,10)}.json`);
                document.body.appendChild(downloadAnchor);
                downloadAnchor.click();
                downloadAnchor.remove();
              }}
              className="bg-yellow-600/10 hover:bg-yellow-600/20 border border-yellow-600/30 text-yellow-500 font-bold text-xs py-2 rounded-lg transition-colors"
            >
              💾 Guardar Copia en Celular
            </button>
            
            <label className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs py-2 rounded-lg cursor-pointer transition-colors block">
              📁 Subir Copia Guardada
              <input 
                type="file" accept=".json" className="hidden"
                onChange={(e) => {
                  const archivo = e.target.files[0];
                  if (!archivo) return;
                  const lector = new FileReader();
                  lector.onload = (evt) => {
                    try {
                      const datosCargados = JSON.parse(evt.target.result);
                      if (Array.isArray(datosCargados)) {
                        setShows(datosCargados);
                        alert("¡Copia de seguridad restaurada con éxito!");
                      } else {
                        alert("El archivo no tiene el formato correcto.");
                      }
                    } catch (err) {
                      alert("Error al leer el archivo de respaldo.");
                    }
                  };
                  lector.readAsText(archivo);
                }}
              />
            </label>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;