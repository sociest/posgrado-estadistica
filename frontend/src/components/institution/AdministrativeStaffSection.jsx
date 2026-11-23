import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Compass,
  RefreshCw,
  UserRound,
} from 'lucide-react';
import { DataStatus, getInitials } from './InstitutionUI';
import './AdministrativeStaffSection.css';

const isTrue = (v) => v === true || v === 1 || v === '1' || v === 'true';

function StaffAvatar({ nombre, fotoUrl, className = 'staff-avatar' }) {
  const [showPhoto, setShowPhoto] = useState(Boolean(fotoUrl));
  useEffect(() => { setShowPhoto(Boolean(fotoUrl)); }, [fotoUrl]);

  return (
    <div className={className} aria-hidden="true">
      {showPhoto ? (
        <img
          src={fotoUrl}
          alt={`Fotografía de ${nombre}`}
          loading="lazy"
          onError={() => setShowPhoto(false)}
        />
      ) : (
        <span>{getInitials(nombre) || '?'}</span>
      )}
    </div>
  );
}

function StaffCard({ person, isDirector = false }) {
  const nombre = person.nombre?.trim() || 'Funcionario Administrativo';
  const cargo = person.cargo || (isDirector ? 'Director de la Carrera de Estadística' : 'Gestión Administrativa');

  return (
    <article className="staff-card directory-row">
      <div className="directory-row__identity">
        <figure className="directory-row__photo">
          <StaffAvatar nombre={nombre} fotoUrl={person.foto_url} className="directory-row__avatar" />
          <figcaption className="sr-only">Fotografía de {nombre}</figcaption>
        </figure>
        <div>
          <h3 className="staff-card__name">{nombre}</h3>
          <p className="staff-card__cargo">{cargo}</p>
        </div>
      </div>
    </article>
  );
}

export default function AdministrativeStaffSection({
  people = [],
  status = 'loading',
  error = '',
  onRetry
}) {
  const directorIndex = people.findIndex((p) => isTrue(p.es_director));
  const director = directorIndex >= 0 ? people[directorIndex] : null;
  const staff = people.filter((_, i) => i !== directorIndex);

  const directoryPeople = director ? [director, ...staff] : staff;

  const loading = status === 'loading' && people.length === 0;
  const failed = status === 'error' && people.length === 0;
  const empty = status === 'ready' && people.length === 0;

  return (
    <section className="staff-section" aria-labelledby="staff-heading">
      <div className="staff-section__inner">
        {/* Cabecera Principal */}
        <header className="staff-header">
          <div>
            <div className="staff-header__kicker">
              <Compass size={14} aria-hidden="true" />
              <span>ESTRUCTURA ORGANIZACIONAL &amp; GESTIÓN</span>
            </div>
            <h2 id="staff-heading">Dirección y Personal Administrativo</h2>
            <p>
              Cuerpo directivo y profesional responsable del soporte operativo, trámites estudiantiles, admisiones y gestión institucional de la Carrera de Estadística.
            </p>
          </div>
          {status !== 'ready' && <DataStatus
            status={status}
            count={people.length}
            noun={people.length === 1 ? 'funcionario' : 'funcionarios'}
            error={error}
            onRetry={onRetry}
          />}
        </header>

        {/* Estados de Carga, Error y Vacío */}
        {loading && (
          <div className="staff-cards-grid" aria-hidden="true">
            {[1, 2, 3].map((n) => (
              <div key={n} className="staff-skeleton-card">
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div className="staff-skeleton-avatar" />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="staff-skeleton-line" style={{ width: '75%', height: '16px' }} />
                    <div className="staff-skeleton-line" style={{ width: '50%' }} />
                  </div>
                </div>
                <div className="staff-skeleton-line" style={{ width: '40%' }} />
                <div className="staff-skeleton-line" style={{ width: '90%' }} />
              </div>
            ))}
          </div>
        )}

        {failed && (
          <div className="inst-panel inst-panel--error" style={{ textAlign: 'center', padding: '3rem 1.5rem', background: '#ffffff', borderRadius: '14px', border: '1px solid var(--color-border)' }}>
            <AlertTriangle size={32} style={{ color: '#b91c1c', marginBottom: '0.75rem' }} />
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-main)' }}>No se pudo conectar con el servidor</h3>
            <p style={{ margin: '0 0 1rem 0', color: 'var(--color-text-muted)' }}>Ocurrió un error al cargar el personal administrativo.</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="staff-btn-action"
                style={{ display: 'inline-flex', padding: '0.6rem 1.25rem', width: 'auto' }}
              >
                <RefreshCw size={15} />
                <span>Reintentar</span>
              </button>
            )}
          </div>
        )}

        {empty && (
          <div className="inst-panel" style={{ textAlign: 'center', padding: '3rem 1.5rem', background: '#ffffff', borderRadius: '14px', border: '1px dashed var(--color-border)' }}>
            <UserRound size={32} style={{ color: 'var(--color-text-subtle)', marginBottom: '0.75rem' }} />
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-text-main)' }}>Sin funcionarios registrados</h3>
            <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>No se encontraron registros activos de personal en la base de datos.</p>
          </div>
        )}

        {/* 3. Grid de Tarjetas de Personal Administrativo */}
        {directoryPeople.length > 0 && (
          <div className="staff-cards-grid">
            {directoryPeople.map((person, i) => (
              <StaffCard
                key={person.id_personal ?? `${person.nombre}-${i}`}
                person={person}
                isDirector={director === person}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
