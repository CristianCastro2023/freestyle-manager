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

    // Controles de interfaz
    const [pestaña, setPestaña] = useState('proximos');
    const [filtroTiempo, setFiltroTiempo] = useState('todos');
    const [filtroDiaSemana, setFiltroDiaSemana] = useState('todos');
    const [busqueda, setBusqueda] = useState('');
    const [showDetalle, setShowDetalle] = useState(null);
    const [modoEscenario, setModoEscenario] = useState(false);

    // Formulario
    const [editId, setEditId] = useState(null);
    const [nombre, setNombre] = useState('');
    const [fecha, setFecha] = useState('');
    const [lugar, setLugar] = useState('');
    const [maps, setMaps] = useState('');
    const [monto, setMonto] = useState('');
    const [requisitos, setRequisitos] = useState('');
    const [gastos, setGastos] = useState([]);

    // Carrusel
    const [indiceCarrusel, setIndiceCarrusel] = useState(0);
    const [tiempoRestante, setTiempoRestante] = useState('');

    // 🛡️ Almacenamiento Persistente Automático (Evita que el celular borre datos por falta de espacio)
    useEffect(() => {
        if (navigator.storage && navigator.storage.persist) {
            navigator.storage.persist().then((persisted) => {
                if (persisted) {
                    console.log("¡Almacenamiento persistente activado con éxito!");
                } else {
                    console.log("El navegador no permitió la persistencia automática.");
                }
            });
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('showsFreestylePro', JSON.stringify(shows));
    }, [shows]);

    // 💾 Lógica de Copia de Seguridad Manual (Exportar e Importar JSON)
    const exportarRespaldo = () => {
        if (shows.length === 0) {
            alert("No hay shows cargados para exportar.");
            return;
        }
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(shows));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "respaldo_shows_freestyle.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    };

    const importarRespaldo = (e) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const fileReader = new FileReader();
        fileReader.readAsText(e.target.files[0], "UTF-8");
        fileReader.onload = (event) => {
            try {
                const datosParseados = JSON.parse(event.target.result);
                if (Array.isArray(datosParseados)) {
                    setShows(datosParseados);
                    localStorage.setItem('showsFreestylePro', JSON.stringify(datosParseados));
                    alert("¡Copia de seguridad restaurada con éxito!");
                } else {
                    alert("El archivo no tiene el formato correcto.");
                }
            } catch (error) {
                alert("Error al leer el archivo de respaldo.");
            }
        };
    };

    const ahora = new Date();
    const futuros = useMemo(() => shows.filter(s => new Date(s.fecha) >= ahora).sort((a,b) => new Date(a.fecha) - new Date(b.fecha)), [shows]);
    const pasados = useMemo(() => shows.filter(s => new Date(s.fecha) < ahora).sort((a,b) => new Date(b.fecha) - new Date(a.fecha)), [shows]);

    const showsDelPrimerDiaFuturo = useMemo(() => {
        if (futuros.length === 0) return [];
        const primerFecha = new Date(futuros[0].fecha);
        return futuros.filter(s => {
            const f = new Date(s.fecha);
            return f.getDate() === primerFecha.getDate() && f.getMonth() === primerFecha.getMonth() && f.getFullYear() === primerFecha.getFullYear();
        });
    }, [futuros]);

    useEffect(() => {
        if (showsDelPrimerDiaFuturo.length <= 1) return;
        const interval = setInterval(() => {
            setIndiceCarrusel(prev => (prev + 1) % showsDelPrimerDiaFuturo.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [showsDelPrimerDiaFuturo]);

    useEffect(() => {
        if (showsDelPrimerDiaFuturo.length === 0) {
            setTiempoRestante('');
            return;
        }
        const target = new Date(showsDelPrimerDiaFuturo[indiceCarrusel]?.fecha);
        const actualizarReloj = () => {
            const diff = target - new Date();
            if (diff <= 0) {
                setTiempoRestante("¡EL SHOW HA COMENZADO! ⚽");
                return;
            }
            const d = Math.floor(diff / (1000 * 60 * 60 * 24));
            const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);
            setTiempoRestante(`${d}d ${h}h ${m}m ${s}s`);
        };
        actualizarReloj();
        const relojInterval = setInterval(actualizarReloj, 1000);
        return () => clearInterval(relojInterval);
    }, [showsDelPrimerDiaFuturo, indiceCarrusel]);

    const perteneceAEstaSemana = (fechaStr) => {
        const f = new Date(fechaStr);
        const hoy = new Date();
        const primero = hoy.getDate() - hoy.getDay();
        const inicio = new Date(hoy.setDate(primero));
        return f >= inicio;
    };

    const listadoFiltrado = useMemo(() => {
        const base = pestaña === 'proximos' ? futuros : pasados;
        return base.filter(s => {
            const cumpleTexto = s.nombre.toLowerCase().includes(busqueda.toLowerCase()) || s.lugar.toLowerCase().includes(busqueda.toLowerCase());
            let cumpleTiempo = true;
            if (filtroTiempo === 'semana') cumpleTiempo = perteneceAEstaSemana(s.fecha);
            if (filtroTiempo === 'mes') {
                const f = new Date(s.fecha);
                cumpleTiempo = f.getMonth() === ahora.getMonth() && f.getFullYear() === ahora.getFullYear();
            }
            const cumpleDia = filtroDiaSemana === 'todos' || new Date(s.fecha).getDay().toString() === filtroDiaSemana;
            return cumpleTexto && cumpleTiempo && cumpleDia;
        });
    }, [pestaña, futuros, pasados, busqueda, filtroTiempo, filtroDiaSemana]);

    const mesesAgrupados = useMemo(() => {
        const grupos = {};
        listadoFiltrado.forEach(s => {
            const f = new Date(s.fecha);
            const clave = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}`;
            if (!grupos[clave]) grupos[clave] = [];
             grupos[clave].push(s);
        });
        const clavesOrdenadas = Object.keys(grupos).sort();
        return pestaña === 'realizados' ? clavesOrdenadas.reverse().map(c => ({clave: c, items: grupos[c]})) : clavesOrdenadas.map(c => ({clave: c, items: grupos[c]}));
    }, [listadoFiltrado, pestaña]);

    const kpis = useMemo(() => {
        let bruto = listadoFiltrado.reduce((acc, s) => acc + s.monto, 0);
        let gastosTotales = listadoFiltrado.reduce((acc, s) => acc + (s.gastos?.reduce((gAcc, g) => gAcc + g.monto, 0) || 0), 0);
        return { bruto, gastosTotales, ganancia: bruto - gastosTotales, total: listadoFiltrado.length };
    }, [listadoFiltrado]);

    const esFechaDoble = (fechaStr) => {
        const fTarget = new Date(fechaStr);
        return shows.filter(s => {
            const f = new Date(s.fecha);
            return f.getDate() === fTarget.getDate() && f.getMonth() === fTarget.getMonth() && f.getFullYear() === fTarget.getFullYear();
        }).length > 1;
    };

    const manejarGuardarShow = (e) => {
        e.preventDefault();
        const datos = {
            id: editId || Date.now(),
            nombre, fecha, lugar, maps,
            monto: parseFloat(monto) || 0,
            requisitos,
            gastos: gastos.filter(g => g.concepto).map(g => ({ concepto: g.concepto, monto: parseFloat(g.monto) || 0 }))
        };
        if (editId) {
            setShows(shows.map(s => s.id === editId ? datos : s));
            setEditId(null);
        } else {
            setShows([...shows, datos]);
        }
        setNombre(''); setFecha(''); setLugar(''); setMaps(''); setMonto(''); setRequisitos(''); setGastos([]);
    };

    const iniciarEdición = (s) => {
        setEditId(s.id); setNombre(s.nombre); setFecha(s.fecha); setLugar(s.lugar); setMaps(s.maps); setMonto(s.monto); setRequisitos(s.requisitos || '');
        setGastos(s.gastos ? s.gastos.map(g => ({ id: Math.random(), concepto: g.concepto, monto: g.monto })) : []);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const eliminarRegistro = (id) => {
        if (window.confirm("¿Eliminar este show?")) setShows(shows.filter(s => s.id !== id));
    };

    const copiarWhatsApp = (s) => {
        const f = new Date(s.fecha);
        const gTot = s.gastos ? s.gastos.reduce((acc,g) => acc + g.monto, 0) : 0;
        const texto = `📋 *RESUMEN DE SHOW*\n\n🔥 *Evento:* ${s.nombre}\n🗓️ *Fecha:* ${DIAS_SEMANA[f.getDay()]} ${f.toLocaleDateString()}\n⏰ *Hora:* ${f.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} hs\n📍 *Lugar:* ${s.lugar}\n💰 *Ganancia:* $${(s.monto - gTot).toLocaleString()}\n⚠️ *Requisitos:* ${s.requisitos || 'Ninguno'}`;
        navigator.clipboard.writeText(texto);
        alert("¡Copiado para WhatsApp!");
    };

    return (
        <div className="w-full max-w-md mx-auto p-4">
            <div className="bg-bgCard/95 border border-white/5 rounded-2xl p-5 shadow-2xl relative">
                <header className="text-center mb-5">
                    <h1 className="text-2xl font-black text-white tracking-wider">FREESTYLE ARENA</h1>
                    <p className="text-xs text-accentGold font-bold tracking-widest mt-0.5">MANAGER DASHBOARD</p>
                </header>

                <AnimatePresence mode="wait">
                    {showsDelPrimerDiaFuturo.length > 0 && (
                        <motion.div 
                            key={`carrusel-${indiceCarrusel}`}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="bg-gradient-to-br from-black to-neutral-900 border-2 border-accentGold rounded-xl p-5 text-center shadow-lg relative min-h-[140px] mb-6"
                        >
                            {showsDelPrimerDiaFuturo.length > 1 && (
                                <span className="absolute top-2 right-2 bg-orange-600 text-white font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    🔥 JORNADA DOBLE ({indiceCarrusel + 1}/{showsDelPrimerDiaFuturo.length})
                                </span>
                            )}
                            <h3 className="text-xs text-zinc-500 font-bold tracking-widest uppercase mb-1">⚡ SIGUIENTE SHOW ⚡</h3>
                            <h2 className="text-xl font-bold text-white mb-1">{showsDelPrimerDiaFuturo[indiceCarrusel]?.nombre}</h2>
                            <p className="text-xs text-zinc-400">
                                {new Date(showsDelPrimerDiaFuturo[indiceCarrusel]?.fecha).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })} hs
                            </p>
                            <p className="text-xs text-accentGold font-medium mt-1">📍 {showsDelPrimerDiaFuturo[indiceCarrusel]?.lugar}</p>
                            <div className="text-sm font-black text-red-500 bg-red-950/40 border border-red-900/30 px-3 py-1 rounded-md mt-3 inline-block tracking-wider">
                                {tiempoRestante}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={manejarGuardarShow} className="space-y-3 bg-black/30 p-3 rounded-xl border border-white/5">
                    <input type="text" placeholder="Nombre del Evento" value={nombre} onChange={e => setNombre(e.target.value)} className="w-full bg-bgDark/80 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-accentGold" required />
                    <input type="datetime-local" value={fecha} onChange={e => setFecha(e.target.value)} className="w-full bg-bgDark/80 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-accentGold [color-scheme:dark]" required />
                    <input type="text" placeholder="Dirección del Show" value={lugar} onChange={e => setLugar(e.target.value)} className="w-full bg-bgDark/80 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-accentGold" required />
                    <input type="url" placeholder="Enlace Google Maps (Opcional)" value={maps} onChange={e => setMaps(e.target.value)} className="w-full bg-bgDark/80 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-accentGold" />
                    <input type="number" placeholder="Monto Bruto a cobrar ($)" value={monto} onChange={e => setMonto(e.target.value)} className="w-full bg-bgDark/80 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-accentGold" required />
                    <input type="text" placeholder="Requisitos (Remera, inflador...)" value={requisitos} onChange={e => setRequisitos(e.target.value)} className="w-full bg-bgDark/80 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-accentGold" />

                    <div className="pt-2">
                        <p className="text-xs font-bold text-white mb-2">📉 Gastos de la Fecha</p>
                        {gastos.map((g) => (
                            <div key={g.id} className="flex gap-2 mb-2 items-center">
                                <input type="text" placeholder="Motivo" value={g.concepto} onChange={e => {
                                    setGastos(gastos.map(item => item.id === g.id ? { ...item, concepto: e.target.value } : item));
                                }} className="w-full bg-bgDark/60 border border-white/10 rounded-md p-2 text-white text-xs focus:outline-none" />
                                <input type="number" placeholder="$" value={g.monto} onChange={e => {
                                    setGastos(gastos.map(item => item.id === g.id ? { ...item, monto: e.target.value } : item));
                                }} className="w-20 bg-bgDark/60 border border-white/10 rounded-md p-2 text-white text-xs focus:outline-none" />
                                <button type="button" onClick={() => setGastos(gastos.filter(item => item.id !== g.id))} className="bg-red-600 text-white text-xs px-2.5 py-1.5 rounded-md font-bold">X</button>
                            </div>
                        ))}
                        <button type="button" onClick={() => setGastos([...gastos, { id: Date.now() + Math.random(), concepto: '', monto: '' }])} className="bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/20 rounded-md px-3 py-1.5 text-xs font-bold">
                            ➕ Añadir Gasto
                        </button>
                    </div>

                    <button type="submit" className={`w-full py-3 rounded-lg text-sm font-black uppercase tracking-wider transition-colors ${editId ? 'bg-accentGold text-black' : 'bg-accentGreen text-black'}`}>
                        {editId ? '💾 Actualizar Registro' : '➕ Guardar Show'}
                    </button>
                </form>

                <div className="flex bg-black/40 p-1 rounded-xl mt-6">
                    <button onClick={() => setPestaña('proximos')} className={`flex-1 py-2.5 rounded-lg text-xs font-bold tracking-widest ${pestaña === 'proximos' ? 'bg-accentGold text-black' : 'text-zinc-500'}`}>PRÓXIMOS</button>
                    <button onClick={() => setPestaña('realizados')} className={`flex-1 py-2.5 rounded-lg text-xs font-bold tracking-widest ${pestaña === 'realizados' ? 'bg-accentGold text-black' : 'text-zinc-500'}`}>HISTORIAL PRO</button>
                </div>

                <div className="bg-black/20 p-3 rounded-xl mt-3 border border-white/5 space-y-2">
                    <input type="text" placeholder="🔍 Buscar por nombre o dirección..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="w-full bg-bgDark/80 border border-white/5 rounded-lg p-2.5 text-white text-xs focus:outline-none" />
                    <select value={filtroDiaSemana} onChange={e => setFiltroDiaSemana(e.target.value)} className="w-full bg-bgDark/80 border border-white/5 rounded-lg p-2.5 text-white text-xs focus:outline-none">
                        <option value="todos">📅 Todos los días de la semana</option>
                        <option value="1">Lunes</option>
                        <option value="2">Martes</option>
                        <option value="3">Miércoles</option>
                        <option value="4">Jueves</option>
                        <option value="5">Viernes</option>
                        <option value="6">Sábado</option>
                        <option value="0">Domingo</option>
                    </select>
                    <div className="flex gap-2 pt-1">
                        {['todos', 'semana', 'mes'].map((t) => (
                            <button key={t} onClick={() => setFiltroTiempo(t)} className={`flex-1 py-1.5 rounded-md text-[10px] font-black tracking-wider border ${filtroTiempo === t ? 'bg-zinc-700 text-white border-zinc-500' : 'bg-transparent text-zinc-500 border-white/5'}`}>
                                {t === 'todos' ? 'TODOS' : t === 'semana' ? 'ESTA SEMANA' : 'ESTE MES'}
                            </button>
                        ))}
                    </div>
                </div>

                {pestaña === 'realizados' && (
                    <div className="grid grid-cols-2 gap-2 mt-4">
                        <div className="bg-zinc-950 p-2 rounded-lg border border-white/5 text-center">
                            <span className="text-[10px] text-zinc-500 font-bold block">TOTAL FECHAS</span>
                            <span className="text-white font-bold text-sm">{kpis.total}</span>
                        </div>
                        <div className="bg-zinc-950 p-2 rounded-lg border border-white/5 text-center">
                            <span className="text-[10px] text-zinc-500 font-bold block">INGRESO BRUTO</span>
                            <span className="text-sky-400 font-bold text-sm">${kpis.bruto.toLocaleString()}</span>
                        </div>
                        <div className="col-span-2 bg-emerald-950/30 border border-accentGreen/20 p-3 rounded-xl text-center">
                            <span className="text-[11px] text-accentGreen font-bold tracking-widest block">💰 GANANCIA ACUMULADA</span>
                            <span className="text-white font-black text-2xl">${kpis.ganancia.toLocaleString()}</span>
                        </div>
                    </div>
                )}

                <div className="mt-5 space-y-3">
                    {mesesAgrupados.length === 0 ? (
                        <p className="text-center text-xs text-zinc-600 py-6">Sin registros bajo los filtros actuales.</p>
                    ) : (
                        mesesAgrupados.map((g) => {
                            const [anio, mesNum] = g.clave.split('-');
                            const nombreMes = NOMBRES_MESES[parseInt(mesNum) - 1];
                            return (
                                <div key={g.clave} className="space-y-2">
                                    <div className={`text-xs font-black px-3 py-2 rounded-lg flex justify-between items-center bg-zinc-900 border-l-4 ${pestaña === 'realizados' ? 'border-accentGreen' : 'border-accentGold'}`}>
                                        <span className="text-white tracking-wide">📅 {nombreMes} {anio}</span>
                                        <span className="text-zinc-500 text-[10px]">{g.items.length} Shows</span>
                                    </div>
                                    <motion.div layout className="space-y-2">
                                        {g.items.map((s) => {
                                            const fObj = new Date(s.fecha);
                                            const gTotal = s.gastos ? s.gastos.reduce((acc,g)=> acc + g.monto, 0) : 0;
                                            const dobleAlerta = esFechaDoble(s.fecha) && pestaña === 'proximos';
                                            return (
                                                <motion.div 
                                                    layout
                                                    initial={{ opacity: 0, scale: 0.98 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.98 }}
                                                    key={s.id} 
                                                    className={`p-3 rounded-xl bg-zinc-900/60 border flex justify-between items-center gap-3 transition-colors ${dobleAlerta ? 'border-orange-500/40 bg-orange-950/10' : 'border-white/5'}`}
                                                >
                                                    <div onClick={() => setShowDetalle(s)} className="flex-1 min-w-0 cursor-pointer">
                                                        <div className="flex items-center gap-1.5 mb-1">
                                                            <span className={`text-[10px] font-black uppercase tracking-wider ${pestaña === 'realizados' ? 'text-accentGreen' : 'text-accentGold'}`}>
                                                                {DIAS_SEMANA[fObj.getDay()]} {fObj.toLocaleDateString([], {day:'2-digit', month:'2-digit'})}
                                                            </span>
                                                            {dobleAlerta && <span className="text-[9px] bg-orange-600 text-white px-1.5 py-0.2 rounded font-black animate-pulse">DOBLE FECHA</span>}
                                                        </div>
                                                        <h4 className={`text-sm font-bold text-white truncate ${pestaña === 'realizados' ? 'line-through text-zinc-600' : ''}`}>{s.nombre}</h4>
                                                        <p className="text-xs text-zinc-400 truncate">📍 {s.lugar}</p>
                                                        <div className="text-[11px] text-zinc-500 mt-1">
                                                            <span>Bruto: ${s.monto.toLocaleString()}</span> | <span className="text-accentGreen font-bold">Ganancia: ${(s.monto - gTotal).toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <button onClick={() => iniciarEdición(s)} className="p-1.5 rounded-md bg-sky-600/20 text-sky-400 border border-sky-500/20 hover:bg-sky-600/40">✏️</button>
                                                        <button onClick={() => eliminarRegistro(s.id)} className="p-1.5 rounded-md bg-red-600/20 text-red-400 border border-red-500/20 hover:bg-red-600/40">🗑️</button>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </motion.div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* 💾 NUEVA SECCIÓN: Copia de Seguridad */}
                <div className="mt-8 p-4 bg-zinc-900/40 border border-white/5 rounded-xl text-center">
                    <p className="text-xs text-white/40 mb-3">Zona de Seguridad (Evita perder tus datos)</p>
                    <div className="flex flex-wrap gap-3 justify-center">
                        <button 
                            type="button"
                            onClick={exportarRespaldo}
                            className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-accentGold text-xs font-bold rounded-lg transition-colors border border-amber-500/20"
                        >
                            💾 Guardar Copia en Celular
                        </button>
                        
                        <label className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/80 text-xs font-bold rounded-lg transition-colors border border-white/10 cursor-pointer block">
                            📂 Subir Copia Guardada
                            <input 
                                type="file" 
                                accept=".json" 
                                onChange={importarRespaldo} 
                                className="hidden" 
                            />
                        </label>
                    </div>
                </div>

                <AnimatePresence>
                    {showDetalle && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDetalle(null)} className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
                            <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }} onClick={e => e.stopPropagation()} className="bg-zinc-900 border-2 border-accentGold rounded-2xl w-full max-w-sm p-6 relative max-h-[85vh] overflow-y-auto">
                                <button onClick={() => setModoEscenario(!modoEscenario)} className="absolute top-4 left-4 text-xs font-bold px-2 py-1 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                                    {modoEscenario ? 'Texto Normal' : '🔎 Modo Escenario'}
                                </button>
                                <span onClick={() => setShowDetalle(null)} className="absolute top-3 right-4 text-2xl font-bold text-zinc-500 cursor-pointer hover:text-white">&times;</span>
                                <div className={`mt-6 space-y-4 ${modoEscenario ? 'text-lg' : 'text-sm'}`}>
                                    <div>
                                        <span className="text-[10px] text-accentGold font-black uppercase tracking-widest block">EVENTO</span>
                                        <h3 className="text-xl font-black text-white uppercase">{showDetalle.nombre}</h3>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-zinc-500 font-bold block">HORARIO Y FECHA</span>
                                        <p className="text-white font-medium capitalize">
                                            {DIAS_SEMANA[new Date(showDetalle.fecha).getDay()]}, {new Date(showDetalle.fecha).toLocaleDateString('es-ES', {day:'2-digit', month:'long'})} a las {new Date(showDetalle.fecha).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} hs
                                        </p>
                                    </div>
                                    <div className="bg-black/40 p-3 rounded-lg border border-white/5">
                                        <span className="text-[10px] text-zinc-500 font-bold block mb-0.5">📍 LUGAR DEL EVENTO</span>
                                        <p className="text-white font-semibold">{showDetalle.lugar}</p>
                                        {showDetalle.maps && (
                                            <a href={showDetalle.maps} target="_blank" rel="noreferrer" className="block w-full text-center bg-sky-600 text-white text-xs font-black py-2.5 rounded-md mt-2 tracking-wider">🗺️ ABRIR GOOGLE MAPS</a>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-zinc-950 p-2.5 rounded-lg border border-white/5 text-center">
                                            <span className="text-[10px] text-sky-400 font-bold block">Caja Bruta</span>
                                            <span className="text-white font-black">${showDetalle.monto.toLocaleString()}</span>
                                        </div>
                                        <div className="bg-zinc-950 p-2.5 rounded-lg border border-white/5 text-center">
                                            <span className="text-[10px] text-red-400 font-bold block">Gastos</span>
                                            <span className="text-white font-black">${showDetalle.gastos ? showDetalle.gastos.reduce((acc,g)=> acc + g.monto, 0).toLocaleString() : 0}</span>
                                        </div>
                                    </div>
                                    <div className="bg-emerald-950/40 border border-accentGreen p-3 rounded-xl text-center">
                                        <span className="text-[10px] text-accentGreen font-black tracking-widest block">💰 GANANCIA LIMPIA</span>
                                        <span className="text-white font-black text-2xl">${(showDetalle.monto - (showDetalle.gastos ? showDetalle.gastos.reduce((acc,g)=> acc + g.monto, 0) : 0)).toLocaleString()}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-zinc-500 font-bold block mb-1">📉 DESGLOSE GASTOS</span>
                                        {showDetalle.gastos && showDetalle.gastos.length > 0 ? (
                                            <ul className="text-xs text-zinc-400 bg-black/20 p-2.5 rounded-lg space-y-1">
                                                {showDetalle.gastos.map((g, index) => (
                                                    <li key={index} className="flex justify-between border-b border-white/5 pb-1 last:border-0">
                                                        <span>• {g.concepto}</span>
                                                        <span className="text-red-400 font-bold">${g.monto.toLocaleString()}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : <p className="text-xs text-zinc-600 italic">Sin gastos.</p>}
                                    </div>
                                    {showDetalle.requisitos && (
                                        <div className="bg-amber-500/10 border-l-4 border-accentGold p-3 rounded-md">
                                            <span className="text-[10px] text-accentGold font-black block mb-0.5">⚠️ REQUISITOS</span>
                                            <p className="text-white font-medium text-xs">{showDetalle.requisitos}</p>
                                        </div>
                                    )}
                                    <button onClick={() => copiarWhatsApp(showDetalle)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black py-3 rounded-xl mt-2 tracking-wider flex items-center justify-center gap-2">💬 COMPARTIR POR WHATSAPP</button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default App;