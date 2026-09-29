import React, { useState } from 'react';
import { PodcastProject } from '../types';
import { TemplateLibraryModal } from './templates/TemplateLibraryModal';
import { PROJECT_TEMPLATES } from '../data/projectTemplates';
import { 
  Search, 
  Plus, 
  Trash2, 
  Copy, 
  Download, 
  RotateCcw,
  ArrowUpDown,
  MoreVertical,
  Sparkles,
  Users,
  BookOpen,
  Newspaper,
  Smile,
  LayoutTemplate,
  ArrowRight,
  Radio,
  Image as ImageIcon
} from 'lucide-react';

interface DashboardProps {
  projects: PodcastProject[];
  onOpenProject: (id: string) => void;
  onNewProject: () => void;
  onSelectTemplateProject: (project: PodcastProject) => void;
  onDeleteProject: (id: string) => void;
  onDuplicateProject: (id: string) => void;
  onExportProject: (project: PodcastProject) => void;
  onRestoreSamples: () => void;
  onOpenCoverArt?: (project: PodcastProject) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  projects,
  onOpenProject,
  onNewProject,
  onSelectTemplateProject,
  onDeleteProject,
  onDuplicateProject,
  onExportProject,
  onRestoreSamples,
  onOpenCoverArt,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'updatedAt' | 'title' | 'duration'>('updatedAt');
  const [openMenuProjectId, setOpenMenuProjectId] = useState<string | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  const getTemplateIcon = (category: string) => {
    switch (category) {
      case 'Interview':
        return <Users className="w-4 h-4 text-[#C85A32]" />;
      case 'Storytelling':
        return <BookOpen className="w-4 h-4 text-[#C85A32]" />;
      case 'Daily News':
        return <Newspaper className="w-4 h-4 text-[#C85A32]" />;
      case 'Comedy & Banter':
        return <Smile className="w-4 h-4 text-[#C85A32]" />;
      case 'Radio Drama & Broadcast':
        return <Radio className="w-4 h-4 text-[#C85A32]" />;
      default:
        return <Sparkles className="w-4 h-4 text-[#C85A32]" />;
    }
  };

  // Filter & Sort Projects
  const filteredProjects = projects
    .filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.genre.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'duration') {
        return b.targetDurationMinutes - a.targetDurationMinutes;
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  return (
    <div id="dashboard-main-view" className="min-h-full bg-[#F5EFE6] text-[#2E2623] font-sans p-8 md:p-12 max-w-5xl mx-auto selection:bg-[#E0D4C3]">
      {/* Top Header & New Project Trigger */}
      <div className="flex items-end justify-between pb-8 pt-2 border-b border-[#E0D4C3]">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#2E2623]">Projects</h1>
          <p className="text-xs text-[#786B62] mt-1 font-normal tracking-wide">
            {projects.length} {projects.length === 1 ? 'audio project' : 'audio projects'} in workspace
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onRestoreSamples}
            title="Reset to default sample data"
            className="p-2 rounded-md text-[#786B62] hover:text-[#2E2623] hover:bg-[#EDE5D8] transition"
          >
            <RotateCcw className="w-3.5 h-3.5 stroke-[1.5]" />
          </button>

          <button
            id="dashboard-template-library-btn"
            onClick={() => setIsTemplateModalOpen(true)}
            className="px-3.5 py-2 rounded-md bg-[#EDE5D8] hover:bg-[#E0D4C3] text-[#2E2623] text-xs font-semibold border border-[#E0D4C3] transition flex items-center space-x-1.5 shadow-xs"
          >
            <LayoutTemplate className="w-3.5 h-3.5 text-[#C85A32] stroke-[1.5]" />
            <span>Templates Library</span>
          </button>

          <button
            id="dashboard-new-project-btn"
            onClick={onNewProject}
            className="px-4 py-2 rounded-md bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-semibold transition flex items-center space-x-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2]" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Templates Quick-Start Showcase Banner */}
      <div className="py-6 border-b border-[#E0D4C3]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <LayoutTemplate className="w-4 h-4 text-[#C85A32]" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#786B62]">
              Quick Start from Structure Templates
            </h2>
          </div>
          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className="text-[11px] font-semibold text-[#C85A32] hover:underline flex items-center space-x-1"
          >
            <span>Browse All Templates</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PROJECT_TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.id}
              onClick={() => setIsTemplateModalOpen(true)}
              className="p-3 bg-[#EDE5D8]/70 hover:bg-[#EDE5D8] border border-[#E0D4C3] hover:border-[#C85A32]/50 rounded-xl cursor-pointer transition space-y-1.5 group shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <div className="p-1 rounded bg-[#FAF6EE] border border-[#E0D4C3]">
                  {getTemplateIcon(tmpl.category)}
                </div>
                <span className="text-[10px] text-[#786B62] font-mono">~{tmpl.targetDurationMinutes}m</span>
              </div>
              <div className="font-semibold text-xs text-[#2E2623] group-hover:text-[#C85A32] transition">
                {tmpl.name}
              </div>
              <p className="text-[10px] text-[#786B62] line-clamp-1">{tmpl.tagline}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="py-6 flex items-center justify-between text-xs gap-4">
        <div className="relative flex-1 max-w-sm">
          <div className="flex items-center bg-[#FFFFFF] border border-[#E5E0D8] rounded-[6px] px-3 py-1.5 focus-within:border-[#18181B] transition shadow-2xs">
            <Search className="w-3.5 h-3.5 text-[#786B62] shrink-0 mr-2 stroke-[1.5]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full bg-transparent text-[#2E2623] text-xs focus:outline-none placeholder:text-[#A39587]"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 text-[#786B62]">
          <ArrowUpDown className="w-3 h-3 text-[#786B62] stroke-[1.5]" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent text-[#786B62] text-xs py-1 focus:outline-none cursor-pointer hover:text-[#2E2623] transition font-medium"
          >
            <option value="updatedAt" className="bg-[#FAF6EE] text-[#2E2623]">Recently Modified</option>
            <option value="title" className="bg-[#FAF6EE] text-[#2E2623]">Name (A-Z)</option>
            <option value="duration" className="bg-[#FAF6EE] text-[#2E2623]">Duration</option>
          </select>
        </div>
      </div>

      {/* Project List View */}
      <div className="pt-2">
        {filteredProjects.length === 0 ? (
          <div className="py-24 text-center space-y-3">
            <p className="text-[#786B62] text-xs font-normal">No projects match your search query.</p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-[#C85A32] hover:underline font-semibold"
            >
              Clear filter
            </button>
          </div>
        ) : (
          <div className="border-t border-[#E8E4DC]">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => onOpenProject(project.id)}
                className="group border-b border-[#E8E4DC] py-3.5 px-3 hover:bg-[#EFECE6] transition-colors duration-150 cursor-pointer flex items-center justify-between gap-4"
              >
                {/* Left Side: Cover Image Thumbnail + Title, Tagline, Genre Pill */}
                <div className="min-w-0 flex-1 flex items-center space-x-3">
                  <div className="relative group/cover shrink-0">
                    <img
                      src={project.coverUrl || 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=300&auto=format&fit=crop&q=80'}
                      alt={project.title}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-lg object-cover border border-[#E0D4C3] shadow-2xs group-hover:border-[#C85A32] transition"
                    />
                    {onOpenCoverArt && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenCoverArt(project);
                        }}
                        title="Edit Cover Art"
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover/cover:opacity-100 transition flex items-center justify-center rounded-lg text-white"
                      >
                        <ImageIcon className="w-4 h-4 text-white" />
                      </button>
                    )}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center space-x-2.5">
                      <h2 className="text-sm font-semibold text-[#2E2623] group-hover:text-[#C85A32] transition truncate">
                        {project.title}
                      </h2>
                      <span className="bg-[#EAE6DF] text-[#52525B] text-[11px] px-2.5 py-0.5 rounded-full font-medium shrink-0 inline-block">
                        {project.genre}
                      </span>
                    </div>

                    <p className="text-xs text-[#786B62] truncate font-normal leading-relaxed max-w-xl">
                      {project.tagline || project.description}
                    </p>
                  </div>
                </div>

                {/* Right Side: Tabular Metadata Grid + Action Bar */}
                <div className="flex items-center space-x-6 shrink-0">
                  {/* Tabular Metadata Columns */}
                  <div className="grid grid-cols-3 gap-4 items-center text-xs font-mono text-[#786B62]">
                    {/* Column 1: Mode Badge */}
                    <div className="w-24 text-left">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#EAE6DF] text-[#52525B] text-[10px] font-medium uppercase tracking-wider border border-[#E0D4C3]">
                        {project.mode === 'generative' ? 'Generative' : 'Manual'}
                      </span>
                    </div>

                    {/* Column 2: Duration */}
                    <div className="w-16 text-center text-[11px] text-[#786B62]">
                      ~{project.targetDurationMinutes}m
                    </div>

                    {/* Column 3: Last Modified Date */}
                    <div className="w-20 text-right text-[11px] text-[#786B62]">
                      {new Date(project.updatedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>

                  {/* Far Right Action Bar */}
                  <div 
                    className="flex items-center space-x-2 shrink-0 relative"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onOpenProject(project.id)}
                      className="px-3 py-1 rounded bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-semibold shadow-2xs transition"
                    >
                      Open
                    </button>

                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuProjectId(openMenuProjectId === project.id ? null : project.id);
                        }}
                        className="p-1.5 rounded text-[#786B62] hover:text-[#2E2623] hover:bg-[#EDE5D8] transition"
                        title="More options"
                      >
                        <MoreVertical className="w-4 h-4 stroke-[1.5]" />
                      </button>

                      {openMenuProjectId === project.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuProjectId(null);
                            }} 
                          />

                          <div className="absolute right-0 mt-1 w-36 bg-[#FAF6EE] border border-[#E0D4C3] rounded-md shadow-lg py-1 z-20 text-xs font-sans">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuProjectId(null);
                                onDuplicateProject(project.id);
                              }}
                              className="w-full text-left px-3 py-1.5 text-[#2E2623] hover:bg-[#EDE5D8] flex items-center space-x-2 transition"
                            >
                              <Copy className="w-3.5 h-3.5 text-[#786B62]" />
                              <span>Duplicate</span>
                            </button>

                            {onOpenCoverArt && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuProjectId(null);
                                  onOpenCoverArt(project);
                                }}
                                className="w-full text-left px-3 py-1.5 text-[#2E2623] hover:bg-[#EDE5D8] flex items-center space-x-2 transition"
                              >
                                <ImageIcon className="w-3.5 h-3.5 text-[#C85A32]" />
                                <span>Cover Art...</span>
                              </button>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuProjectId(null);
                                onExportProject(project);
                              }}
                              className="w-full text-left px-3 py-1.5 text-[#2E2623] hover:bg-[#EDE5D8] flex items-center space-x-2 transition"
                            >
                              <Download className="w-3.5 h-3.5 text-[#786B62]" />
                              <span>Export Project...</span>
                            </button>

                            <div className="my-1 border-t border-[#E0D4C3]" />

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuProjectId(null);
                                if (confirm(`Delete project "${project.title}"?`)) {
                                  onDeleteProject(project.id);
                                }
                              }}
                              className="w-full text-left px-3 py-1.5 text-red-700 hover:bg-red-50 flex items-center space-x-2 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-700" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Template Library Modal */}
      <TemplateLibraryModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={(newProject) => {
          onSelectTemplateProject(newProject);
          setIsTemplateModalOpen(false);
        }}
      />
    </div>
  );
};
