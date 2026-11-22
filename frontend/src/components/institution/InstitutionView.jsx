import React, { useState, useEffect, useCallback, useRef } from 'react';
import { institutionTimeline } from '../../data/facultyData';
import { Eye, History, Target, Users, FlaskConical, Globe2, Award } from 'lucide-react';
import { useScrollReveal } from '../../utils/reveal';

import slide1 from '../../assets/images/carrusel/slide1.jpg';
import { docenteService } from '../../services/docenteService';
import { apiJson } from '../../utils/api';
import AdministrativeStaffSection from './AdministrativeStaffSection';
import FacultySection from './FacultySection';
import './InstitutionalHistory.css';

// ── Carga de datos con verificación de conexión ──
const withTimeout = (promise, ms = 12000) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Tiempo de espera agotado')), ms)),
  ]);

// Acepta [..] o { data: [..] }. Cualquier otra forma se considera respuesta inválida.
const toList = (response) => {
  const data = response?.data ?? response;
  return Array.isArray(data) ? data : null;
};

// Definidos fuera del componente para que su referencia sea estable.
const fetchDocentes = () => docenteService.getPublicDocentes();
const fetchPersonal = () => apiJson('/api/personal-administrativo');

function useRemoteList(fetcher, label) {
  const [state, setState] = useState({ items: [], status: 'loading', error: '', lastSync: null });
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setState((prev) => ({ ...prev, status: 'loading', error: '' }));
    try {
      const list = toList(await withTimeout(fetcher()));
      if (!list) throw new Error('La respuesta del servidor no tiene el formato esperado');
      if (id === requestId.current) setState({ items: list, status: 'ready', error: '', lastSync: new Date() });
    } catch (err) {
      console.error(`Error cargando ${label}:`, err);
      // Conserva los datos previos (si los hay) en vez de vaciar la pantalla.
      if (id === requestId.current) setState((prev) => ({ ...prev, status: 'error', error: err?.message || 'Error de conexión' }));
    }
  }, [fetcher, label]);

  useEffect(() => {
    load();
    return () => { requestId.current += 1; };
  }, [load]);

  return { ...state, reload: load };
}

export const InstitutionView = () => {
  const docentes = useRemoteList(fetchDocentes, 'docentes');
  const personal = useRemoteList(fetchPersonal, 'personal administrativo');

  // Inicializar observador de scroll para [data-reveal]
  useScrollReveal();

  return (
    <div className="institution-page" style={{ paddingBottom: 'calc(var(--space-xl) + 4.5rem + env(safe-area-inset-bottom))', background: '#f8fafc' }}>
      
      {/* ── 1. Hero Institucional (Sección Clara) ── */}
      <section className="section-spacing section-contrast-light" style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
        <div className="container" data-reveal>
          <div style={{ maxWidth: '840px', margin: '0 auto', textAlign: 'center' }}>
            <span className="eyebrow" style={{ borderRadius: '4px' }}>Nuestra Institución</span>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.3rem, 4.8vw, 3.8rem)', margin: 'var(--space-2xs) 0 var(--space-xs) 0', color: '#0f172a', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.12 }}>
              Excelencia Académica, Investigación &amp; Rigor Estadístico
            </h1>
            <p className="lead" style={{ color: '#475569', margin: '0 0 var(--space-md) 0', fontSize: '1.15rem' }}>
              Unidad de Posgrado e Investigación de la Carrera de Estadística — Facultad de Ciencias Puras y Naturales, Universidad Mayor de San Andrés.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <ul className="pill-list pill-list--green" style={{ justifyContent: 'center' }}>
                <li>Acreditación CEUB</li>
                <li>Modelación Estocástica</li>
                <li>Ciencia de Datos &amp; IA</li>
                <li>Bioestadística</li>
                <li>Inferencia Causal</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Misión, visión y valores institucionales */}
      <section className="institution-principles" data-reveal aria-labelledby="principles-title">
        <div className="container">
          <header className="institution-principles__header">
            <span className="institution-principles__eyebrow">Nuestra identidad</span>
            <h2 id="principles-title">Misión, visión y valores</h2>
            <p>El compromiso que guía la formación estadística en la UMSA.</p>
          </header>
          <div className="institution-principles__cards">
            <article className="institution-principle-card institution-principle-card--mission">
              <div className="institution-principle-card__icon"><Target size={22} aria-hidden="true" /></div>
              <span className="institution-principle-card__eyebrow">Nuestro propósito</span>
              <h3>Misión</h3>
              <p>Formar profesionales idóneos y competentes en Estadística, capaces de generar soluciones creativas e innovadoras, comprometidos con el desarrollo nacional.</p>
            </article>
            <article className="institution-principle-card institution-principle-card--vision">
              <div className="institution-principle-card__icon"><Eye size={22} aria-hidden="true" /></div>
              <span className="institution-principle-card__eyebrow">Nuestro horizonte</span>
              <h3>Visión</h3>
              <p>Ser líder en la formación de profesionales en ciencia estadística, buscando excelencia académica mediante docencia, investigación y extensión.</p>
            </article>
          </div>

          <div className="institution-values">
            <div className="institution-values__heading">
              <span className="institution-principles__eyebrow">Principios que nos representan</span>
              <h3>Nuestros valores</h3>
            </div>
            <div className="institution-values__grid">
              <article className="institution-value-card institution-value-card--green">
                <div className="institution-value-card__icon"><Award size={22} aria-hidden="true" /></div>
                <h4>Excelencia académica</h4>
                <p>Formación de profesionales altamente calificados, con pensamiento crítico y capacidad analítica.</p>
              </article>
              <article className="institution-value-card institution-value-card--blue">
                <div className="institution-value-card__icon"><Users size={22} aria-hidden="true" /></div>
                <h4>Inclusión e igualdad</h4>
                <p>Educación de calidad accesible para todos los sectores de la sociedad boliviana, sin discriminación.</p>
              </article>
              <article className="institution-value-card institution-value-card--blue">
                <div className="institution-value-card__icon"><FlaskConical size={22} aria-hidden="true" /></div>
                <h4>Investigación científica</h4>
                <p>Generación de conocimiento aplicado mediante el IETA para resolver problemas nacionales estratégicos.</p>
              </article>
              <article className="institution-value-card institution-value-card--green">
                <div className="institution-value-card__icon"><Globe2 size={22} aria-hidden="true" /></div>
                <h4>Responsabilidad social</h4>
                <p>Contribución activa al desarrollo sostenible mediante análisis estadístico ético y socialmente responsable.</p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <AdministrativeStaffSection people={personal.items} status={personal.status} error={personal.error} lastSync={personal.lastSync} onRetry={personal.reload} />

      <section className="institution-history" data-reveal aria-labelledby="history-title">
        <div className="container">
          <div className="institution-history__header">
            <span className="institution-history__eyebrow">
              <History size={16} aria-hidden="true" /> Memoria &amp; Trayectoria Institucional
            </span>
            <h2 id="history-title">Historia de la Carrera de Estadística</h2>
            <p>
              Más de cinco décadas de evolución académica: de sus orígenes como mención universitaria a una institución referente en ciencia de datos, estadística teórica y aplicada.
            </p>

            <div className="institution-history__stats">
              <div className="institution-history__stat-item">
                <span className="institution-history__stat-num">1965</span>
                <span className="institution-history__stat-label">Primeros Antecedentes</span>
              </div>
              <div className="institution-history__stat-sep" aria-hidden="true">·</div>
              <div className="institution-history__stat-item">
                <span className="institution-history__stat-num">1984</span>
                <span className="institution-history__stat-label">Carrera Independiente</span>
              </div>
              <div className="institution-history__stat-sep" aria-hidden="true">·</div>
              <div className="institution-history__stat-item">
                <span className="institution-history__stat-num">1985</span>
                <span className="institution-history__stat-label">Creación del IETA</span>
              </div>
              <div className="institution-history__stat-sep" aria-hidden="true">·</div>
              <div className="institution-history__stat-item">
                <span className="institution-history__stat-num">50+</span>
                <span className="institution-history__stat-label">Años de Excelencia</span>
              </div>
            </div>
          </div>

          <div className="institution-timeline">
            {institutionTimeline.map((item, idx) => (
              <article key={idx} className="institution-timeline__item">
                <div className="institution-timeline__year-col">
                  <span className="institution-timeline__index">Hito {String(idx + 1).padStart(2, '0')}</span>
                  <div className="institution-timeline__year">{item.year}</div>
                </div>
                <div className="institution-timeline__node" aria-hidden="true">
                  <span className="institution-timeline__node-dot" />
                </div>
                <div className="institution-timeline__content">
                  <div className="institution-timeline__mobile-year">
                    <span className="institution-timeline__index">Hito {String(idx + 1).padStart(2, '0')}</span>
                    <span className="institution-timeline__year-badge">{item.year}</span>
                  </div>
                  <h3 className="institution-timeline__title">{item.title}</h3>
                  <p className="institution-timeline__desc">{item.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <FacultySection faculty={docentes.items} status={docentes.status} error={docentes.error} lastSync={docentes.lastSync} onRetry={docentes.reload} />

      <style>{`
        @media (max-width: 768px) {
          .director-card-grid {
            grid-template-columns: 1fr !important;
            text-align: center !important;
          }
        }
      `}</style>
    </div>
  );
};
