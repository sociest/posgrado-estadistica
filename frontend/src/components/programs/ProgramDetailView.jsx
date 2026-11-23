import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  BookOpen,
  GraduationCap,
  Award,
  Clock,
  FileText,
  Calendar,
  Download,
  MessageCircle,
  Users,
  Compass,
  ExternalLink,
  CalendarDays,
  Info,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { programaService } from '../../services/programaService';
import { useInstitutionWhatsApp } from '../../hooks/useInstitutionWhatsApp';
import './ProgramFaculty.css';

const programFacultyPalettes = [
  { accent: '#16764b', soft: '#e4f4e9' },
  { accent: '#2f68b2', soft: '#e7effb' },
  { accent: '#7652a6', soft: '#f0eafb' },
  { accent: '#b56a19', soft: '#fbf0df' },
  { accent: '#16828a', soft: '#e1f3f2' },
];

const initialsFromName = (name = '') => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || '').join('').toUpperCase();

// Helper para enlaces de Google Drive o descargas directas
const getDirectDownloadLink = (url) => {
  if (!url) return null;
  const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
  }
  return url;
};

// Formateador de fecha legible
const formatDate = (dateStr) => {
  if (!dateStr) return null;
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return `${day} ${months[monthIndex]} ${year}`;
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  } catch (e) {
    return dateStr;
  }
  return dateStr;
};

export const ProgramDetailView = ({ programId, program: initialProgram, onBack, onNavigateToAdmission }) => {
  const [rawProgram, setRawProgram] = useState(initialProgram || null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [activeTab, setActiveTab] = useState('perfil');
  const [activeSemesterTab, setActiveSemesterTab] = useState(0);
  const [selectedMallaId, setSelectedMallaId] = useState(null);

  // Cargar datos en vivo exclusivamente desde la base de datos (REST API Laravel)
  useEffect(() => {
    const targetId = programId || initialProgram?.id_programa || initialProgram?.id || initialProgram?.code;
    if (!targetId) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchProgram = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        const resp = await programaService.getById(targetId);
        const raw = resp?.data ?? resp;

        if (isMounted && raw && (raw.id_programa || raw.id)) {
          setRawProgram(raw);
        }
      } catch (err) {
        console.warn('Error cargando programa desde BD:', err);
        setErrorMsg('No se pudo conectar con la base de datos para cargar este programa.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProgram();

    return () => {
      isMounted = false;
    };
  }, [programId, initialProgram?.id, initialProgram?.id_programa]);

  // Ediciones registradas en la base de datos
  const ediciones = useMemo(() => (Array.isArray(rawProgram?.ediciones) ? rawProgram.ediciones : []), [rawProgram]);
  const edicionActiva = useMemo(() => {
    return ediciones.find((e) => ['Abierta', 'En Curso', 'En Proceso'].includes(e.estado))
      ?? ediciones[0]
      ?? null;
  }, [ediciones]);

  // Mallas curriculares registradas en la base de datos
  const mallas = useMemo(() => (Array.isArray(rawProgram?.mallas) ? rawProgram.mallas : []), [rawProgram]);

  // Resolución reactiva de la malla activa
  const mallaActiva = useMemo(() => {
    if (selectedMallaId) {
      const found = mallas.find((m) => m.id_malla === selectedMallaId);
      if (found) return found;
    }
    const targetMallaId = edicionActiva?.id_malla || edicionActiva?.malla?.id_malla;
    if (targetMallaId) {
      const found = mallas.find((m) => m.id_malla === targetMallaId);
      if (found) return found;
    }
    const activa = mallas.find((m) => m.activo);
    if (activa) return activa;
    return edicionActiva?.malla ?? mallas[0] ?? null;
  }, [selectedMallaId, edicionActiva, mallas]);

  const esMaestria = useMemo(() => {
    return String(rawProgram?.tipo_programa || rawProgram?.type || '').toLowerCase().includes('maestr');
  }, [rawProgram]);

  // Currículum modular estructurado directamente desde la base de datos
  const curriculum = useMemo(() => {
    if (!mallaActiva) return [];
    const modulos = Array.isArray(mallaActiva.modulos) ? mallaActiva.modulos : [];
    const materiasDiplomado = Array.isArray(mallaActiva.materias_diplomado)
      ? mallaActiva.materias_diplomado
      : Array.isArray(mallaActiva.materiasDiplomado)
        ? mallaActiva.materiasDiplomado
        : [];

    if (modulos.length > 0) {
      return modulos.map((mod, idx) => ({
        id: mod.id_mod || idx,
        semester: mod.nombre_mod || `Módulo ${idx + 1}`,
        modules: (mod.materias || []).map((m, mIdx) => {
          const matObj = m.materia || m;
          const pivot = m.pivot || {};
          const creditos = pivot.creditos ?? m.creditos ?? matObj.creditos ?? null;
          const horas = pivot.carga_horaria ?? m.carga_horaria ?? matObj.carga_horaria ?? null;
          return {
            id: matObj.id_mat || m.id_mat || mIdx,
            code: `MAT-${matObj.id_mat || (idx + 1) * 10 + mIdx}`,
            name: matObj.nombre_mat || matObj.nombre || `Materia #${matObj.id_mat || mIdx + 1}`,
            credits: creditos,
            hours: horas,
            desc: matObj.descripcion || null,
          };
        }),
      }));
    }

    if (materiasDiplomado.length > 0) {
      return [{
        id: mallaActiva.id_malla || 1,
        semester: mallaActiva.nombre_malla || 'Módulos del Diplomado',
        modules: materiasDiplomado.map((m, mIdx) => {
          const matObj = m.materia || m;
          const pivot = m.pivot || {};
          const creditos = pivot.creditos ?? m.creditos ?? matObj.creditos ?? null;
          const horas = pivot.carga_horaria ?? m.carga_horaria ?? matObj.carga_horaria ?? null;
          return {
            id: matObj.id_mat || m.id_mat || mIdx,
            code: `DIP-${matObj.id_mat || mIdx + 1}`,
            name: matObj.nombre_mat || matObj.nombre || `Módulo #${matObj.id_mat || mIdx + 1}`,
            credits: creditos,
            hours: horas,
            desc: matObj.descripcion || null,
          };
        }),
      }];
    }

    return [];
  }, [mallaActiva]);

  // Planta docente exclusivamente de la base de datos
  const docentes = useMemo(() => {
    const docentesMap = new Map();
    // 1. Docentes asignados a la edición activa
    if (edicionActiva && Array.isArray(edicionActiva.docentes)) {
      edicionActiva.docentes.forEach((doc) => {
        const idDoc = doc.id_doc ?? doc.id;
        if (idDoc) {
          const nombreCompleto = doc.nombre_completo || `${doc.nombre_doc || ''} ${doc.apellido_doc || ''}`.trim();
          docentesMap.set(idDoc, {
            id: idDoc,
            name: nombreCompleto,
            degree: doc.titulo_academico || null,
            bio: doc.descripcion_profesional || null,
            avatar: doc.foto_url || doc.foto || null,
            bibliographyUrl: doc.bibliografia_url || null,
          });
        }
      });
    }

    // 2. Docentes de todas las ediciones del programa
    ediciones.forEach((ed) => {
      if (Array.isArray(ed.docentes)) {
        ed.docentes.forEach((doc) => {
          const idDoc = doc.id_doc ?? doc.id;
          if (idDoc && !docentesMap.has(idDoc)) {
            const nombreCompleto = doc.nombre_completo || `${doc.nombre_doc || ''} ${doc.apellido_doc || ''}`.trim();
            docentesMap.set(idDoc, {
              id: idDoc,
              name: nombreCompleto,
              degree: doc.titulo_academico || null,
              bio: doc.descripcion_profesional || null,
              avatar: doc.foto_url || doc.foto || null,
              bibliographyUrl: doc.bibliografia_url || null,
            });
          }
        });
      }
    });

    return Array.from(docentesMap.values());
  }, [edicionActiva, ediciones, mallaActiva]);

  // Objeto normalizado del programa
  const prog = useMemo(() => {
    if (!rawProgram) return null;
    return {
      id: rawProgram.id_programa ?? rawProgram.id,
      id_programa: rawProgram.id_programa ?? rawProgram.id,
      title: rawProgram.nombre_programa || rawProgram.title,
      type: rawProgram.tipo_programa || rawProgram.type || (esMaestria ? 'Maestría' : 'Diplomado'),
      area: rawProgram.area_conocimiento || rawProgram.area || null,
      mencion: rawProgram.mencion || null,
      description: rawProgram.descripcion || rawProgram.description || null,
      perfil_aspirante: rawProgram.perfil_aspirante || null,
      perfil_egreso: rawProgram.perfil_egreso || null,
      enlace_pdf_programa: rawProgram.enlace_pdf_programa || null,
      activo: rawProgram.activo ?? true,
      ediciones,
      edicionActiva,
      mallas,
      mallaActiva,
      curriculum,
      docentes,
      duration: edicionActiva?.duracion || null,
      horario: edicionActiva?.horario || null,
      modality: edicionActiva?.modalidad_titulacion || null,
      credits: edicionActiva?.creditos || null,
      modalidad_titulacion: edicionActiva?.modalidad_titulacion || null,
      requisitos_admision: edicionActiva?.requisitos || null,
      convocatoria: edicionActiva?.convocatoria || rawProgram.enlace_pdf_programa || null,
      formulario: edicionActiva?.formulario || null,
      banner: edicionActiva?.banner || rawProgram.banner || null,
      folleto: edicionActiva?.folleto || rawProgram.folleto || null,
    };
  }, [rawProgram, esMaestria, ediciones, edicionActiva, mallas, mallaActiva, curriculum, docentes]);

  const whatsappMessage = `Hola, solicito información sobre el programa: ${
  prog?.title || prog?.nombre_programa || 'Posgrado'
} - Unidad de Posgrado Carrera de Estadística UMSA.`;

const whatsappUrl = useInstitutionWhatsApp(whatsappMessage);
  const handleBackNavigation = () => {
    if (onBack) {
      onBack();
    } else {
      window.location.hash = 'programas';
    }
  };

  if (loading && !prog) {
    return (
      <div style={{ minHeight: '75vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
        <div style={{ textAlign: 'center', padding: '3rem', maxWidth: '420px' }}>
          <div className="spinner" style={{ margin: '0 auto 1.5rem', width: '42px', height: '42px', border: '3px solid #E2E8F0', borderTopColor: '#059669', borderRadius: '50%' }} />
          <h3 style={{ color: '#0F172A', fontWeight: 800, margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>
            Consultando Base de Datos...
          </h3>
          <p style={{ color: '#64748B', fontSize: '0.9rem', margin: 0 }}>
            Obteniendo la información real administrada para este programa académico.
          </p>
        </div>
      </div>
    );
  }

  if (!prog) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '6rem 1rem', minHeight: '65vh' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
          <AlertCircle size={32} />
        </div>
        <h2 style={{ color: '#0F172A', marginBottom: '0.75rem', fontWeight: 800, fontSize: '1.65rem' }}>
          Programa no encontrado
        </h2>
        <p style={{ color: '#64748B', marginBottom: '2rem', maxWidth: '480px', margin: '0 auto 2rem' }}>
          El programa académico solicitado no existe o no tiene registros activos en la base de datos de administración.
        </p>
        <button onClick={handleBackNavigation} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowLeft size={16} />
          <span>Volver al Catálogo de Programas</span>
        </button>
      </div>
    );
  }

  const isMaster = String(prog.type || prog.tipo_programa || '').toLowerCase().includes('maestr');
  const progCurriculum = prog.curriculum || [];
  const docentesList = prog.docentes || [];

  const heroBannerUrl = prog.banner || prog.edicionActiva?.banner || null;
  const programPostUrl = prog.folleto || prog.edicionActiva?.folleto || null;

  const rawConvocatoriaUrl = prog.convocatoria || prog.edicionActiva?.convocatoria || prog.enlace_pdf_programa || null;
  const directDownloadConvocatoria = getDirectDownloadLink(rawConvocatoriaUrl);

  const directDownloadGuia = getDirectDownloadLink(prog.enlace_pdf_programa);

  const totalMateriasCount = progCurriculum.reduce((acc, sem) => acc + (sem.modules?.length || 0), 0);
  const totalEdicionesCount = prog.ediciones?.length || 0;

  // 5 Pestañas conectadas con los módulos de administración
  const tabConfigs = [
    {
      id: 'perfil',
      label: 'Perfil Académico',
      icon: Compass,
      color: '#2563EB',
      gradient: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
      lightBg: '#EFF6FF',
    },
    {
      id: 'materias',
      label: 'Materias y Malla',
      icon: BookOpen,
      color: '#059669',
      gradient: 'linear-gradient(135deg, #065F46 0%, #10B981 100%)',
      lightBg: '#ECFDF5',
      tag: totalMateriasCount > 0 ? `${totalMateriasCount} materias` : null,
    },
    {
      id: 'docentes',
      label: 'Planta Docente',
      icon: Users,
      color: '#7C3AED',
      gradient: 'linear-gradient(135deg, #5B21B6 0%, #8B5CF6 100%)',
      lightBg: '#F5F3FF',
      tag: docentesList.length > 0 ? `${docentesList.length} docentes` : null,
    },
    {
      id: 'requisitos',
      label: 'Requisitos & Admisión',
      icon: FileText,
      color: '#D97706',
      gradient: 'linear-gradient(135deg, #92400E 0%, #F59E0B 100%)',
      lightBg: '#FFFBEB',
    },
    {
      id: 'fechas',
      label: 'Fechas y Horarios',
      icon: CalendarDays,
      color: '#DC2626',
      gradient: 'linear-gradient(135deg, #991B1B 0%, #EF4444 100%)',
      lightBg: '#FEF2F2',
      tag: totalEdicionesCount > 0 ? `${totalEdicionesCount} ${totalEdicionesCount === 1 ? 'edición' : 'ediciones'}` : null,
    },
  ];

  return (
    <div className="program-detail-root animate-fade-in" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', color: '#1E293B', paddingBottom: '4rem' }}>
      
      {/* ── 1. Top Navigation Bar ── */}
      <nav style={{
        background: '#0B192C',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '0.75rem 0',
        position: 'sticky',
        top: '78px',
        zIndex: 40,
        boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.85rem' }}>
            <button
              onClick={handleBackNavigation}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#4ADE80',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(74,222,128,0.15)';
                e.currentTarget.style.borderColor = '#4ADE80';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
              }}
            >
              <ArrowLeft size={15} />
              <span>Volver al Catálogo</span>
            </button>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>/</span>
            <span style={{ color: '#94A3B8', fontWeight: 600 }}>{prog.type}</span>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>/</span>
            <span style={{ color: '#F1F5F9', fontWeight: 700, maxWidth: '360px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {prog.title}
            </span>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '20px', padding: '0.2rem 0.65rem', fontSize: '0.74rem', color: '#4ADE80', fontWeight: 700 }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#4ADE80', boxShadow: '0 0 8px #4ADE80' }} />
            <span>Datos en tiempo real (Base de Datos)</span>
          </div>
        </div>
      </nav>

      {/* ── 2. HERO: Cabecera con banner dinámico o fondo institucional ── */}
      <section style={{
        position: 'relative',
        width: '100%',
        backgroundColor: '#07101E',
        overflow: 'hidden',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}>
        {heroBannerUrl ? (
          <div style={{ position: 'relative', maxHeight: '380px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src={heroBannerUrl}
              alt={prog.title}
              style={{
                width: '100%',
                height: 'auto',
                minHeight: '240px',
                maxHeight: '380px',
                objectFit: 'cover',
                objectPosition: 'center',
                display: 'block',
              }}
            />
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(7,16,30,0.95) 0%, rgba(7,16,30,0.5) 60%, rgba(7,16,30,0.2) 100%)',
              pointerEvents: 'none',
            }} />
          </div>
        ) : (
          <div style={{
            height: '140px',
            background: 'linear-gradient(135deg, #0B192C 0%, #1E3A8A 50%, #065F46 100%)',
          }} />
        )}

        {/* Barra de Título y Botones */}
        <div className="container" style={{
          position: 'relative',
          marginTop: heroBannerUrl ? '-4.5rem' : '-2.5rem',
          paddingBottom: '1.75rem',
          zIndex: 10,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.25rem',
          }}>
            <div style={{ maxWidth: '720px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: isMaster ? 'rgba(5,150,105,0.92)' : 'rgba(30,58,138,0.92)', color: '#FFFFFF', padding: '0.3rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.6rem' }}>
                <GraduationCap size={14} />
                <span>{prog.type}</span>
              </div>

              <h1 style={{
                color: '#FFFFFF',
                fontSize: 'clamp(1.75rem, 3.8vw, 2.7rem)',
                fontWeight: 900,
                lineHeight: 1.18,
                margin: '0 0 0.5rem 0',
                textShadow: '0 2px 14px rgba(0,0,0,0.6)',
              }}>
                {prog.title}
              </h1>

              <p style={{
                color: '#CBD5E1',
                fontSize: '0.98rem',
                margin: 0,
                lineHeight: 1.5,
                textShadow: '0 1px 8px rgba(0,0,0,0.5)',
              }}>
                {prog.mencion ? `Mención: ${prog.mencion} · ` : ''}
                {prog.area ? `Área: ${prog.area} · ` : ''}
                Unidad de Posgrado de la Carrera de Estadística — UMSA
              </p>
            </div>

            {/* Botones de Acción */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              {directDownloadConvocatoria && (
                <a
                  href={directDownloadConvocatoria}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  style={{
                    background: 'rgba(255,255,255,0.95)',
                    color: '#0F172A',
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    padding: '0.75rem 1.35rem',
                    borderRadius: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    textDecoration: 'none',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#FFFFFF';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.95)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <Download size={16} color="#059669" />
                  <span>Convocatoria (PDF)</span>
                </a>
              )}

              <a
                href={whatsappUrl || undefined}
                aria-disabled={!whatsappUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: 'linear-gradient(135deg, #176b45 0%, #135938 100%)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  textDecoration: 'none',
                  boxShadow: '0 4px 16px rgba(37,211,102,0.3)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <MessageCircle size={17} />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Quick Info Strip: Solo valores existentes en base de datos ── */}
      <section style={{ background: '#0F172A', borderBottom: '1px solid #1E293B', padding: 0 }}>
        <div className="container" style={{ padding: 0 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          }} className="program-quick-metrics">
            <div style={{ padding: '1.15rem 1.4rem', borderRight: '1px solid rgba(255,255,255,0.08)', background: 'rgba(52, 211, 153, 0.05)' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#34D399', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>
                Versión Actual
              </div>
              <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#FFFFFF' }}>
                {prog.edicionActiva?.nombre_edicion || 'Sin versión registrada'}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '0.25rem' }}>
                {prog.edicionActiva?.estado ? `Estado: ${prog.edicionActiva.estado}` : 'No registrada'}
              </div>
            </div>

            <div style={{ padding: '1.15rem 1.4rem', borderRight: '1px solid rgba(255,255,255,0.08)', background: 'rgba(96, 165, 250, 0.05)' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#60A5FA', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>
                Duración
              </div>
              <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#FFFFFF' }}>
                {prog.duration || 'No especificada'}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '0.25rem' }}>
                {prog.edicionActiva?.fecha_inicio && prog.edicionActiva?.fecha_fin
                  ? `${formatDate(prog.edicionActiva.fecha_inicio)} – ${formatDate(prog.edicionActiva.fecha_fin)}`
                  : 'Periodo no registrado'}
              </div>
            </div>

            <div style={{ padding: '1.15rem 1.4rem', borderRight: '1px solid rgba(255,255,255,0.08)', background: 'rgba(192, 132, 252, 0.05)' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#C084FC', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>
                Horario de Clases
              </div>
              <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#FFFFFF' }}>
                {prog.horario || 'No especificado'}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '0.25rem' }}>
                {prog.modality || 'Modalidad de impartición'}
              </div>
            </div>

            <div style={{ padding: '1.15rem 1.4rem', background: 'rgba(251, 146, 60, 0.05)' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#FB923C', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.25rem' }}>
                Modalidad de Titulación
              </div>
              <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#FFFFFF' }}>
                {prog.modalidad_titulacion || 'No especificada'}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: '0.25rem' }}>
                {isMaster ? 'Posgrado Maestría' : 'Posgrado Diplomado'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Navegación de Pestañas ── */}
      <div className="container" style={{ paddingTop: '1.75rem' }}>
        
        {/* BARRA DE PESTAÑAS (Desktop) */}
        <div className="program-modern-tabs-bar" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '0.65rem',
          padding: '0.45rem',
          background: '#FFFFFF',
          borderRadius: '12px',
          border: '1.5px solid #E2E8F0',
          boxShadow: '0 4px 18px rgba(0,0,0,0.04)',
          marginBottom: '2rem',
        }}>
          {tabConfigs.map((tab) => {
            const isSelected = activeTab === tab.id;
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.55rem',
                  padding: '0.85rem 0.75rem',
                  borderRadius: '9px',
                  border: isSelected ? `1.5px solid ${tab.color}` : '1.5px solid transparent',
                  background: isSelected ? tab.gradient : 'transparent',
                  color: isSelected ? '#FFFFFF' : '#334155',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: isSelected ? `0 4px 14px ${tab.color}35` : 'none',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = tab.lightBg;
                    e.currentTarget.style.color = tab.color;
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#334155';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isSelected ? 'rgba(255,255,255,0.22)' : tab.lightBg,
                  color: isSelected ? '#FFFFFF' : tab.color,
                  flexShrink: 0,
                }}>
                  <IconComponent size={15} />
                </div>
                <span>{tab.label}</span>
                {tab.tag && (
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '0.12rem 0.45rem',
                    borderRadius: '10px',
                    background: isSelected ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
                    color: isSelected ? '#FFFFFF' : '#64748B',
                    marginLeft: '0.2rem',
                  }}>
                    {tab.tag}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Barra Móvil */}
        <div className="program-mobile-tabs-bar" style={{ display: 'none', marginBottom: '1.5rem' }}>
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            style={{
              width: '100%',
              padding: '0.85rem 1rem',
              borderRadius: '8px',
              border: '2px solid #059669',
              background: '#FFFFFF',
              color: '#0F172A',
              fontWeight: 800,
              fontSize: '0.95rem',
            }}
          >
            {tabConfigs.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* ── LAYOUT PRINCIPAL: 2 Columnas ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 300px',
          gap: '1.75rem',
          alignItems: 'start',
        }} className="program-content-grid">

          {/* ── COLUMNA IZQUIERDA ── */}
          <main style={{ minWidth: 0 }}>

            {/* ════ TAB 1: PERFIL ACADÉMICO (Solo campos editables de la BD) ════ */}
            {activeTab === 'perfil' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* 1.1 Descripción General del Programa */}
                <article style={{
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1.5px solid #E2E8F0',
                  padding: '1.75rem',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', paddingBottom: '0.85rem', borderBottom: '1px solid #E2E8F0' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Info size={20} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
                        Descripción General del Programa
                      </h3>
                      <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>
                        Contenido institucional administrado para el programa
                      </p>
                    </div>
                  </div>

                  <div style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    padding: '1.35rem 1.5rem',
                    fontSize: '0.96rem',
                    color: '#334155',
                    lineHeight: 1.75,
                    whiteSpace: 'pre-line',
                  }}>
                    {prog.description || (
                      <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>
                        No se ha registrado una descripción general en el panel de administración.
                      </span>
                    )}
                  </div>

                  {/* Clasificación académica */}
                  {(prog.mencion || prog.area) && (
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                      {prog.mencion && (
                        <div style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0.45rem 0.85rem', fontSize: '0.84rem', color: '#0F172A', fontWeight: 700 }}>
                          Mención Oficial: <span style={{ color: '#2563EB' }}>{prog.mencion}</span>
                        </div>
                      )}
                      {prog.area && (
                        <div style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '0.45rem 0.85rem', fontSize: '0.84rem', color: '#0F172A', fontWeight: 700 }}>
                          Área de Conocimiento: <span style={{ color: '#059669' }}>{prog.area}</span>
                        </div>
                      )}
                    </div>
                  )}
                </article>

                {/* 1.2 Perfil del Aspirante (Solo lo registrado en BD) */}
                <article style={{
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1.5px solid #E2E8F0',
                  padding: '1.75rem',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', paddingBottom: '0.85rem', borderBottom: '1px solid #E2E8F0' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Compass size={20} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
                        Perfil del Aspirante
                      </h3>
                      <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>
                        Requisitos de formación previa y perfil de ingreso definido por administración
                      </p>
                    </div>
                  </div>

                  <div style={{
                    background: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    borderRadius: '8px',
                    padding: '1.35rem 1.5rem',
                    fontSize: '0.96rem',
                    color: '#166534',
                    lineHeight: 1.75,
                    whiteSpace: 'pre-line',
                  }}>
                    {prog.perfil_aspirante || (
                      <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>
                        Perfil del aspirante no registrado en el panel de administración.
                      </span>
                    )}
                  </div>
                </article>

                {/* 1.3 Perfil del Egresado (Solo lo registrado en BD) */}
                <article style={{
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1.5px solid #E2E8F0',
                  padding: '1.75rem',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', paddingBottom: '0.85rem', borderBottom: '1px solid #E2E8F0' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <GraduationCap size={20} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
                        Perfil del Egresado
                      </h3>
                      <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>
                        Competencias y capacidades registradas para el egresado
                      </p>
                    </div>
                  </div>

                  <div style={{
                    background: '#FAF5FF',
                    border: '1px solid #E9D5FF',
                    borderRadius: '8px',
                    padding: '1.35rem 1.5rem',
                    fontSize: '0.96rem',
                    color: '#581C87',
                    lineHeight: 1.75,
                    whiteSpace: 'pre-line',
                  }}>
                    {prog.perfil_egreso || (
                      <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>
                        Perfil del egresado no registrado en el panel de administración.
                      </span>
                    )}
                  </div>
                </article>

                {/* 1.4 Modalidad de Titulación y Resolución PDF */}
                {(prog.modalidad_titulacion || prog.enlace_pdf_programa) && (
                  <article style={{
                    background: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1.5px solid #E2E8F0',
                    padding: '1.5rem',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}>
                    <div>
                      <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                        Modalidad de Titulación
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.88rem', color: '#475569' }}>
                        {prog.modalidad_titulacion || 'Modalidad de titulación según reglamento de posgrado.'}
                      </p>
                    </div>

                    {directDownloadGuia && (
                      <a
                        href={directDownloadGuia}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          background: '#F1F5F9',
                          border: '1.5px solid #CBD5E1',
                          color: '#0F172A',
                          borderRadius: '6px',
                          padding: '0.65rem 1.15rem',
                          fontSize: '0.85rem',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          textDecoration: 'none',
                        }}
                      >
                        <ExternalLink size={15} color="#2563EB" />
                        <span>Ver Documento / Resolución PDF</span>
                      </a>
                    )}
                  </article>
                )}

              </div>
            )}

            {/* ════ TAB 2: MATERIAS Y MALLA CURRICULAR (Solo de la BD) ════ */}
            {activeTab === 'materias' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                <div style={{
                  background: 'linear-gradient(135deg, #065F46 0%, #10B981 100%)',
                  borderRadius: '12px',
                  padding: '1.6rem 1.8rem',
                  color: '#FFFFFF',
                  boxShadow: '0 6px 20px rgba(6,95,70,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}>
                  <div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 900, margin: '0 0 0.35rem 0', color: '#FFFFFF' }}>
                      Plan de Estudios & Estructura Curricular
                    </h2>
                    <p style={{ fontSize: '0.88rem', margin: 0, color: '#D1FAE5' }}>
                      Materias registradas en el módulo de Mallas Curriculares de la base de datos
                    </p>
                  </div>

                </div>

                {progCurriculum.length === 0 ? (
                  <div style={{
                    background: '#FFFFFF',
                    border: '1.5px dashed #CBD5E1',
                    borderRadius: '12px',
                    padding: '3rem 2rem',
                    textAlign: 'center',
                    color: '#64748B',
                  }}>
                    <BookOpen size={44} style={{ color: '#059669', marginBottom: '0.85rem' }} />
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#0F172A', fontWeight: 800 }}>
                      Sin Malla Curricular Registrada
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.92rem', color: '#64748B' }}>
                      No se han registrado materias ni módulos para este programa en el módulo de mallas curriculares del panel de administración.
                    </p>
                  </div>
                ) : (
                  <div>
                    {/* Selector de Semestres / Módulos */}
                    {progCurriculum.length > 1 && (
                      <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        overflowX: 'auto',
                        paddingBottom: '0.65rem',
                        marginBottom: '1.25rem',
                      }}>
                        {progCurriculum.map((sem, sIdx) => {
                          const isSemActive = activeSemesterTab === sIdx;
                          return (
                            <button
                              key={sIdx}
                              type="button"
                              onClick={() => setActiveSemesterTab(sIdx)}
                              style={{
                                background: isSemActive ? '#059669' : '#FFFFFF',
                                color: isSemActive ? '#FFFFFF' : '#334155',
                                border: isSemActive ? '1.5px solid #059669' : '1.5px solid #E2E8F0',
                                borderRadius: '8px',
                                padding: '0.65rem 1.15rem',
                                fontWeight: 800,
                                fontSize: '0.88rem',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                boxShadow: isSemActive ? '0 4px 12px rgba(5,150,105,0.25)' : 'none',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <span>{sem.semester}</span>
                              <span style={{
                                fontSize: '0.74rem',
                                padding: '0.1rem 0.45rem',
                                borderRadius: '10px',
                                background: isSemActive ? 'rgba(255,255,255,0.25)' : '#F1F5F9',
                                color: isSemActive ? '#FFFFFF' : '#64748B',
                              }}>
                                {sem.modules?.length || 0}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Lista de Materias */}
                    {progCurriculum[activeSemesterTab] && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        {progCurriculum[activeSemesterTab].modules.map((materia, mIdx) => (
                          <article
                            key={mIdx}
                            style={{
                              background: '#FFFFFF',
                              border: '1.5px solid #E2E8F0',
                              borderRadius: '10px',
                              padding: '1.25rem 1.5rem',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                                <span style={{
                                  fontFamily: 'monospace',
                                  fontSize: '0.78rem',
                                  fontWeight: 800,
                                  color: '#059669',
                                  background: '#ECFDF5',
                                  border: '1px solid #A7F3D0',
                                  padding: '0.2rem 0.55rem',
                                  borderRadius: '4px',
                                }}>
                                  {materia.code}
                                </span>
                                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                                  {materia.name}
                                </h4>
                              </div>

                              <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                {materia.credits != null && (
                                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#1E293B', background: '#F1F5F9', padding: '0.2rem 0.55rem', borderRadius: '4px' }}>
                                    {materia.credits} Créditos
                                  </span>
                                )}
                                {materia.hours != null && (
                                  <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#059669', background: '#ECFDF5', padding: '0.2rem 0.55rem', borderRadius: '4px' }}>
                                    {materia.hours} horas
                                  </span>
                                )}
                              </div>
                            </div>

                            {materia.desc && (
                              <p style={{ margin: '0.45rem 0', fontSize: '0.88rem', color: '#475569', lineHeight: 1.55 }}>
                                {materia.desc}
                              </p>
                            )}
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}

            {/* ════ TAB 3: DOCENTES DEL PROGRAMA ════ */}
            {activeTab === 'docentes' && (
              <section className="program-faculty animate-fade-in" aria-labelledby="program-faculty-title">
                <header className="program-faculty__header">
                  <div>
                    <span className="program-faculty__eyebrow">Equipo académico</span>
                    <h2 id="program-faculty-title">Docentes del programa</h2>
                    <p>Conoce a las personas que acompañan la formación académica.</p>
                  </div>
                  <span className="program-faculty__count">
                    <Users size={16} aria-hidden="true" />
                    {docentesList.length} {docentesList.length === 1 ? 'docente' : 'docentes'}
                  </span>
                </header>

                {docentesList.length === 0 ? (
                  <div className="program-faculty__empty">
                    <span className="program-faculty__empty-icon"><Users size={25} aria-hidden="true" /></span>
                    <h3>Aún no hay docentes para mostrar</h3>
                    <p>La información del equipo académico aparecerá aquí cuando esté disponible.</p>
                  </div>
                ) : (
                  <div className="program-faculty__grid">
                    {docentesList.map((doc, idx) => {
                      const docId = doc.id ?? idx;
                      const palette = programFacultyPalettes[idx % programFacultyPalettes.length];
                      return (
                        <article
                          key={docId}
                          className="program-faculty-card"
                          style={{ '--faculty-accent': palette.accent, '--faculty-soft': palette.soft }}
                        >
                          <div className="program-faculty-card__portrait">
                            {doc.avatar ? (
                              <img src={doc.avatar} alt={`Fotografía de ${doc.name}`} loading="lazy" />
                            ) : (
                              <span aria-hidden="true">{initialsFromName(doc.name) || 'D'}</span>
                            )}
                          </div>
                          <h3 className="program-faculty-card__name">{doc.name}</h3>
                          {doc.degree && <span className="program-faculty-card__degree">{doc.degree}</span>}
                          {doc.bio && <p className="program-faculty-card__bio">{doc.bio}</p>}

                          {doc.bibliographyUrl && (
                            <a className="program-faculty-card__link" href={doc.bibliographyUrl} target="_blank" rel="noreferrer">
                              <span>Publicaciones</span>
                              <ExternalLink size={14} aria-hidden="true" />
                            </a>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}

              </section>
            )}

            {/* ════ TAB 4: REQUISITOS Y ADMISIÓN (Solo de la BD, sin estáticos) ════ */}
            {activeTab === 'requisitos' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                <div style={{
                  background: 'linear-gradient(135deg, #92400E 0%, #F59E0B 100%)',
                  borderRadius: '12px',
                  padding: '1.6rem 1.8rem',
                  color: '#FFFFFF',
                  boxShadow: '0 6px 20px rgba(146,64,14,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}>
                  <div style={{ maxWidth: '580px' }}>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 900, margin: '0 0 0.35rem 0', color: '#FFFFFF' }}>
                      Requisitos de Admisión
                    </h2>
                    <p style={{ fontSize: '0.88rem', margin: 0, color: '#FEF3C7', lineHeight: 1.5 }}>
                      Información sobre requisitos del programa registrada por la administración
                    </p>
                  </div>

                  {directDownloadConvocatoria && (
                    <a
                      href={directDownloadConvocatoria}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      style={{
                        background: '#FFFFFF',
                        color: '#92400E',
                        borderRadius: '8px',
                        padding: '0.75rem 1.35rem',
                        fontSize: '0.9rem',
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        textDecoration: 'none',
                      }}
                    >
                      <Download size={16} />
                      <span>Descargar Convocatoria (PDF)</span>
                    </a>
                  )}
                </div>

                {/* Requisitos Específicos de la BD */}
                <article style={{
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1.5px solid #E2E8F0',
                  padding: '1.75rem',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
                    <FileText size={20} color="#D97706" />
                    <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
                      Requisitos Registrados en Administración
                    </h3>
                  </div>

                  {prog.requisitos_admision ? (
                    <div style={{
                      background: '#FFFBEB',
                      border: '1px solid #FDE68A',
                      borderRadius: '8px',
                      padding: '1.25rem 1.4rem',
                      fontSize: '0.94rem',
                      color: '#92400E',
                      lineHeight: 1.75,
                      whiteSpace: 'pre-line',
                    }}>
                      {prog.requisitos_admision}
                    </div>
                  ) : (
                    <div style={{
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      padding: '1.5rem',
                      color: '#64748B',
                      textAlign: 'center',
                    }}>
                      No se han registrado requisitos de admisión para esta edición en el panel de administración.
                    </div>
                  )}

                  {/* Material informativo del programa */}
                  <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #E2E8F0' }}>
                    {directDownloadConvocatoria && (
                      <a
                        href={directDownloadConvocatoria}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                      >
                        <Download size={16} />
                        <span>Descargar Convocatoria Oficial (PDF)</span>
                      </a>
                    )}
                  </div>
                </article>

              </div>
            )}

            {/* ════ TAB 5: FECHAS Y HORARIOS (Solo de la BD, sin estáticos) ════ */}
            {activeTab === 'fechas' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                <div style={{
                  background: 'linear-gradient(135deg, #991B1B 0%, #EF4444 100%)',
                  borderRadius: '12px',
                  padding: '1.6rem 1.8rem',
                  color: '#FFFFFF',
                  boxShadow: '0 6px 20px rgba(153,27,27,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}>
                  <div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 900, margin: '0 0 0.35rem 0', color: '#FFFFFF' }}>
                      Ediciones, Fechas y Horarios
                    </h2>
                    <p style={{ fontSize: '0.88rem', margin: 0, color: '#FEE2E2' }}>
                      Periodos académicos y turnos registrados en el panel de administración
                    </p>
                  </div>

                  <span style={{ fontSize: '0.82rem', color: '#FFFFFF', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', padding: '0.35rem 0.75rem', borderRadius: '6px', fontWeight: 700 }}>
                    {totalEdicionesCount} {totalEdicionesCount === 1 ? 'Edición Registrada' : 'Ediciones Registradas'}
                  </span>
                </div>

                {/* Ediciones Registradas */}
                <article style={{
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1.5px solid #E2E8F0',
                  padding: '1.75rem',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem', paddingBottom: '0.85rem', borderBottom: '1px solid #E2E8F0' }}>
                    <CalendarDays size={22} color="#DC2626" />
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
                        Versiones del Programa en Base de Datos
                      </h3>
                      <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>
                        Fechas y estados administrados en el sistema
                      </p>
                    </div>
                  </div>

                  {prog.ediciones && prog.ediciones.length > 0 ? (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                      {prog.ediciones.map((edicion, eIdx) => {
                        const isCurrent = edicion.id_edicion === prog.edicionActiva?.id_edicion;
                        const estadoColor = edicion.estado === 'En Curso' ? '#059669' :
                                           edicion.estado === 'Abierta' ? '#2563EB' :
                                           edicion.estado === 'En Proceso' ? '#D97706' : '#64748B';
                        const estadoBg = edicion.estado === 'En Curso' ? '#ECFDF5' :
                                         edicion.estado === 'Abierta' ? '#EFF6FF' :
                                         edicion.estado === 'En Proceso' ? '#FFFBEB' : '#F1F5F9';

                        return (
                          <div
                            key={edicion.id_edicion || eIdx}
                            style={{
                              background: isCurrent ? '#F8FAFC' : '#FFFFFF',
                              border: isCurrent ? '2px solid #CBD5E1' : '1px solid #E2E8F0',
                              borderRadius: '10px',
                              padding: '1.35rem',
                              boxShadow: isCurrent ? '0 4px 14px rgba(0,0,0,0.04)' : 'none',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.85rem' }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                                    {edicion.nombre_edicion || `Edición ${eIdx + 1}`}
                                  </h4>
                                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: estadoColor, background: estadoBg, padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                                    {edicion.estado || 'Activa'}
                                  </span>
                                  {isCurrent && (
                                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#2563EB', background: '#EFF6FF', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                                      Edición Actual
                                    </span>
                                  )}
                                </div>

                                <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '0.35rem' }}>
                                  {edicion.fecha_inicio && edicion.fecha_fin ? (
                                    <span>Periodo: <strong>{formatDate(edicion.fecha_inicio)}</strong> al <strong>{formatDate(edicion.fecha_fin)}</strong></span>
                                  ) : (
                                    <span>Periodo de fechas no especificado</span>
                                  )}
                                </div>
                              </div>

                              {edicion.duracion && (
                                <div style={{ background: '#F1F5F9', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
                                  <Clock size={13} style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: '-1px' }} />
                                  {edicion.duracion}
                                </div>
                              )}
                            </div>

                            {/* Horario registrado */}
                            {edicion.horario && (
                              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '0.65rem 0.85rem', fontSize: '0.85rem', color: '#1E293B', marginBottom: '0.75rem' }}>
                                <strong>Horario registrado:</strong> {edicion.horario}
                              </div>
                            )}

                            {/* Descripción de la edición */}
                            {edicion.descripcion && (
                              <p style={{ margin: '0 0 0.85rem 0', fontSize: '0.85rem', color: '#475569', lineHeight: 1.55 }}>
                                {edicion.descripcion}
                              </p>
                            )}

                            {/* Convocatoria informativa de la edición, si está publicada */}
                            {edicion.convocatoria && (
                              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', paddingTop: '0.65rem', borderTop: '1px dashed #E2E8F0' }}>
                                {edicion.convocatoria && (
                                  <a
                                    href={getDirectDownloadLink(edicion.convocatoria)}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#059669', fontWeight: 700, textDecoration: 'none' }}
                                  >
                                    <Download size={13} />
                                    <span>Descargar Convocatoria de esta Edición</span>
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '1.5rem', color: '#64748B', textAlign: 'center' }}>
                      No se han registrado ediciones ni cronogramas para este programa en el panel de administración.
                    </div>
                  )}
                </article>

              </div>
            )}

          </main>

          {/* ── COLUMNA DERECHA: AFICHE Y DATOS DE BD ── */}
          <aside style={{
            position: 'sticky',
            top: '140px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }} className="program-detail-aside">

            {/* Afiche Oficial */}
            <div style={{
              borderRadius: '12px',
              overflow: 'hidden',
              background: '#FFFFFF',
              border: '1.5px solid #E2E8F0',
              boxShadow: '0 6px 20px rgba(0,0,0,0.06)',
            }}>
              {programPostUrl ? (
                /\.pdf(?:$|[?#])/i.test(programPostUrl) ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
                    <FileText size={40} color="#059669" style={{ margin: '0 auto 0.75rem' }} />
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0F172A', marginBottom: '0.5rem' }}>
                      Folleto Oficial (PDF)
                    </div>
                    <a
                      href={programPostUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <Download size={14} />
                      <span>Abrir Folleto Oficial</span>
                    </a>
                  </div>
                ) : (
                  <img
                    src={programPostUrl}
                    alt={prog.title}
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                      objectFit: 'contain',
                    }}
                  />
                )
              ) : (
                <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#94A3B8' }}>
                  <FileText size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.6 }} />
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Afiche no adjuntado en administración</div>
                </div>
              )}
            </div>

            {/* Ficha Resumen de la Base de Datos */}
            <div style={{
              background: '#FFFFFF',
              border: '1.5px solid #E2E8F0',
              borderRadius: '12px',
              padding: '1.25rem',
              boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
            }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                Datos en Base de Datos
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', gap: '0.5rem' }}>
                  <span style={{ color: '#64748B', fontWeight: 600 }}>Tipo</span>
                  <span style={{ fontWeight: 800, color: '#2563EB', textAlign: 'right' }}>{prog.type}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', gap: '0.5rem' }}>
                  <span style={{ color: '#64748B', fontWeight: 600 }}>Versión</span>
                  <span style={{ fontWeight: 800, color: '#059669', textAlign: 'right' }}>
                    {prog.edicionActiva?.nombre_edicion || 'No registrada'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', gap: '0.5rem' }}>
                  <span style={{ color: '#64748B', fontWeight: 600 }}>Duración</span>
                  <span style={{ fontWeight: 800, color: '#D97706', textAlign: 'right' }}>
                    {prog.duration || 'No especificada'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', gap: '0.5rem' }}>
                  <span style={{ color: '#64748B', fontWeight: 600 }}>Estado</span>
                  <span style={{ fontWeight: 800, color: '#059669', textAlign: 'right' }}>
                    {prog.edicionActiva?.estado || (prog.activo ? 'Activo' : 'Inactivo')}
                  </span>
                </div>
              </div>

            </div>

            {/* Tarjeta de Contacto */}
            <div style={{
              background: '#0F172A',
              color: '#FFFFFF',
              borderRadius: '12px',
              padding: '1.25rem',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '0.35rem' }}>
                Consultas del programa
              </div>
              <p style={{ margin: '0 0 0.85rem 0', fontSize: '0.78rem', color: '#94A3B8', lineHeight: 1.45 }}>
                Consulte información del programa directamente con la Carrera de Estadística UMSA.
              </p>
              <a
                href={whatsappUrl || undefined}
                aria-disabled={!whatsappUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  width: '100%',
                  background: '#176b45',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  padding: '0.65rem 0.9rem',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                  textDecoration: 'none',
                  boxSizing: 'border-box',
                }}
              >
                <MessageCircle size={16} />
                <span>Escribir al WhatsApp</span>
              </a>
            </div>

          </aside>

        </div>{/* /program-content-grid */}

      </div>{/* /container */}

      <style>{`
        @media (max-width: 992px) {
          .program-content-grid {
            grid-template-columns: 1fr !important;
          }
          .program-detail-aside {
            position: static !important;
            display: grid !important;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)) !important;
            align-items: start !important;
          }
          .program-modern-tabs-bar {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }

        @media (max-width: 680px) {
          .program-modern-tabs-bar {
            display: none !important;
          }
          .program-mobile-tabs-bar {
            display: block !important;
          }
          .program-quick-metrics {
            grid-template-columns: 1fr 1fr !important;
          }
        }

        @media (max-width: 480px) {
          .program-quick-metrics {
            grid-template-columns: 1fr !important;
          }
          .program-detail-aside {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

    </div>
  );
};
