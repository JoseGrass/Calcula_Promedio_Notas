import React, { useState } from "react";

export default function App() {
  // ---- Estado global ----
  const [materias, setMaterias] = useState([]);
  const [form, setForm] = useState({ nombre: "", creditos: "1", cortes: "3" });
  const [notaMinima, setNotaMinima] = useState("3.0");
  const [ponderarCreditos, setPonderarCreditos] = useState(false);
  const [mensajeSemestre, setMensajeSemestre] = useState("");

  // ---- Utilidades ----
  const toNum = (v, def = 0) => (v === "" || v === null || isNaN(Number(v)) ? def : Number(v));
  const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

  const estilos = {
    app: { fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Arial', background: '#f6f8fb', minHeight: '100vh', padding: 16, color: '#222' },
    shell: { maxWidth: 980, margin: '0 auto' },
    h1: { fontSize: 24, margin: '4px 0 12px', textAlign: 'center' },
    card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 16, boxShadow: '0 6px 18px rgba(0,0,0,.06)', marginBottom: 16 },
    label: { fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 },
    input: { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #d1d5db', fontSize: 14 },
    row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
    row3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 },
    btn: { padding: '10px 12px', borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 700, cursor: 'pointer' },
    btnGhost: { padding: '10px 12px', borderRadius: 10, border: '1px solid #c7d2fe', background: '#eef2ff', color: '#111827', cursor: 'pointer', fontWeight: 600 },
    btnDanger: { padding: '10px 12px', borderRadius: 10, border: 'none', background: '#dc2626', color: '#fff', fontWeight: 700, cursor: 'pointer' },
    chip: { display: 'inline-block', padding: '4px 8px', borderRadius: 999, background: '#f1f5f9', border: '1px solid #e2e8f0', fontSize: 12 },
    res: { marginTop: 8, fontWeight: 700 },
    ok: { color: '#16a34a' },
    warn: { color: '#b45309' },
    err: { color: '#dc2626' },
    footer: { position: 'sticky', bottom: 0, background: 'linear-gradient(0deg,#ffffffee,#ffffffcc)', borderTop: '1px solid #e5e7eb', backdropFilter: 'saturate(150%) blur(8px)' },
  };

  // Responsive helpers via inline @media (simple):
  const mediaQuery = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(max-width: 640px)') : null;
  if (mediaQuery && mediaQuery.matches) {
    estilos.row.gridTemplateColumns = '1fr';
    estilos.row3.gridTemplateColumns = '1fr 1fr';
  }

  // ---- Acciones ----
  const agregarMateria = () => {
    const nombre = form.nombre.trim() || `Materia ${materias.length + 1}`;
    const creditos = clamp(toNum(form.creditos, 1), 0, 99);
    const n = clamp(toNum(form.cortes, 3), 1, 10);
    const cortes = Array.from({ length: n }, () => ({ peso: '', nota: '' }));
    setMaterias([{ id: cryptoRandomId(), nombre, creditos, cortes }, ...materias]);
    setForm({ nombre: '', creditos: '1', cortes: '3' });
  };

  const cryptoRandomId = () => {
    try { return crypto.randomUUID(); } catch { return 'id' + Math.random().toString(36).slice(2); }
  };

  const eliminarMateria = (id) => {
    setMaterias((prev) => prev.filter((m) => m.id !== id));
    setMensajeSemestre('');
  };

  const setCortesCount = (id, nuevoN) => {
    setMaterias(prev => prev.map(m => {
      if (m.id !== id) return m;
      const n = clamp(toNum(nuevoN, m.cortes.length), 1, 10);
      const nuevos = [...m.cortes];
      if (n > nuevos.length) {
        for (let i = nuevos.length; i < n; i++) nuevos.push({ peso: '', nota: '' });
      } else if (n < nuevos.length) {
        nuevos.length = n;
      }
      return { ...m, cortes: nuevos };
    }));
  };

  const actualizarCampoCorte = (id, idx, campo, valor) => {
    setMaterias(prev => prev.map(m => {
      if (m.id !== id) return m;
      const cortes = m.cortes.map((c, i) => i === idx ? { ...c, [campo]: valor } : c);
      return { ...m, cortes };
    }));
  };

  const validarPesos = (pesos) => {
    const suma = Number(pesos.reduce((a, b) => a + (toNum(b, 0)), 0).toFixed(2));
    return { ok: Math.abs(suma - 100) < 0.01, suma };
  };

  const promedioMateria = (m) => {
    const pesos = m.cortes.map(c => toNum(c.peso, 0));
    const notas = m.cortes.map(c => c.nota === '' ? null : toNum(c.nota, 0));
    const { ok, suma } = validarPesos(pesos);
    if (!ok) return { texto: `⚠️ Los porcentajes suman ${suma}%. Deben ser 100%.`, clase: 'err' };

    let acumulado = 0, pesoUsado = 0, tieneVacias = false;
    for (let i = 0; i < pesos.length; i++) {
      const p = pesos[i] / 100;
      const n = notas[i];
      if (n === null) { tieneVacias = true; continue; }
      acumulado += n * p; pesoUsado += p;
    }
    if (pesoUsado === 0) return { texto: '⚠️ Ingresa al menos una nota.', clase: 'warn' };
    const prom = acumulado / pesoUsado;
    return { texto: `${tieneVacias ? '📘 Promedio parcial' : '📘 Promedio final'}: ${prom.toFixed(2)}`, clase: 'ok', valor: prom };
  };

  const necesariaMateria = (m) => {
    const pesos = m.cortes.map(c => toNum(c.peso, 0));
    const notas = m.cortes.map(c => c.nota === '' ? null : toNum(c.nota, 0));
    const { ok, suma } = validarPesos(pesos);
    if (!ok) return { texto: `⚠️ Los porcentajes suman ${suma}%. Deben ser 100%.`, clase: 'err' };

    let acumulado = 0, faltante = 0;
    for (let i = 0; i < pesos.length; i++) {
      const p = pesos[i] / 100, n = notas[i];
      if (n === null) faltante += p; else acumulado += n * p;
    }
    if (faltante === 0) return { texto: `✅ Ya ingresaste todas las notas. Promedio final: ${acumulado.toFixed(2)}`, clase: 'ok' };

    const meta = toNum(notaMinima, 3.0);
    const necesaria = (meta - acumulado) / faltante;
    if (necesaria > 5) return { texto: `❌ Necesitarías ${necesaria.toFixed(2)}, mayor a 5.0 (imposible).`, clase: 'err' };
    if (necesaria <= 0) return { texto: `🎉 Con lo que llevas ya aseguras al menos ${meta.toFixed(1)}.`, clase: 'ok' };
    return { texto: `🧮 Necesitas promedio de ${necesaria.toFixed(2)} en los cortes restantes para llegar a ${meta.toFixed(1)}.`, clase: 'warn' };
  };

  const calcularSemestre = () => {
    if (materias.length === 0) { setMensajeSemestre('Agrega al menos una materia.'); return; }
    let sum = 0, peso = 0, incluidas = 0, omitidas = 0;
    materias.forEach(m => {
      const pesos = m.cortes.map(c => toNum(c.peso, 0));
      const notas = m.cortes.map(c => c.nota === '' ? null : toNum(c.nota, 0));
      const { ok } = validarPesos(pesos);
      const completas = notas.every(n => n !== null);
      if (ok && completas) {
        const prom = notas.reduce((acc, n, i) => acc + n * (pesos[i] / 100), 0);
        const w = ponderarCreditos ? Math.max(1, toNum(m.creditos, 1)) : 1;
        sum += prom * w; peso += w; incluidas++;
      } else { omitidas++; }
    });
    if (peso === 0) { setMensajeSemestre('Aún no hay materias completas para promediar.'); return; }
    const promSem = (sum / peso).toFixed(2);
    const detalle = ponderarCreditos ? ' (ponderado por créditos)' : '';
    setMensajeSemestre(`📊 Promedio del semestre: ${promSem}${detalle}. Incluidas: ${incluidas}. Omitidas: ${omitidas}.`);
  };

  const limpiarTodo = () => {
    setMaterias([]); setMensajeSemestre('');
  };

  return (
    <div style={estilos.app}>
      <div style={estilos.shell}>
        <h1 style={estilos.h1}>📚 Calculadora de Promedio — React (móvil y web)</h1>

        {/* Formulario alta de materia */}
        <div style={estilos.card}>
          <div style={estilos.row}>
            <div>
              <label style={estilos.label}>Nombre de la materia</label>
              <input style={estilos.input} value={form.nombre} onChange={e=>setForm(f=>({...f, nombre:e.target.value}))} placeholder="Ej: Matemáticas" />
            </div>
            <div>
              <label style={estilos.label}>Créditos</label>
              <input style={estilos.input} type="number" min={0} step={1} value={form.creditos} onChange={e=>setForm(f=>({...f, creditos:e.target.value}))} />
            </div>
          </div>
          <div style={{...estilos.row, marginTop: 8}}>
            <div>
              <label style={estilos.label}>Número de cortes</label>
              <input style={estilos.input} type="number" min={1} max={10} value={form.cortes} onChange={e=>setForm(f=>({...f, cortes:e.target.value}))} />
            </div>
            <div style={{display:'flex', gap:8, alignItems:'flex-end'}}>
              <button style={estilos.btn} onClick={agregarMateria}>➕ Agregar materia</button>
              <button style={estilos.btnGhost} onClick={()=>{
                setForm({ nombre:'Matemáticas', creditos:'3', cortes:'3' });
              }}>⚡ Ejemplo</button>
            </div>
          </div>
          <p style={{fontSize:12, color:'#6b7280', marginTop:8}}>Consejo: los porcentajes de cada materia deben sumar <b>100%</b>. Las notas van de 0.0 a 5.0.</p>
        </div>

        {/* Lista de materias */}
        <div style={{ display:'grid', gridTemplateColumns: mediaQuery && mediaQuery.matches ? '1fr' : '1fr 1fr 1fr', gap: 10 }}>
          {materias.map((m) => (
            <div key={m.id} style={estilos.card}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:8}}>
                <h3 style={{margin:0}}>Materia: <b>{m.nombre}</b> {m.creditos>0 && (<span style={{...estilos.chip, marginLeft:8}}>cr: {m.creditos}</span>)}</h3>
                <button style={estilos.btnDanger} onClick={()=>eliminarMateria(m.id)}>🗑️ Eliminar</button>
              </div>

              <div style={{...estilos.row, marginTop:8}}>
                <div>
                  <label style={estilos.label}>N° de cortes</label>
                  <input style={estilos.input} type="number" min={1} max={10} value={m.cortes.length}
                         onChange={e=> setCortesCount(m.id, e.target.value)} />
                </div>
                <div>
                  <label style={estilos.label}>Acciones rápidas</label>
                  <div style={{display:'flex', gap:8}}>
                    <button style={estilos.btnGhost} onClick={()=>{
                      // Relleno ejemplo 30/30/40
                      setMaterias(prev=>prev.map(x=> x.id===m.id ? ({...x, cortes: x.cortes.map((c,i)=>({ peso:[30,30,40][i]||0, nota: i<2? [3.2,3.8][i] : '' })) }) : x));
                    }}>Rellenar ejemplo</button>
                  </div>
                </div>
              </div>

              {/* Cortes */}
              <div style={{display:'grid', gridTemplateColumns: '1fr 1fr', gap:10, marginTop:8}}>
                {m.cortes.map((c, i) => (
                  <div key={i} style={{border:'1px solid #e5e7eb', borderRadius:12, padding:10}}>
                    <label style={estilos.label}>Peso corte {i+1} (%)</label>
                    <input style={estilos.input} type="number" min={0} max={100} step={0.1} value={c.peso}
                           onChange={e=>actualizarCampoCorte(m.id, i, 'peso', e.target.value)} />
                    <label style={{...estilos.label, marginTop:6}}>Nota {i+1} (opcional)</label>
                    <input style={estilos.input} type="number" min={0} max={5} step={0.1} value={c.nota}
                           onChange={e=>actualizarCampoCorte(m.id, i, 'nota', e.target.value)} />
                  </div>
                ))}
              </div>

              {/* Resultados por materia */}
              <div style={{display:'flex', gap:8, flexWrap:'wrap', marginTop:8}}>
                <MateriaResultado m={m} promedioMateria={promedioMateria} necesariaMateria={necesariaMateria} estilos={estilos} />
              </div>
            </div>
          ))}
        </div>

        {/* Footer acciones de semestre */}
        <div style={{...estilos.footer, marginTop:12}}>
          <div style={{...estilos.shell, padding: '12px 16px'}}>
            <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
              <span style={{display:'inline-flex', alignItems:'center', gap:8, border:'1px solid #e5e7eb', background:'#fff', borderRadius:999, padding:'6px 10px'}}>
                <label style={estilos.label}>Nota mínima</label>
                <input style={{...estilos.input, width:90}} type="number" step={0.1} min={0} max={5} value={notaMinima} onChange={e=>setNotaMinima(e.target.value)} />
              </span>
              <span style={{display:'inline-flex', alignItems:'center', gap:8, border:'1px solid #e5e7eb', background:'#fff', borderRadius:999, padding:'6px 10px'}}>
                <input id="pond" type="checkbox" checked={ponderarCreditos} onChange={e=>setPonderarCreditos(e.target.checked)} />
                <label htmlFor="pond" style={{fontSize:12}}>Ponderar semestre por créditos</label>
              </span>
              <button style={estilos.btn} onClick={calcularSemestre}>📊 Promedio del semestre</button>
              <button style={estilos.btnGhost} onClick={limpiarTodo}>🧹 Limpiar todo</button>
              {mensajeSemestre && <span style={{...estilos.res, color:'#2563eb'}}>{mensajeSemestre}</span>}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function MateriaResultado({ m, promedioMateria, necesariaMateria, estilos }){
  const prom = promedioMateria(m);
  const nec = necesariaMateria(m);
  const clsColor = (c) => c === 'err' ? estilos.err : c === 'ok' ? estilos.ok : estilos.warn;
  return (
    <>
      <button style={estilos.btn} onClick={(e)=>{ e.preventDefault(); alert(prom.texto); }}>Promedio</button>
      <button style={estilos.btnGhost} onClick={(e)=>{ e.preventDefault(); alert(nec.texto); }}>Nota necesaria</button>
      <div style={{...estilos.res, ...clsColor(prom.clase)}}>{prom.texto}</div>
      <div style={{...estilos.res, ...clsColor(nec.clase)}}>{nec.texto}</div>
    </>
  );
}
