import React, { useState, useEffect } from 'react';
import { PodcastProject, PodcastGenre } from './types';
import { 
  getStoredProjects, 
  saveSingleProject, 
  deleteProject, 
  duplicateProject, 
  exportProjectJSON, 
  saveProjects 
} from './lib/storage';
import { SAMPLE_PROJECTS } from './data/sampleProjects';

import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { CharacterLibraryView } from './components/CharacterLibraryView';
import { ScriptsLibraryView } from './components/ScriptsLibraryView';
import { SettingsView } from './components/SettingsView';
import { EditorWorkspace } from './components/EditorWorkspace';
import { NewProjectModal } from './components/NewProjectModal';
import { ExportModal } from './components/export/ExportModal';
import { VoiceStudioModal } from './components/studio/VoiceStudioModal';
import { CoverArtModal } from './components/studio/CoverArtModal';
import { Character } from './types';

export default function App() {
  const [projects, setProjects] = useState<PodcastProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [currentNavView, setCurrentNavView] = useState<'dashboard' | 'projects' | 'settings' | 'editor'>('dashboard');
  const [activeTab, setActiveTab] = useState<string>('scripting');
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [exportModalProject, setExportModalProject] = useState<PodcastProject | null>(null);
  const [isVoiceStudioOpen, setIsVoiceStudioOpen] = useState(false);
  const [voiceStudioTargetChar, setVoiceStudioTargetChar] = useState<Character | null>(null);
  const [isCoverArtOpen, setIsCoverArtOpen] = useState(false);
  const [coverArtTargetProject, setCoverArtTargetProject] = useState<PodcastProject | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // Load stored projects on mount
  useEffect(() => {
    const loaded = getStoredProjects();
    setProjects(loaded);
  }, []);

  const activeProject = projects.find((p) => p.id === activeProjectId) || null;

  // Auto-save effect
  useEffect(() => {
    if (!hasUnsavedChanges || !activeProject) return;

    const timeout = setTimeout(() => {
      setIsAutoSaving(true);
      saveSingleProject(activeProject);
      setHasUnsavedChanges(false);
      
      // Keep the pulsing dot visible for a minimum duration to be noticeable
      setTimeout(() => setIsAutoSaving(false), 1000);
    }, 30000);

    return () => clearTimeout(timeout);
  }, [activeProject, hasUnsavedChanges]);

  // Save current active project manually
  const handleSaveActiveProject = () => {
    if (!activeProject) return;
    setIsSaving(true);
    const saved = saveSingleProject(activeProject);
    setProjects((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
    setHasUnsavedChanges(false);
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };


  // Open Project in Editor
  const handleOpenProject = (id: string) => {
    setActiveProjectId(id);
    setCurrentNavView('editor');
    setHasUnsavedChanges(false);
    const p = projects.find((proj) => proj.id === id);
    if (p?.mode === 'generative') {
      setActiveTab('generative');
    } else {
      setActiveTab('scripting');
    }
  };

  const handleBackToDashboard = () => {
    if (activeProject) {
      saveSingleProject(activeProject);
    }
    setActiveProjectId(null);
    setCurrentNavView('dashboard');
    setHasUnsavedChanges(false);
  };

  // Create Project in Creator Mode
  const handleCreateCreatorProject = (data: {
    title: string;
    tagline: string;
    description: string;
    genre: PodcastGenre;
    targetDurationMinutes: number;
  }) => {
    const newProject: PodcastProject = {
      id: 'proj-' + Date.now(),
      title: data.title,
      tagline: data.tagline,
      description: data.description,
      genre: data.genre,
      coverUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&auto=format&fit=crop&q=80',
      mode: 'creator',
      targetDurationMinutes: data.targetDurationMinutes,
      bgmTrack: 'tech_ambient',
      soundBoard: ['applause', 'intro_chime', 'dramatic_boom'],
      showNotes: `Show notes for ${data.title}\nEpisode Overview: ${data.description}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      characters: [
        {
          id: 'char-' + Date.now() + '-1',
          name: 'Host Alex',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
          mainRole: 'Main Host',
          personality: 'Articulate, inquisitive, enthusiastic about storytelling.',
          quirks: 'Uses vivid analogies; pauses for dramatic effect.',
          background: 'Experienced audio producer and podcaster.',
          voiceConfig: {
            voiceName: 'Zephyr',
            gender: 'Male',
            pitch: 1.0,
            rate: 1.0,
            tone: 'Warm & Authoritative',
            emotionStyle: 'Enthusiastic',
          },
          relationships: [],
        },
        {
          id: 'char-' + Date.now() + '-2',
          name: 'Co-Host Sarah',
          avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
          mainRole: 'Co-Host / Expert',
          personality: 'Sharp, inquisitive, practical, grounded in facts.',
          quirks: 'Cites research papers and historical context.',
          background: 'Senior analyst and journalist.',
          voiceConfig: {
            voiceName: 'Kore',
            gender: 'Female',
            pitch: 0.95,
            rate: 1.0,
            tone: 'Crisp & Analytical',
            emotionStyle: 'Professional',
          },
          relationships: [],
        },
      ],
      script: [
        {
          id: 'line-' + Date.now() + '-1',
          characterId: 'char-' + Date.now() + '-1',
          characterName: 'Host Alex',
          text: `Welcome to ${data.title}! I'm Alex, and today we're exploring ${data.description}.`,
          emotionNote: '[Enthusiastic welcome]',
          sfxCue: 'intro_chime',
        },
        {
          id: 'line-' + Date.now() + '-2',
          characterId: 'char-' + Date.now() + '-2',
          characterName: 'Co-Host Sarah',
          text: `Thanks Alex! This is a subject with so many fascinating angles to unpack.`,
          emotionNote: '[Warm smile]',
          sfxCue: '',
        },
      ],
    };

    saveSingleProject(newProject);
    setProjects((prev) => [newProject, ...prev]);
    setActiveProjectId(newProject.id);
    setCurrentNavView('editor');
    setActiveTab('scripting');
  };

  // Create Project in Generative Mode
  const handleCreateGenerativeProject = async (data: {
    topic: string;
    genre: PodcastGenre;
    podcastStyle: string;
    targetDurationMinutes: number;
    musicMood: string;
  }) => {
    const res = await fetch('/api/gemini/generative-podcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const resData = await res.json();
    if (!res.ok || resData.error) {
      throw new Error(resData.error || 'Failed to generate podcast episode');
    }
    if (!resData.projectData) throw new Error('Generative response empty');

    const pd = resData.projectData;
    const generatedCharacters = (pd.characters || []).map((c: any, idx: number) => ({
      id: 'gen-char-' + Date.now() + '-' + idx,
      name: c.name || `Host ${idx + 1}`,
      avatarUrl: `https://images.unsplash.com/photo-${1534528741775 + idx * 1000}?w=400&auto=format&fit=crop&q=80`,
      mainRole: c.mainRole || 'Co-Host',
      personality: c.personality || 'Vibrant persona',
      quirks: c.quirks || 'Unique habit',
      background: c.background || 'Backstory details',
      voiceConfig: {
        voiceName: c.voiceConfig?.voiceName || (idx === 0 ? 'Zephyr' : 'Kore'),
        gender: c.voiceConfig?.gender || 'Male',
        pitch: c.voiceConfig?.pitch || 1.0,
        rate: c.voiceConfig?.rate || 1.0,
        tone: c.voiceConfig?.tone || 'Warm',
        emotionStyle: c.voiceConfig?.emotionStyle || 'Enthusiastic',
      },
      relationships: (c.relationships || []).map((r: any, rIdx: number) => ({
        id: 'rel-' + Date.now() + '-' + rIdx,
        targetCharacterId: '',
        targetCharacterName: r.targetCharacterName || 'Co-Host',
        relationshipType: r.relationshipType || 'Co-Host',
        notes: r.notes || 'Colleague relationship',
      })),
    }));

    const generatedScript = (pd.script || []).map((l: any, sIdx: number) => {
      const matchedChar = generatedCharacters.find(
        (c: any) => c.name.toLowerCase() === (l.characterName || '').toLowerCase()
      ) || generatedCharacters[sIdx % generatedCharacters.length] || { id: 'gen-char-0', name: 'Host' };

      return {
        id: 'gen-line-' + Date.now() + '-' + sIdx,
        characterId: matchedChar.id,
        characterName: matchedChar.name,
        text: l.text || '',
        emotionNote: l.emotionNote || '[Natural]',
        sfxCue: l.sfxCue || '',
      };
    });

    const newProject: PodcastProject = {
      id: 'proj-' + Date.now(),
      title: pd.title || 'AI Generated Podcast',
      tagline: pd.tagline || 'Automated Episode',
      description: pd.description || data.topic,
      genre: (pd.genre as PodcastGenre) || data.genre,
      coverUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&auto=format&fit=crop&q=80',
      mode: 'generative',
      targetDurationMinutes: data.targetDurationMinutes,
      bgmTrack: data.musicMood,
      soundBoard: ['applause', 'intro_chime', 'dramatic_boom'],
      showNotes: pd.showNotes || `Show notes for ${pd.title}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      characters: generatedCharacters,
      script: generatedScript,
    };

    saveSingleProject(newProject);
    setProjects((prev) => [newProject, ...prev]);
    setActiveProjectId(newProject.id);
    setCurrentNavView('editor');
    setActiveTab('studio');
  };

  const handleDeleteProject = (id: string) => {
    const updated = deleteProject(id);
    setProjects(updated);
    if (activeProjectId === id) {
      setActiveProjectId(null);
      setCurrentNavView('dashboard');
    }
  };

  const handleDuplicateProject = (id: string) => {
    const duplicated = duplicateProject(id);
    if (duplicated) {
      setProjects(getStoredProjects());
    }
  };

  const handleRestoreSampleProjects = () => {
    if (confirm('Reset stored projects back to initial sample projects?')) {
      saveProjects(SAMPLE_PROJECTS);
      setProjects(SAMPLE_PROJECTS);
      setActiveProjectId(null);
      setCurrentNavView('dashboard');
    }
  };

  const handleToggleMode = (mode: 'creator' | 'generative') => {
    if (!activeProject) return;
    const updated = {
      ...activeProject,
      mode,
      updatedAt: new Date().toISOString(),
    };
    saveSingleProject(updated);
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    if (mode === 'generative') {
      setActiveTab('generative');
    } else if (activeTab === 'generative') {
      setActiveTab('scripting');
    }
  };

  const handleUpdateProject = (updated: PodcastProject) => {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    saveSingleProject(updated);
    setHasUnsavedChanges(false);
  };

  const handleCreateTemplateProject = (newProject: PodcastProject) => {
    setProjects((prev) => [newProject, ...prev]);
    saveSingleProject(newProject);
    setActiveProjectId(newProject.id);
    setCurrentNavView('editor');
    setActiveTab('scripting');
  };

  const handleOpenVoiceStudio = (char?: Character) => {
    setVoiceStudioTargetChar(char || null);
    setIsVoiceStudioOpen(true);
  };

  const handleOpenCoverArt = (targetProj?: PodcastProject | null) => {
    const projToEdit = targetProj || activeProject;
    setCoverArtTargetProject(projToEdit);
    setIsCoverArtOpen(true);
  };

  return (
    <div id="root-app-layout" className="flex h-screen bg-[#F5EFE6] font-sans text-[#2E2623] antialiased selection:bg-[#C85A32] selection:text-white overflow-hidden">
      {/* Left Sidebar Navigation (Collapsible) */}
      {!isSidebarCollapsed && (
        <Sidebar
          currentView={currentNavView}
          setCurrentView={(view) => {
            setCurrentNavView(view);
          }}
          activeProjectTitle={activeProject?.title}
          onNewProject={() => setIsNewProjectModalOpen(true)}
        />
      )}

      {/* Main Right Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <Header
          project={currentNavView === 'editor' ? activeProject : null}
          currentView={currentNavView}
          onBackToDashboard={handleBackToDashboard}
          onSaveProject={handleSaveActiveProject}
          onExportProject={() => activeProject && setExportModalProject(activeProject)}
          onToggleMode={handleToggleMode}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isSaving={isSaving}
          isAutoSaving={isAutoSaving}
          saveSuccess={saveSuccess}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onOpenVoiceStudio={() => handleOpenVoiceStudio()}
          onOpenCoverArt={() => handleOpenCoverArt(activeProject)}
        />

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto bg-[#F5EFE6]">
          {currentNavView === 'editor' && activeProject ? (
            <EditorWorkspace
              project={activeProject}
              onUpdateProject={handleUpdateProject}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onOpenVoiceStudio={handleOpenVoiceStudio}
            />
          ) : currentNavView === 'characters' ? (
            <CharacterLibraryView 
              projects={projects} 
              onOpenProject={handleOpenProject}
              onUpdateProject={handleUpdateProject}
              onOpenVoiceStudio={handleOpenVoiceStudio}
            />
          ) : currentNavView === 'settings' ? (
            <SettingsView />
          ) : (
            <Dashboard
              projects={projects}
              onOpenProject={handleOpenProject}
              onNewProject={() => setIsNewProjectModalOpen(true)}
              onSelectTemplateProject={handleCreateTemplateProject}
              onDeleteProject={handleDeleteProject}
              onDuplicateProject={handleDuplicateProject}
              onExportProject={(proj) => setExportModalProject(proj)}
              onRestoreSamples={handleRestoreSampleProjects}
              onOpenCoverArt={(proj) => handleOpenCoverArt(proj)}
            />
          )}
        </main>
      </div>

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreateCreatorProject={handleCreateCreatorProject}
        onCreateGenerativeProject={handleCreateGenerativeProject}
      />

      {/* Export Modal */}
      <ExportModal
        project={exportModalProject}
        isOpen={!!exportModalProject}
        onClose={() => setExportModalProject(null)}
      />

      {/* Voice Studio Modal */}
      <VoiceStudioModal
        isOpen={isVoiceStudioOpen}
        onClose={() => setIsVoiceStudioOpen(false)}
        project={activeProject}
        onUpdateCharacters={(chars) => {
          if (activeProject) {
            handleUpdateProject({ ...activeProject, characters: chars });
          }
        }}
        initialCharacter={voiceStudioTargetChar}
      />

      {/* Cover Art Modal */}
      <CoverArtModal
        isOpen={isCoverArtOpen}
        onClose={() => setIsCoverArtOpen(false)}
        project={coverArtTargetProject || activeProject}
        onUpdateCoverUrl={(newCoverUrl) => {
          const target = coverArtTargetProject || activeProject;
          if (target) {
            handleUpdateProject({ ...target, coverUrl: newCoverUrl });
          }
        }}
      />
    </div>
  );
}
