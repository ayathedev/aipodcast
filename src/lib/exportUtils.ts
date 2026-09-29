import { PodcastProject } from '../types';
import { generateMultiTrackStems } from './stemAudioExporter';

export type ExportFormat = 'mp3' | 'wav' | 'rss' | 'json' | 'txt';

export async function exportProject(
  project: PodcastProject,
  format: ExportFormat,
  onProgress?: (status: string) => void
): Promise<void> {
  const sanitizedTitle = project.title.toLowerCase().replace(/[^a-z0-9]/g, '_');

  if (format === 'json') {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(project, null, 2));
    downloadFile(dataStr, `${sanitizedTitle}_podcast.json`);
  } else if (format === 'txt') {
    const content = `================================================
${project.title.toUpperCase()}
Tagline: ${project.tagline}
Genre: ${project.genre} | Duration: ~${project.targetDurationMinutes} mins
================================================

CAST DIRECTORY:
` +
      project.characters.map((c) => `- ${c.name} (${c.mainRole}): ${c.personality}`).join('\n') +
      `\n\n================================================
SHOW NOTES & TAKEAWAYS:
================================================
${project.showNotes || 'No show notes provided.'}

================================================
SCRIPT TRANSCRIPT:
================================================
` +
      project.script.map((l) => `${l.isSceneHeader ? `\n[SCENE: ${l.sceneTitle || 'Scene'}]\n` : `${l.characterName.toUpperCase()} ${l.emotionNote || ''}\n${l.text}\n`}`).join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    downloadBlob(url, `${sanitizedTitle}_transcript.txt`);
  } else if (format === 'rss') {
    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(project.title)}</title>
    <link>https://ai.studio/podcast/${project.id}</link>
    <language>en-us</language>
    <copyright>© ${new Date().getFullYear()} ${escapeXml(project.title)}</copyright>
    <itunes:author>${escapeXml(project.characters.map(c => c.name).join(', '))}</itunes:author>
    <description>${escapeXml(project.description || project.tagline)}</description>
    <itunes:summary>${escapeXml(project.tagline)}</itunes:summary>
    <itunes:image href="${project.coverUrl}" />
    <itunes:category text="${escapeXml(project.genre)}"/>
    <item>
      <title>${escapeXml(project.title)} - Full Episode</title>
      <description>${escapeXml(project.showNotes || project.description)}</description>
      <pubDate>${new Date().toUTCString()}</pubDate>
      <enclosure url="https://ai.studio/api/audio/${project.id}.mp3" length="2048000" type="audio/mpeg"/>
      <guid>https://ai.studio/podcast/${project.id}/${Date.now()}</guid>
      <itunes:duration>${(project.targetDurationMinutes || 3) * 60}</itunes:duration>
      <itunes:explicit>false</itunes:explicit>
    </item>
  </channel>
</rss>`;

    const blob = new Blob([rssXml], { type: 'application/rss+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    downloadBlob(url, `${sanitizedTitle}_podcast_rss.xml`);
  } else if (format === 'mp3' || format === 'wav') {
    // Generate REAL audio episode file via Multi-Track rendering & MP3/WAV encoding
    const stems = await generateMultiTrackStems(project, onProgress);
    const targetStem = stems.find(s => format === 'mp3' ? s.id === 'master_mp3' : s.id === 'master_wav') || stems[0];

    const url = URL.createObjectURL(targetStem.blob);
    downloadBlob(url, targetStem.filename);
  }
}

function downloadFile(dataUri: string, filename: string) {
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataUri);
  downloadAnchor.setAttribute("download", filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function downloadBlob(url: string, filename: string) {
  const downloadAnchor = document.createElement('a');
  downloadAnchor.href = url;
  downloadAnchor.download = filename;
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escapeXml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
