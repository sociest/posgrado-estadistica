import React, { useCallback, useEffect, useState } from 'react';
import { BriefcaseBusiness, Plus, RefreshCw, Save, X } from 'lucide-react';
import { apiJson } from '../../../utils/api';
import { useDialogAccessibility } from '../../../hooks/useDialogAccessibility';

const FORMULARIO_VACIO = {
  nombre: '',
  cargo: '',
  grado: '',
  oficina: '',
  email: '',
  telefono: '',
  biografia: '',
  foto_url: '',
  es_director: false,
  orden: 1,
  activo: true,
};

const registrosDe = (respuesta) => {
  const datos = respuesta?.data ?? respuesta;
  return Array.isArray(datos) ? datos : [];
};

export default function PersonalAdministrativoPanel() {
  const [personal, setPersonal] = useState([]);
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [registroId, setRegistroId] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const dialogRef = useDialogAccessibility(modalAbierto, () => { if (!guardando) setModalAbierto(false); });

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setPersonal(registrosDe(await apiJson('/api/admin/personal-administrativo')));
      setError('');
    } catch (err) {
      setError(err.message || 'No se pudo cargar el personal administrativo.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const abrirNuevo = () => {
    setRegistroId(null);
    setFormulario({ ...FORMULARIO_VACIO, orden: personal.length + 1 });
    setError('');
    setModalAbierto(true);
  };

  const abrirEdicion = (persona) => {
    setRegistroId(persona.id_personal);
    setFormulario({ ...FORMULARIO_VACIO, ...persona });
    setError('');
    setModalAbierto(true);
  };

  const guardar = async (evento) => {
    evento.preventDefault();
    setGuardando(true);
    setError('');
    try {
      await apiJson(registroId ? `/api/personal-administrativo/${registroId}` : '/api/personal-administrativo', {
        method: registroId ? 'PUT' : 'POST',
        body: { ...formulario, orden: Number(formulario.orden) },
      });
      setModalAbierto(false);
      setAviso(registroId ? 'Personal administrativo actualizado.' : 'Personal administrativo guardado en la base de datos.');
      await cargar();
    } catch (err) {
      setError(err.message || 'No se pudo guardar el registro.');
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async (persona) => {
    const accion = persona.activo ? 'desactivar' : 'reactivar';
    try {
      await apiJson(`/api/personal-administrativo/${persona.id_personal}/${accion}`, { method: 'PATCH' });
      setAviso(persona.activo ? 'Registro desactivado.' : 'Registro reactivado.');
      await cargar();
    } catch (err) {
      setError(err.message || 'No se pudo cambiar el estado del registro.');
    }
  };

  return (
    <section className="animate-fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.35rem', color: 'var(--color-text-main)', fontWeight: 800, margin: 0 }}>Personal administrativo</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: '0.35rem 0 0' }}>Estos registros se publican en la sección institucional del portal.</p>
        </div>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={cargar} disabled={cargando}><RefreshCw size={15} /> Actualizar</button>
          <button type="button" className="btn btn-primary" onClick={abrirNuevo}><Plus size={16} /> Agregar personal</button>
        </div>
      </header>

      {aviso && <p role="status" className="em-alert em-alert-success">{aviso}</p>}
      {error && !modalAbierto && <p role="alert" className="em-alert em-alert-error">{error}</p>}

      <div className="data-table-container">
        <table className="data-table">
          <thead><tr><th>Nombre</th><th>Cargo</th><th>Oficina</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {cargando ? <tr><td colSpan={5}>Cargando personal…</td></tr> : personal.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No hay personal administrativo registrado.</td></tr>
            ) : personal.map((persona) => (
              <tr key={persona.id_personal}>
                <td><strong>{persona.nombre}</strong>{persona.es_director && <div style={{ color: 'var(--color-green-inst)', fontSize: '.78rem' }}>Dirección</div>}</td>
                <td>{persona.cargo}</td>
                <td>{persona.oficina || '—'}</td>
                <td>{persona.activo ? 'Activo' : 'Inactivo'}</td>
                <td style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => abrirEdicion(persona)}>Editar</button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => cambiarEstado(persona)}>{persona.activo ? 'Desactivar' : 'Reactivar'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <div className="modal-overlay" onClick={() => !guardando && setModalAbierto(false)}>
          <form ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="personal-dialog-title" tabIndex={-1} className="modal-content" onSubmit={guardar} onClick={(evento) => evento.stopPropagation()} style={{ maxWidth: 760, padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 id="personal-dialog-title" style={{ margin: 0 }}>{registroId ? 'Editar personal administrativo' : 'Agregar personal administrativo'}</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setModalAbierto(false)} disabled={guardando} aria-label="Cerrar"><X size={16} /></button>
            </div>
            {error && <p role="alert" className="em-alert em-alert-error">{error}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <label className="form-group">Nombre completo<input className="form-input" required maxLength={150} value={formulario.nombre} onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })} /></label>
              <label className="form-group">Grado o título<input className="form-input" maxLength={200} value={formulario.grado || ''} onChange={(e) => setFormulario({ ...formulario, grado: e.target.value })} /></label>
              <label className="form-group">Oficina<input className="form-input" maxLength={255} value={formulario.oficina || ''} onChange={(e) => setFormulario({ ...formulario, oficina: e.target.value })} /></label>
              <label className="form-group">Correo electrónico<input className="form-input" type="email" maxLength={255} value={formulario.email || ''} onChange={(e) => setFormulario({ ...formulario, email: e.target.value })} /></label>
              <label className="form-group">Teléfono<input className="form-input" type="tel" maxLength={40} value={formulario.telefono || ''} onChange={(e) => setFormulario({ ...formulario, telefono: e.target.value })} /></label>
              <label className="form-group">URL de fotografía<input className="form-input" type="url" value={formulario.foto_url || ''} onChange={(e) => setFormulario({ ...formulario, foto_url: e.target.value })} placeholder="https://…" /></label>
              <label className="form-group">Orden de presentación<input className="form-input" type="number" min="0" value={formulario.orden} onChange={(e) => setFormulario({ ...formulario, orden: e.target.value })} /></label>
              <label className="form-group" style={{ gridColumn: '1 / -1' }}>Biografía<textarea className="form-input" rows={4} value={formulario.biografia || ''} onChange={(e) => setFormulario({ ...formulario, biografia: e.target.value })} /></label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}><input type="checkbox" checked={Boolean(formulario.es_director)} onChange={(e) => setFormulario({ ...formulario, es_director: e.target.checked })} /> Mostrar como dirección</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}><input type="checkbox" checked={Boolean(formulario.activo)} onChange={(e) => setFormulario({ ...formulario, activo: e.target.checked })} /> Publicar en el portal</label>
            </div>
            <footer style={{ display: 'flex', justifyContent: 'flex-end', gap: '.75rem', marginTop: '1.25rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setModalAbierto(false)} disabled={guardando}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={guardando}>{guardando ? <BriefcaseBusiness size={16} /> : <Save size={16} />} {guardando ? 'Guardando…' : 'Guardar en base de datos'}</button>
            </footer>
          </form>
        </div>
      )}
    </section>
  );
}
