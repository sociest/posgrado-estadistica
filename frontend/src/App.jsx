import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ApplicantsProvider } from './context/ApplicantsContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { AdminLoginView } from './components/auth/AdminLoginView';

import { HeroSection } from './components/home/HeroSection';
import { PromotionalBannerSection } from './components/home/PromotionalBannerSection';
import { FeaturedPrograms } from './components/home/FeaturedPrograms';
import { KpiSection } from './components/home/KpiSection';
import { ImpactSection } from './components/home/ImpactSection';
import { EventsSection } from './components/home/EventsSection';
import { MasterBannerPopup } from './components/common/MasterBannerPopup';

import { InstitutionView } from './components/institution/InstitutionView';
import { ProgramsView } from './components/programs/ProgramsView';
import { ProgramDetailModal } from './components/programs/ProgramDetailModal';
import { ProgramDetailView } from './components/programs/ProgramDetailView';
import { AdmissionView } from './components/admission/AdmissionView';
import { RegulationsView } from './components/regulations/RegulationsView';
import { NewsView } from './components/news/NewsView';
import { ContactView } from './components/contact/ContactView';

import { AdminPortal } from './components/portals/AdminPortal';

import './styles/index.css';
import './styles/components.css';

const getInitialHashState = () => {
  const hash = typeof window !== 'undefined' ? window.location.hash || '' : '';
  if (hash === '#admin' || hash === '#/admin') return { tab: 'admin-login', programId: null };
  if (hash === '#admin/panel' || hash === '#/admin/panel') return { tab: 'portal-admin', programId: null };
  if (hash.startsWith('#programa/') || hash.startsWith('#/programa/')) {
    const id = hash.replace(/^#\/?programa\//, '');
    return {
      tab: 'programa-detalle',
      programId: id ? decodeURIComponent(id) : null,
    };
  }
  if (hash === '#programas' || hash === '#/programas') {
    return { tab: 'programas', programId: null };
  }
  return { tab: 'inicio', programId: null };
};

const MainApp = () => {
  const initial = getInitialHashState();
  const [currentTab, setCurrentTab] = useState(initial.tab);
  const [selectedProgramModal, setSelectedProgramModal] = useState(null);
  const [selectedProgramDetailId, setSelectedProgramDetailId] = useState(initial.programId);
  const [targetProgramForAdmission, setTargetProgramForAdmission] = useState(null);
  const [programFilterState, setProgramFilterState] = useState(null);
  const { currentUser, logout } = useAuth();

  React.useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash || '';
      if (hash.startsWith('#programa/') || hash.startsWith('#/programa/')) {
        const id = hash.replace(/^#\/?programa\//, '');
        if (id) {
          setSelectedProgramDetailId(decodeURIComponent(id));
          setCurrentTab('programa-detalle');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else if (hash === '#programas' || hash === '#/programas') {
        setCurrentTab('programas');
      } else if (hash === '#admin' || hash === '#/admin') {
        setCurrentTab(currentUser ? 'portal-admin' : 'admin-login');
      } else if (hash === '#admin/panel' || hash === '#/admin/panel') {
        setCurrentTab('portal-admin');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [currentUser]);

  const handleNavigateToAdmission = (programId = null) => {
    if (programId) setTargetProgramForAdmission(programId);
    setCurrentTab('admision');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilterPrograms = (filterObj) => {
    setProgramFilterState(filterObj);
    setCurrentTab('programas');
  };

  const handleLoginSuccess = () => {
    setCurrentTab('portal-admin');
    window.location.hash = 'admin/panel';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  React.useEffect(() => {
    if (currentTab === 'portal-admin' && !currentUser) {
      setCurrentTab('admin-login');
      window.location.hash = 'admin';
    }
  }, [currentTab, currentUser]);

  const handleOpenProgramDetail = (prog) => {
    const progId = prog?.id || prog?.code || prog;
    setSelectedProgramDetailId(progId);
    setCurrentTab('programa-detalle');
    window.location.hash = `programa/${progId}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // MODO ADMIN: pantalla completa sin navbar/footer publicos
  if (currentTab === 'portal-admin' && currentUser) {
    return (
      <AdminPortal
        onExitAdmin={async () => {
          await logout();
          setCurrentTab('inicio');
          window.location.hash = '';
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    );
  }

  if (currentTab === 'admin-login') {
    return <AdminLoginView onLoginSuccess={handleLoginSuccess} onBack={() => { setCurrentTab('inicio'); window.location.hash = ''; }} />;
  }

  return (
    <div className="page-shell">
      <a className="skip-link" href="#main">Saltar al contenido</a>

      <Navbar
        currentTab={currentTab === 'programa-detalle' ? 'programas' : currentTab}
        setCurrentTab={(tab) => {
          if (window.location.hash.startsWith('#programa/')) {
            window.location.hash = tab === 'programas' ? '#programas' : '';
          }
          setCurrentTab(tab);
        }}
        onOpenProgramDetail={handleOpenProgramDetail}
      />

      <main id="main" className="site-main">
        {currentTab === 'inicio' && (
          <div className="animate-fade-in">
            <HeroSection onNavigate={setCurrentTab} onFilterPrograms={handleFilterPrograms} />
            <PromotionalBannerSection onSelectProgram={handleOpenProgramDetail} />
            <FeaturedPrograms onSelectProgram={handleOpenProgramDetail} onNavigateToAdmission={handleNavigateToAdmission} />
            <KpiSection />
            <ImpactSection
              onExplorePrograms={() => { setCurrentTab('programas'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              onAboutInstitution={() => { setCurrentTab('institucion'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            />
          </div>
        )}
        {currentTab === 'institucion' && <InstitutionView />}
        {currentTab === 'programas' && (
          <ProgramsView onNavigateToAdmission={handleNavigateToAdmission} initialFilter={programFilterState} onSelectProgram={handleOpenProgramDetail} />
        )}
        {currentTab === 'programa-detalle' && (
          <ProgramDetailView
            programId={selectedProgramDetailId}
            onBack={() => { window.location.hash = 'programas'; setCurrentTab('programas'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            onNavigateToAdmission={handleNavigateToAdmission}
          />
        )}
        {currentTab === 'admision' && <AdmissionView targetProgramId={targetProgramForAdmission} />}
        {currentTab === 'normativa' && <RegulationsView />}
        {currentTab === 'noticias' && <NewsView />}
        {currentTab === 'contacto' && <ContactView />}
      </main>

      <Footer onNavigate={(tab) => { if (window.location.hash.startsWith('#programa/')) window.location.hash = ''; setCurrentTab(tab); }} />
      {selectedProgramModal && (
        <ProgramDetailModal
          program={selectedProgramModal}
          onClose={() => setSelectedProgramModal(null)}
          onApply={(progId) => { setSelectedProgramModal(null); handleNavigateToAdmission(progId); }}
        />
      )}
      <MasterBannerPopup onNavigateToProgram={handleOpenProgramDetail} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ApplicantsProvider>
        <MainApp />
      </ApplicantsProvider>
    </AuthProvider>
  );
}
