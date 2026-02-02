
import React, { useState, useRef } from 'react';
import { JournalEntry, AstroProfile } from '../types';
import { geminiService } from '../services/geminiService';

interface ReflectionJournalProps {
  astroProfile?: AstroProfile;
  onEntrySaved?: () => void;
}

const moods = ["Peaceful", "Anxious", "Inspired", "Melancholy", "Driven", "Grateful", "Lost", "Hopeful", "Stressed", "Joyful"];

const ReflectionJournal: React.FC<ReflectionJournalProps> = ({ astroProfile, onEntrySaved }) => {
  const [content, setContent] = useState('');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<any>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEditingMood, setIsEditingMood] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const handleSave = async () => {
    if (!content.trim()) return;

    setAnalyzing(true);
    try {
      const feedback = await geminiService.analyzeJournal(content, astroProfile);
      const newEntry: JournalEntry = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString(),
        content,
        aiFeedback: feedback.feedback,
        mood: feedback.mood
      };
      setEntries([newEntry, ...entries]);
      setCurrentFeedback(feedback);
      setContent('');
      if (onEntrySaved) onEntrySaved();
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const updateCurrentMood = (newMood: string) => {
    setCurrentFeedback(prev => prev ? { ...prev, mood: newMood } : null);
    setEntries(prev => prev.map((e, i) => i === 0 ? { ...e, mood: newMood } : e));
    setIsEditingMood(false);
  };

  const handleListen = async (text: string) => {
    if (isSpeaking) return;
    setIsSpeaking(true);
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const audioData = await geminiService.synthesize(text);
      if (audioData) {
        const bytes = geminiService.decodeBase64(audioData);
        const buffer = await geminiService.decodeAudioData(bytes, audioCtxRef.current);
        const source = audioCtxRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtxRef.current.destination);
        source.onended = () => setIsSpeaking(false);
        source.start();
      } else {
        setIsSpeaking(false);
      }
    } catch (err) {
      console.error(err);
      setIsSpeaking(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      <section>
        <h2 className="text-3xl font-serif font-bold text-white mb-2">Star Log</h2>
        <p className="text-slate-500">Document your journey through the universe. All entries are private and stored locally.</p>
      </section>

      <div className="bg-white/5 rounded-3xl border border-white/5 shadow-xl p-8 space-y-4 backdrop-blur-md">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`What's manifesting in your reality today, ${astroProfile?.sunSign || 'Seeker'}?`}
          className="w-full h-48 bg-transparent text-xl text-slate-200 border-none focus:ring-0 resize-none placeholder:text-slate-700"
        />
        <div className="flex justify-between items-center pt-6 border-t border-white/5">
          <div className="flex gap-2">
            {astroProfile?.sunSign && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-950/50 px-3 py-1.5 rounded-full border border-indigo-500/20">
                <i className="fa-solid fa-star mr-1"></i> {astroProfile.sunSign} Insight Active
              </span>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={analyzing || !content}
            className={`px-10 py-4 rounded-2xl font-bold text-white transition-all shadow-lg ${
              analyzing ? 'bg-indigo-900/50 text-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-indigo-500/20'
            }`}
          >
            {analyzing ? (
              <span className="flex items-center gap-2">
                <i className="fa-solid fa-spinner animate-spin"></i> Reading the Stars...
              </span>
            ) : 'Archive & Analyze'}
          </button>
        </div>
      </div>

      {currentFeedback && (
        <div className="bg-gradient-to-r from-slate-900/40 to-indigo-900/20 border border-indigo-500/30 rounded-3xl p-8 animate-in slide-in-from-bottom duration-700 backdrop-blur-md">
          <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                <i className="fa-solid fa-sparkles text-xl"></i>
              </div>
              <div>
                <h4 className="font-bold text-white">Faceworldd Insight</h4>
                <p className="text-xs text-indigo-300 uppercase tracking-widest">Cosmic Reflection</p>
              </div>
            </div>

            <div className="md:ml-auto relative">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 text-center md:text-left">Detected Mood</p>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsEditingMood(!isEditingMood)}
                  className={`text-sm font-bold uppercase tracking-wider px-6 py-2.5 rounded-full border transition-all flex items-center gap-2 ${
                    isEditingMood ? 'bg-white text-indigo-900 border-white' : 'text-indigo-400 bg-indigo-950 border-indigo-500/20 hover:border-indigo-500'
                  }`}
                >
                  {currentFeedback.mood}
                  <i className={`fa-solid ${isEditingMood ? 'fa-xmark' : 'fa-chevron-down'} text-[10px]`}></i>
                </button>
                {isEditingMood && (
                  <div className="absolute top-full mt-2 left-0 right-0 md:right-auto md:w-64 bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-2xl z-50 grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                    {moods.map(m => (
                      <button 
                        key={m}
                        onClick={() => updateCurrentMood(m)}
                        className="text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 px-3 py-2 rounded-lg text-left"
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <p className="text-slate-300 leading-relaxed text-lg mb-8 italic border-l-4 border-indigo-500/30 pl-6">"{currentFeedback.feedback}"</p>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 bg-slate-950/50 p-6 rounded-2xl border border-white/5">
               <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Cosmic Action Plan</p>
               <p className="text-white font-medium">{currentFeedback.growthAction}</p>
            </div>
            <button 
              onClick={() => handleListen(currentFeedback.feedback)}
              disabled={isSpeaking}
              className="px-8 py-4 bg-white text-indigo-950 rounded-2xl font-bold hover:bg-indigo-50 transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-50"
            >
              <i className={`fa-solid ${isSpeaking ? 'fa-spinner animate-spin' : 'fa-volume-high'}`}></i>
              {isSpeaking ? 'Chanting...' : 'Hear Oracle'}
            </button>
          </div>

          <button 
            onClick={() => setCurrentFeedback(null)}
            className="mt-8 text-slate-500 text-sm font-bold hover:text-white transition-colors"
          >
            Dismiss Transmission
          </button>
        </div>
      )}

      {entries.length > 0 && (
        <section className="space-y-6 pt-10">
          <h3 className="text-xl font-bold text-slate-300 flex items-center gap-3">
            <i className="fa-solid fa-clock-rotate-left text-indigo-500"></i> Past Reflections
          </h3>
          <div className="space-y-4">
            {entries.map((entry) => (
              <div key={entry.id} className="bg-white/5 border border-white/5 rounded-2xl p-6 hover:bg-white/10 transition-colors backdrop-blur-sm">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{entry.date}</p>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => entry.aiFeedback && handleListen(entry.aiFeedback)}
                      className="text-slate-600 hover:text-indigo-400 transition-colors"
                    >
                      <i className="fa-solid fa-volume-low text-lg"></i>
                    </button>
                    <span className="text-[10px] bg-white/5 px-3 py-1 rounded-full text-slate-400 border border-white/10 font-bold uppercase tracking-wider">{entry.mood}</span>
                  </div>
                </div>
                <p className="text-slate-400 whitespace-pre-wrap mb-4 line-clamp-3 italic">"{entry.content}"</p>
                {entry.aiFeedback && (
                  <div className="bg-black/20 p-4 rounded-xl text-sm text-slate-300 border border-white/5 leading-relaxed">
                    <span className="font-bold text-indigo-400 block mb-1 uppercase text-[10px] tracking-widest">Oracle Summary:</span>
                    {entry.aiFeedback}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ReflectionJournal;
