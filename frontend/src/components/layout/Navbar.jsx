import React, { useState, useEffect } from 'react';
import logoPosgrado from '../../assets/images/logo/logo_posgrado.jpg';
import { programaService } from '../../services/programaService';
import {
  GraduationCap,
  Menu,
  X,
  ChevronDown,
  BookOpen,
  FileText,
  CheckCircle2,
  MapPin,
  Newspaper,
} from 'lucide-react';

export const Navbar = ({ currentTab, setCurrentTab, onOpenProgramDetail }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [programsDropdownOpen, setProgramsDropdownOpen] = useState(false);
  const [dbPrograms, setDbPrograms] = useState([]);

  useEffect(() => {
    let mounted = true;
    programaService.getActivos().then((data) => {
      if (mounted && Array.isArray(data)) {
        setDbPrograms(data);
      }
    }).catch(() => { });
    return () => { mounted = false; };
  }, []);

  const navItems = [
    { id: 'inicio', label: 'Inicio' },
    { id: 'institucion', label: 'Nuestra Institución' },
    {
      id: 'programas',
      label: 'Programas Académicos',
      hasDropdown: true
    },
    { id: 'normativa', label: 'Convocatorias Anteriores' },
    { id: 'noticias', label: 'Noticias y Tesis' },
    { id: 'contacto', label: 'Ubicación & Contacto' }
  ];

  const handleNavClick = (tabId) => {
    setCurrentTab(tabId);
    setMobileMenuOpen(false);
    setProgramsDropdownOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(255, 255, 255, 0.96)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid #e2e8f0',
      boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.06)'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '78px'
      }}>
        {/* Dual Brand / Logo */}
        <div
          onClick={() => handleNavClick('inicio')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          {/* Real institutional logo */}
          <img
            src={logoPosgrado}
            alt="Carrera de Estadística – Unidad de Posgrado UMSA"
            className="navbar-brand-logo"
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2.5px solid var(--color-green-inst)',
              boxShadow: '0 3px 10px rgba(38, 115, 66, 0.25)',
              flexShrink: 0,
              background: '#ffffff'
            }}
          />
        </div>

        {/* Desktop Navigation */}
        <div style={{
          display: 'none',
          alignItems: 'center',
          gap: '0.25rem'
        }} className="desktop-nav-container">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;

            if (item.hasDropdown) {
              return (
                <div
                  key={item.id}
                  style={{ position: 'relative' }}
                  onMouseEnter={() => setProgramsDropdownOpen(true)}
                  onMouseLeave={() => setProgramsDropdownOpen(false)}
                >
                  <button
                    onClick={() => handleNavClick('programas')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.6rem 0.9rem',
                      background: 'transparent',
                      color: isActive ? 'var(--color-accent-orange)' : 'var(--color-text-main)',
                      fontWeight: isActive ? 800 : 600,
                      fontSize: '0.925rem',
                      cursor: 'pointer',
                      borderBottom: isActive ? '3px solid var(--color-accent-orange)' : '3px solid transparent',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <span>{item.label}</span>
                    <ChevronDown size={14} style={{
                      transform: programsDropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                      transition: 'transform 0.2s ease'
                    }} />
                  </button>

                  {programsDropdownOpen && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      width: '320px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-xl)',
                      padding: '0.6rem',
                      zIndex: 200,
                      animation: 'fadeIn 0.2s ease-out'
                    }}>
                      <div
                        onClick={() => handleNavClick('programas')}
                        style={{
                          padding: '0.75rem 0.85rem',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          color: 'var(--color-text-main)',
                          fontSize: '0.875rem',
                          fontWeight: 700,
                          transition: 'background var(--transition-fast)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-accent-orange-subtle)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <BookOpen size={16} color="var(--color-accent-orange)" />
                        <div>
                          <div>Todas las Convocatorias</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-subtle)', fontWeight: 400 }}>
                            Ver catálogo completo
                          </div>
                        </div>
                      </div>

                      {/* Lista de Programas Reales de la Base de Datos */}
                      {dbPrograms.length > 0 && (
                        <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '0.35rem', paddingTop: '0.35rem' }}>
                          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.35rem 0.85rem 0.2rem' }}>
                            Programas Vigentes en BD
                          </div>
                          {dbPrograms.map((p) => {
                            const isMsc = (p.type || p.tipo_programa || '').toLowerCase().includes('maestr');
                            return (
                              <div
                                key={p.id_programa || p.id}
                                onClick={() => {
                                  setProgramsDropdownOpen(false);
                                  setMobileMenuOpen(false);
                                  if (onOpenProgramDetail) {
                                    onOpenProgramDetail(p);
                                  } else {
                                    window.location.hash = `programa/${p.id_programa || p.id}`;
                                  }
                                }}
                                style={{
                                  padding: '0.6rem 0.85rem',
                                  borderRadius: 'var(--radius-sm)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.6rem',
                                  transition: 'background var(--transition-fast)',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              >
                                {isMsc ? <GraduationCap size={16} color="#059669" /> : <FileText size={16} color="#2563EB" />}
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {p.title || p.nombre_programa}
                                  </div>
                                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                    {p.type || (isMsc ? 'Maestría' : 'Diplomado')} · {p.ediciones?.[0]?.nombre_edicion || 'Edición Activa'}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                style={{
                  padding: '0.6rem 0.9rem',
                  background: 'transparent',
                  color: isActive ? 'var(--color-accent-orange)' : 'var(--color-text-main)',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: '0.925rem',
                  cursor: 'pointer',
                  borderBottom: isActive ? '3px solid var(--color-accent-orange)' : '3px solid transparent',
                  transition: 'all var(--transition-fast)'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = 'var(--color-accent-orange)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = 'var(--color-text-main)';
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Mobile Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-nav-toggle"
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation-menu"
            style={{
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              color: 'var(--color-text-main)',
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div id="mobile-navigation-menu" style={{
          background: '#ffffff',
          borderBottom: '2px solid #e2e8f0',
          padding: '1.25rem 1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              style={{
                textAlign: 'left',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: currentTab === item.id ? 'var(--color-accent-orange-subtle)' : 'transparent',
                color: currentTab === item.id ? 'var(--color-accent-orange)' : 'var(--color-text-main)',
                fontWeight: currentTab === item.id ? 800 : 600,
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: '44px'
              }}
            >
              <span>{item.label}</span>
              {currentTab === item.id && <CheckCircle2 size={16} />}
            </button>
          ))}

        </div>
      )}

      <style>{`
        @media (min-width: 1024px) {
          .desktop-nav-container {
            display: flex !important;
          }
          .mobile-nav-toggle {
            display: none !important;
          }
        }
        @media (max-width: 1023px) {
          .desktop-nav-container {
            display: none !important;
          }
          .mobile-nav-toggle {
            display: flex !important;
          }
        }
        @media (max-width: 640px) {
          .nav-admin-btn-desktop {
            display: none !important;
          }
          .hide-on-mobile {
            display: none !important;
          }
        }
        @media (max-width: 380px) {
          .navbar-brand-logo {
            width: 40px !important;
            height: 40px !important;
          }
        }
      `}</style>
    </nav>
  );
};
