import { PodcastProject } from '../types';
import { SAMPLE_PROJECTS } from '../data/sampleProjects';

const STORAGE_KEY = 'ai_podcast_studio_projects_v1';
const PREFERENCES_KEY = 'ai_podcast_studio_settings_v1';

export interface StudioPreferences {
  speechEngine: string;
  defaultVoice: string;
  audioQuality: string;
}

export const DEFAULT_PREFERENCES: StudioPreferences = {
  speechEngine: 'WebSpeechSynthesis',
  defaultVoice: 'Zephyr',
  audioQuality: '48kHz High Quality',
};

export function getStoredPreferences(): StudioPreferences {
  try {
    const raw = localStorage.getItem(PREFERENCES_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed to parse preferences:', e);
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(prefs: StudioPreferences): void {
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.error('Failed to save preferences to localStorage:', e);
  }
}

export function getStoredProjects(): PodcastProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Seed with sample projects
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_PROJECTS));
      return SAMPLE_PROJECTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return SAMPLE_PROJECTS;
  } catch (e) {
    console.error('Failed to parse stored projects:', e);
    return SAMPLE_PROJECTS;
  }
}

export function saveProjects(projects: PodcastProject[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error('Failed to save projects to localStorage:', e);
  }
}

export function getProjectById(id: string): PodcastProject | null {
  const projects = getStoredProjects();
  return projects.find((p) => p.id === id) || null;
}

export function saveSingleProject(project: PodcastProject): PodcastProject {
  const projects = getStoredProjects();
  const index = projects.findIndex((p) => p.id === project.id);
  const updatedProject = {
    ...project,
    updatedAt: new Date().toISOString(),
  };

  if (index >= 0) {
    projects[index] = updatedProject;
  } else {
    projects.unshift(updatedProject);
  }

  saveProjects(projects);
  return updatedProject;
}

export function deleteProject(id: string): PodcastProject[] {
  const projects = getStoredProjects().filter((p) => p.id !== id);
  saveProjects(projects);
  return projects;
}

export function duplicateProject(id: string): PodcastProject | null {
  const target = getProjectById(id);
  if (!target) return null;

  const newProject: PodcastProject = {
    ...target,
    id: 'project-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    title: `${target.title} (Copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveSingleProject(newProject);
  return newProject;
}

export function exportProjectJSON(project: PodcastProject): void {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(project, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `${project.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_podcast.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
