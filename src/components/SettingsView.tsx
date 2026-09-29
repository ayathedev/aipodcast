import React, { useState, useEffect } from 'react';
import { Settings, Save, Check } from 'lucide-react';
import { getStoredPreferences, savePreferences, StudioPreferences } from '../lib/storage';

export const SettingsView: React.FC = () => {
  const [saveMessage, setSaveMessage] = useState(false);
  const [speechEngine, setSpeechEngine] = useState('WebSpeechSynthesis');
  const [defaultVoice, setDefaultVoice] = useState('Zephyr');
  const [audioQuality, setAudioQuality] = useState('48kHz High Quality');

  // Load preferences from localStorage on mount
  useEffect(() => {
    const prefs = getStoredPreferences();
    setSpeechEngine(prefs.speechEngine || 'WebSpeechSynthesis');
    setDefaultVoice(prefs.defaultVoice || 'Zephyr');
    setAudioQuality(prefs.audioQuality || '48kHz High Quality');
  }, []);

  const handleUpdateAndSave = (newPrefs: Partial<StudioPreferences>) => {
    const updated: StudioPreferences = {
      speechEngine: newPrefs.speechEngine !== undefined ? newPrefs.speechEngine : speechEngine,
      defaultVoice: newPrefs.defaultVoice !== undefined ? newPrefs.defaultVoice : defaultVoice,
      audioQuality: newPrefs.audioQuality !== undefined ? newPrefs.audioQuality : audioQuality,
    };
    savePreferences(updated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    savePreferences({ speechEngine, defaultVoice, audioQuality });
    setSaveMessage(true);
    setTimeout(() => setSaveMessage(false), 2500);
  };

  return (
    <div id="settings-view" className="p-8 md:p-12 space-y-6 max-w-3xl mx-auto font-sans text-xs text-[#2E2623] bg-[#F5EFE6] min-h-full">
      <div className="flex items-center justify-between pb-6 border-b border-[#E0D4C3]">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[#2E2623] flex items-center space-x-2">
            <Settings className="w-4 h-4 text-[#786B62] stroke-[1.5]" />
            <span>Studio Preferences</span>
          </h1>
          <p className="text-xs text-[#786B62] mt-0.5 font-normal">
            TTS synthesis models and audio export parameters
          </p>
        </div>

        {saveMessage && (
          <span className="text-xs text-[#C85A32] font-semibold flex items-center space-x-1 animate-in fade-in duration-200">
            <Check className="w-3.5 h-3.5 text-[#C85A32]" />
            <span>Preferences Saved Successfully</span>
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="space-y-4">
          <h2 className="font-semibold text-[#2E2623]">
            Audio Engine & TTS
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#786B62] font-medium mb-1">
                Audio Engine Provider
              </label>
              <select
                value={speechEngine}
                onChange={(e) => {
                  const val = e.target.value;
                  setSpeechEngine(val);
                  handleUpdateAndSave({ speechEngine: val });
                }}
                className="w-full bg-[#FAF6EE] text-[#2E2623] text-xs px-3 py-2 rounded-md border border-[#E0D4C3] focus:outline-none focus:border-[#C85A32] shadow-xs cursor-pointer"
              >
                <option value="WebSpeechSynthesis" className="bg-[#FAF6EE] text-[#2E2623]">Client Web Speech Direct Synthesis</option>
                <option value="GeminiTTS" className="bg-[#FAF6EE] text-[#2E2623]">Gemini Audio Direct TTS Model</option>
              </select>
            </div>

            <div>
              <label className="block text-[#786B62] font-medium mb-1">
                Output Frequency
              </label>
              <select
                value={audioQuality}
                onChange={(e) => {
                  const val = e.target.value;
                  setAudioQuality(val);
                  handleUpdateAndSave({ audioQuality: val });
                }}
                className="w-full bg-[#FAF6EE] text-[#2E2623] text-xs px-3 py-2 rounded-md border border-[#E0D4C3] focus:outline-none focus:border-[#C85A32] shadow-xs cursor-pointer"
              >
                <option value="48kHz High Quality" className="bg-[#FAF6EE] text-[#2E2623]">48 kHz High Quality Studio Uncompressed</option>
                <option value="44.1kHz CD Quality" className="bg-[#FAF6EE] text-[#2E2623]">44.1 kHz Standard CD Quality</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-[#E0D4C3]">
          <h2 className="font-semibold text-[#2E2623]">Default Voice Actor Preset</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#786B62] font-medium mb-1">
                Host Voice Actor
              </label>
              <select
                value={defaultVoice}
                onChange={(e) => {
                  const val = e.target.value;
                  setDefaultVoice(val);
                  handleUpdateAndSave({ defaultVoice: val });
                }}
                className="w-full bg-[#FAF6EE] text-[#2E2623] text-xs px-3 py-2 rounded-md border border-[#E0D4C3] focus:outline-none focus:border-[#C85A32] shadow-xs cursor-pointer"
              >
                <option value="Zephyr" className="bg-[#FAF6EE] text-[#2E2623]">Zephyr (Male - Warm & Authoritative)</option>
                <option value="Puck" className="bg-[#FAF6EE] text-[#2E2623]">Puck (Female - Smooth & Natural)</option>
                <option value="Kore" className="bg-[#FAF6EE] text-[#2E2623]">Kore (Female - Crisp & Analytical)</option>
                <option value="Charon" className="bg-[#FAF6EE] text-[#2E2623]">Charon (Male - Deep & Gravelly)</option>
                <option value="Fenrir" className="bg-[#FAF6EE] text-[#2E2623]">Fenrir (Male - Upbeat & Energetic)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[#E0D4C3] flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-[#C85A32] hover:bg-[#B24D28] text-white font-semibold transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
};
