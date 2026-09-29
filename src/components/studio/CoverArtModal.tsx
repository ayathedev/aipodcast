import React, { useState, useEffect, useRef } from 'react';
import { PodcastProject } from '../../types';
import { 
  Image as ImageIcon, 
  Sparkles, 
  Download, 
  Check, 
  X, 
  Wand2, 
  Type as TypeIcon, 
  Palette, 
  Layers, 
  RefreshCw, 
  Loader2, 
  Radio, 
  Sliders,
  Maximize2
} from 'lucide-react';

interface CoverArtModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: PodcastProject | null;
  onUpdateCoverUrl?: (coverUrl: string) => void;
}

export interface ArtStylePreset {
  id: string;
  name: string;
  category: string;
  fontFamily: 'sans' | 'serif' | 'mono' | 'display';
  primaryColor: string;
  accentColor: string;
  bgColor1: string;
  bgColor2: string;
  texture: 'grid' | 'waves' | 'spotlight' | 'dots' | 'minimal';
  samplePrompt: string;
}

const ART_STYLE_PRESETS: ArtStylePreset[] = [
  {
    id: 'cyberpunk-synth',
    name: 'Cyberpunk Synthwave',
    category: 'Tech & Sci-Fi',
    fontFamily: 'mono',
    primaryColor: '#00F0FF',
    accentColor: '#FF007A',
    bgColor1: '#0F0C20',
    bgColor2: '#1A0B2E',
    texture: 'grid',
    samplePrompt: 'Futuristic glowing neon neon-grid synthwave sunset with digital audio waves, glowing cyan and magenta, isometric dark sci-fi background'
  },
  {
    id: 'vintage-radio',
    name: 'Vintage Broadcast Radio',
    category: 'History & Storytelling',
    fontFamily: 'serif',
    primaryColor: '#F5E6C8',
    accentColor: '#C85A32',
    bgColor1: '#2E1F18',
    bgColor2: '#1A110D',
    texture: 'waves',
    samplePrompt: 'Classic 1950s broadcast condenser microphone with warm golden studio spotlight and analog vinyl record grooves, vintage mahogany tone'
  },
  {
    id: 'minimalist-editorial',
    name: 'Minimalist Editorial',
    category: 'News & Culture',
    fontFamily: 'sans',
    primaryColor: '#2E2623',
    accentColor: '#C85A32',
    bgColor1: '#FAF6EE',
    bgColor2: '#EDE5D8',
    texture: 'minimal',
    samplePrompt: 'Sophisticated modern gallery poster artwork, high contrast minimalist geometric arch shapes, warm beige and charcoal cream design'
  },
  {
    id: '3d-studio',
    name: '3D Digital Studio',
    category: 'Business & Audio',
    fontFamily: 'display',
    primaryColor: '#FFFFFF',
    accentColor: '#3B82F6',
    bgColor1: '#1E293B',
    bgColor2: '#0F172A',
    texture: 'spotlight',
    samplePrompt: 'Sleek 3D isometric studio headphones floating over smooth gradient sphere with soft studio key lighting and volumetric glow'
  },
  {
    id: 'pop-art-graphic',
    name: 'Pop Art & Comic Graphic',
    category: 'Comedy & Entertainment',
    fontFamily: 'display',
    primaryColor: '#FFE600',
    accentColor: '#FF2A00',
    bgColor1: '#1A1A1A',
    bgColor2: '#2D0A00',
    texture: 'dots',
    samplePrompt: 'Vibrant pop-art halftone graphic novel style illustration of broadcast speech bubbles and radio waves, high energy saturated colors'
  },
  {
    id: 'emerald-mindset',
    name: 'Emerald Executive',
    category: 'Finance & Growth',
    fontFamily: 'sans',
    primaryColor: '#ECFDF5',
    accentColor: '#10B981',
    bgColor1: '#064E3B',
    bgColor2: '#022C22',
    texture: 'grid',
    samplePrompt: 'Deep emerald forest green executive backdrop with subtle glowing chart vectors and clean modern architectural lines'
  }
];

export const CoverArtModal: React.FC<CoverArtModalProps> = ({
  isOpen,
  onClose,
  project,
  onUpdateCoverUrl,
}) => {
  const [title, setTitle] = useState(project?.title || 'The AI Show');
  const [tagline, setTagline] = useState(project?.tagline || 'Uncovering future signals & tech stories');
  const [genre, setGenre] = useState(project?.genre || 'Tech & Future');
  const [selectedPreset, setSelectedPreset] = useState<ArtStylePreset>(ART_STYLE_PRESETS[0]);
  
  // Custom design overrides
  const [fontChoice, setFontChoice] = useState<'sans' | 'serif' | 'mono' | 'display'>('mono');
  const [titleColor, setTitleColor] = useState('#00F0FF');
  const [accentColor, setAccentColor] = useState('#FF007A');
  const [showBadge, setShowBadge] = useState(true);
  const [showTagline, setShowTagline] = useState(true);
  
  // AI Image Background State
  const [aiImageUrl, setAiImageUrl] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (project) {
      setTitle(project.title);
      setTagline(project.tagline || project.description || 'Exclusive Podcast Series');
      setGenre(project.genre || 'Podcast');
    }
  }, [project]);

  useEffect(() => {
    setFontChoice(selectedPreset.fontFamily);
    setTitleColor(selectedPreset.primaryColor);
    setAccentColor(selectedPreset.accentColor);
  }, [selectedPreset]);

  // Re-draw Canvas Title Cover Artwork whenever options change
  useEffect(() => {
    if (!isOpen) return;
    renderCoverToCanvas();
  }, [isOpen, title, tagline, genre, selectedPreset, fontChoice, titleColor, accentColor, showBadge, showTagline, aiImageUrl]);

  if (!isOpen) return null;

  const loadedImgRef = useRef<HTMLImageElement | null>(null);

  // Preload AI image when aiImageUrl changes
  useEffect(() => {
    if (!aiImageUrl) {
      loadedImgRef.current = null;
      renderCoverToCanvas();
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      loadedImgRef.current = img;
      renderCoverToCanvas();
    };
    img.onerror = () => {
      loadedImgRef.current = null;
      renderCoverToCanvas();
    };
    img.src = aiImageUrl;
  }, [aiImageUrl]);

  // Master Canvas Rendering Engine
  const renderCoverToCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 1024;
    canvas.width = size;
    canvas.height = size;

    // 1. Draw Background
    if (loadedImgRef.current) {
      ctx.drawImage(loadedImgRef.current, 0, 0, size, size);
      drawOverlaysAndTypography(ctx, size);
    } else {
      drawProceduralBackground(ctx, size);
      drawOverlaysAndTypography(ctx, size);
    }
  };

  const drawProceduralBackground = (ctx: CanvasRenderingContext2D, size: number) => {
    // Gradient Background
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, selectedPreset.bgColor1);
    grad.addColorStop(1, selectedPreset.bgColor2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Texture FX
    if (selectedPreset.texture === 'grid') {
      ctx.strokeStyle = `${accentColor}25`;
      ctx.lineWidth = 2;
      const gridSize = 64;
      for (let x = 0; x <= size; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, size);
        ctx.stroke();
      }
      for (let y = 0; y <= size; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(size, y);
        ctx.stroke();
      }
    } else if (selectedPreset.texture === 'waves') {
      ctx.strokeStyle = `${accentColor}30`;
      ctx.lineWidth = 4;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        const y = size * (0.3 + i * 0.1);
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(size * 0.3, y - 80, size * 0.6, y + 80, size, y);
        ctx.stroke();
      }
    } else if (selectedPreset.texture === 'spotlight') {
      const radial = ctx.createRadialGradient(size / 2, size / 3, 50, size / 2, size / 3, size * 0.7);
      radial.addColorStop(0, `${accentColor}40`);
      radial.addColorStop(1, 'transparent');
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, size, size);
    } else if (selectedPreset.texture === 'dots') {
      ctx.fillStyle = `${accentColor}20`;
      for (let x = 32; x < size; x += 64) {
        for (let y = 32; y < size; y += 64) {
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  };

  const drawOverlaysAndTypography = (ctx: CanvasRenderingContext2D, size: number) => {
    // Bottom Vignette Gradient to ensure legibility
    const darkGradient = ctx.createLinearGradient(0, size * 0.3, 0, size);
    darkGradient.addColorStop(0, 'transparent');
    darkGradient.addColorStop(0.65, 'rgba(0, 0, 0, 0.65)');
    darkGradient.addColorStop(1, 'rgba(0, 0, 0, 0.92)');
    ctx.fillStyle = darkGradient;
    ctx.fillRect(0, 0, size, size);

    // Font Family Map
    let fontName = 'sans-serif';
    if (fontChoice === 'mono') fontName = '"Courier New", Courier, monospace';
    if (fontChoice === 'serif') fontName = 'Georgia, "Times New Roman", serif';
    if (fontChoice === 'display') fontName = '"Trebuchet MS", "Lucida Sans", sans-serif';

    // 2. Draw Genre Badge at top
    if (showBadge && genre) {
      ctx.save();
      const badgeY = 90;
      const badgeText = genre.toUpperCase();
      ctx.font = `bold 24px ${fontName}`;
      const textWidth = ctx.measureText(badgeText).width;
      const badgePaddingX = 24;
      const badgeHeight = 44;
      const badgeX = 80;

      // Badge Fill
      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, textWidth + badgePaddingX * 2, badgeHeight, 8);
      ctx.fill();

      // Badge Text
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(badgeText, badgeX + badgePaddingX, badgeY + 30);
      ctx.restore();
    }

    // 3. Draw Title Text
    ctx.save();
    const titleY = size - 260;
    
    // Title Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 6;

    ctx.fillStyle = titleColor;
    ctx.font = `900 72px ${fontName}`;

    // Wrap Title if long
    const maxTitleWidth = size - 160;
    const words = title.split(' ');
    let line = '';
    const lines: string[] = [];

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxTitleWidth && n > 0) {
        lines.push(line);
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line);

    let startY = titleY - (lines.length - 1) * 76;
    for (const l of lines) {
      ctx.fillText(l.trim(), 80, startY);
      startY += 82;
    }
    ctx.restore();

    // 4. Draw Tagline Subtitle
    if (showTagline && tagline) {
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#E2E8F0';
      ctx.font = `500 32px ${fontName}`;
      
      const maxTaglineLineWidth = size - 160;
      const tagWords = tagline.split(' ');
      let tagLineStr = '';
      const tagLines: string[] = [];

      for (let i = 0; i < tagWords.length; i++) {
        const testStr = tagLineStr + tagWords[i] + ' ';
        if (ctx.measureText(testStr).width > maxTaglineLineWidth && i > 0) {
          tagLines.push(tagLineStr);
          tagLineStr = tagWords[i] + ' ';
        } else {
          tagLineStr = testStr;
        }
      }
      tagLines.push(tagLineStr);

      let tagY = size - 140;
      for (const tl of tagLines.slice(0, 2)) {
        ctx.fillText(tl.trim(), 80, tagY);
        tagY += 40;
      }
      ctx.restore();
    }

    // 5. Draw Corner "EXPLICIT AUDIO / PODCAST ORIGINAL" branding stripe
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = `bold 20px monospace`;
    ctx.fillText('ORIGINAL PODCAST • 1024x1024 HI-RES', size - 480, size - 40);
    ctx.restore();
  };

  const handleGenerateAiCoverArt = async () => {
    setIsGeneratingAi(true);
    setStatusText('Refining AI artwork prompt...');

    try {
      const response = await fetch('/api/gemini/generate-cover-art', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          tagline,
          genre,
          artStyle: selectedPreset.name,
          customPrompt
        })
      });

      const data = await response.json();
      if (data.imageUrl) {
        setAiImageUrl(data.imageUrl);
        setStatusText('AI Cover Background Generated!');
      } else {
        setStatusText('Using custom procedural canvas design.');
      }
    } catch (err: any) {
      console.warn('AI cover art generation error:', err);
      setStatusText('Fallback to studio design.');
    } finally {
      setIsGeneratingAi(false);
      setTimeout(() => setStatusText(null), 3000);
    }
  };

  const handleApplyCoverToProject = () => {
    const canvas = canvasRef.current;
    if (!canvas || !onUpdateCoverUrl) return;

    const finalDataUrl = canvas.toDataURL('image/png');
    onUpdateCoverUrl(finalDataUrl);
    onClose();
  };

  const handleDownloadCover = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${title.toLowerCase().replace(/\s+/g, '_')}_cover_art.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#FAF6EE] border border-[#E0D4C3] w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-[#EDE5D8] px-5 py-3.5 border-b border-[#E0D4C3] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#C85A32] text-white flex items-center justify-center shadow-xs">
              <ImageIcon className="w-4 h-4 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#2E2623] flex items-center space-x-2">
                <span>Podcast Title & Cover Image Generator</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#C85A32]/10 text-[#C85A32] border border-[#C85A32]/20">
                  1024x1024 HD Square
                </span>
              </h2>
              <p className="text-xs text-[#786B62]">
                Design custom cover art for Spotify, Apple Podcasts, and RSS show exports.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#786B62] hover:text-[#2E2623] hover:bg-[#E0D4C3] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Grid */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12">
          
          {/* Left Side: Live 1:1 Canvas Preview (5 cols) */}
          <div className="md:col-span-5 bg-[#18181B] p-5 flex flex-col items-center justify-center border-r border-[#E0D4C3] space-y-4 relative overflow-y-auto">
            
            <div className="relative aspect-square w-full max-w-[340px] rounded-lg overflow-hidden shadow-2xl border-2 border-white/20 group">
              <canvas
                ref={canvasRef}
                className="w-full h-full object-cover"
              />

              {isGeneratingAi && (
                <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-2 p-4 text-center">
                  <Loader2 className="w-8 h-8 text-[#C85A32] animate-spin" />
                  <p className="text-xs font-semibold">{statusText || 'Generating AI Cover Art...'}</p>
                </div>
              )}
            </div>

            <div className="w-full max-w-[340px] flex items-center justify-between text-xs text-[#A1A1AA]">
              <span>1024 × 1024 px PNG</span>
              <span>1:1 Square Cover Art</span>
            </div>

            {/* Quick Action Buttons */}
            <div className="w-full max-w-[340px] flex items-center space-x-2 pt-2">
              <button
                onClick={handleDownloadCover}
                className="flex-1 py-2 px-3 rounded-md bg-[#27272A] hover:bg-[#3F3F46] text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition border border-white/10 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PNG</span>
              </button>

              {onUpdateCoverUrl && (
                <button
                  onClick={handleApplyCoverToProject}
                  className="flex-1 py-2 px-3 rounded-md bg-[#C85A32] hover:bg-[#B24D28] text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow-xs transition cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Set Show Cover</span>
                </button>
              )}
            </div>

          </div>

          {/* Right Side: Design & AI Prompt Controls (7 cols) */}
          <div className="md:col-span-7 p-5 flex flex-col justify-between overflow-y-auto space-y-4 bg-[#FAF6EE]">
            
            <div className="space-y-4">
              
              {/* Preset Style Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#2E2623] uppercase tracking-wider flex items-center space-x-1">
                  <Palette className="w-3.5 h-3.5 text-[#C85A32]" />
                  <span>Art Style Presets</span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ART_STYLE_PRESETS.map((preset) => {
                    const isSelected = selectedPreset.id === preset.id;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => setSelectedPreset(preset)}
                        className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#EDE5D8] border-[#C85A32] shadow-xs'
                            : 'bg-[#FAF6EE] border-[#E0D4C3] hover:border-[#C85A32]/40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-[#2E2623] truncate">{preset.name}</span>
                          <span 
                            className="w-3 h-3 rounded-full border border-black/20"
                            style={{ backgroundColor: preset.accentColor }}
                          />
                        </div>
                        <span className="text-[10px] text-[#786B62] block truncate">{preset.category}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title & Tagline Inputs */}
              <div className="bg-[#EDE5D8]/50 p-3.5 rounded-lg border border-[#E0D4C3] space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-[#2E2623] mb-1 block">
                      Podcast Show Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-[#FAF6EE] text-[#2E2623] text-xs px-3 py-2 rounded border border-[#E0D4C3] focus:outline-none focus:border-[#C85A32] font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-[#2E2623] mb-1 block">
                      Genre / Category Badge
                    </label>
                    <input
                      type="text"
                      value={genre}
                      onChange={(e) => setGenre(e.target.value)}
                      className="w-full bg-[#FAF6EE] text-[#2E2623] text-xs px-3 py-2 rounded border border-[#E0D4C3] focus:outline-none focus:border-[#C85A32]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#2E2623] mb-1 block">
                    Subtitle / Tagline Text
                  </label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full bg-[#FAF6EE] text-[#2E2623] text-xs px-3 py-2 rounded border border-[#E0D4C3] focus:outline-none focus:border-[#C85A32]"
                  />
                </div>
              </div>

              {/* Typography & Color Customizer */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                <div>
                  <label className="text-[11px] font-semibold text-[#786B62] mb-1 block">
                    Typography Font
                  </label>
                  <select
                    value={fontChoice}
                    onChange={(e) => setFontChoice(e.target.value as any)}
                    className="w-full bg-[#FAF6EE] text-[#2E2623] text-xs px-2.5 py-1.5 rounded border border-[#E0D4C3] cursor-pointer"
                  >
                    <option value="mono">Monospace Tech</option>
                    <option value="sans">Modern Sans-Serif</option>
                    <option value="serif">Classic Editorial Serif</option>
                    <option value="display">Heavy Display</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#786B62] mb-1 block">
                    Title Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={titleColor}
                      onChange={(e) => setTitleColor(e.target.value)}
                      className="w-7 h-7 rounded border border-[#E0D4C3] cursor-pointer"
                    />
                    <span className="text-xs font-mono uppercase text-[#2E2623]">{titleColor}</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#786B62] mb-1 block">
                    Badge & Accent Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-7 h-7 rounded border border-[#E0D4C3] cursor-pointer"
                    />
                    <span className="text-xs font-mono uppercase text-[#2E2623]">{accentColor}</span>
                  </div>
                </div>

              </div>

              {/* AI Gemini Image Generation Prompt Box */}
              <div className="bg-[#FAF6EE] p-3.5 rounded-lg border border-[#E0D4C3] space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#2E2623] flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#C85A32]" />
                    <span>Generate Custom Background Artwork via Gemini AI</span>
                  </label>

                  {aiImageUrl && (
                    <button
                      onClick={() => setAiImageUrl(null)}
                      className="text-[10px] text-[#786B62] hover:text-[#C85A32] underline cursor-pointer"
                    >
                      Reset to Procedural Background
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder={`e.g. ${selectedPreset.samplePrompt}`}
                    className="flex-1 bg-[#EDE5D8]/50 text-[#2E2623] text-xs px-3 py-2 rounded border border-[#E0D4C3] focus:outline-none focus:border-[#C85A32]"
                  />

                  <button
                    onClick={handleGenerateAiCoverArt}
                    disabled={isGeneratingAi}
                    className="px-3.5 py-2 rounded bg-[#C85A32] hover:bg-[#B24D28] disabled:opacity-50 text-white text-xs font-bold flex items-center space-x-1.5 transition shadow-xs cursor-pointer whitespace-nowrap"
                  >
                    {isGeneratingAi ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Wand2 className="w-3.5 h-3.5" />
                    )}
                    <span>{isGeneratingAi ? 'Generating...' : 'Generate AI Image'}</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-3 border-t border-[#E0D4C3] flex items-center justify-between">
              <button
                onClick={renderCoverToCanvas}
                className="px-3 py-2 rounded-md bg-[#EDE5D8] hover:bg-[#E0D4C3] text-[#2E2623] text-xs font-medium flex items-center space-x-1.5 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#786B62]" />
                <span>Re-render Preview</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-md bg-[#E0D4C3] hover:bg-[#D8CAB8] text-[#2E2623] text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>

                {onUpdateCoverUrl && (
                  <button
                    onClick={handleApplyCoverToProject}
                    className="px-4 py-2 rounded-md bg-[#C85A32] hover:bg-[#B24D28] text-white text-xs font-bold flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply to Project</span>
                  </button>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
