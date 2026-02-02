
import React, { useState, useEffect, useRef } from 'react';
import { geminiService } from '../services/geminiService';
import { AppView, AstroProfile, UserStats, AIPersonality } from '../types';

interface DashboardProps {
  setView: (view: AppView);
  astroProfile: AstroProfile;
  setAstroProfile: (profile: AstroProfile) => void;
  stats: UserStats;
  onCheckIn: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setView, astroProfile, setAstroProfile, stats, onCheckIn }) => {
  const [quote, setQuote] = useState<string>('Aligning with the stars...');
  const [intention, setIntention] = useState<string>(localStorage.getItem('faceworldd_daily_intention') || '');
  const [intentionFeedback, setIntentionFeedback] = useState<string | null>(localStorage.getItem('faceworldd_intention_feedback'));
  const [loading, setLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showAstroModal, setShowAstroModal] = useState(!astroProfile.sunSign);
  const [readout, setReadout] = useState<string | null>(localStorage.getItem('faceworldd_readout'));
  const [isDecoding, setIsDecoding] = useState(false);
  const [isSettingIntention, setIsSettingIntention] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  
  const audioCtxRef = useRef<AudioContext | null>(null);

  const personalities: AIPersonality[] = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ];

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(!!standalone);
  }, []);

  useEffect(() => {
    const fetchInitData = async () => {
      setLoading(true);
      try {
        const q = await geminiService.generateGrowthQuote(astroProfile);
        setQuote(q || 'As above, so below.');
      } catch (err) {
        setQuote("Your growth is written in the stars, but navigated by your soul.");
      } finally {
        setLoading(false);
      }
    };
    if (astroProfile.sunSign) fetchInitData();
  }, [astroProfile.sunSign]);

  const handleSetIntention = async () => {
    if (!intention.trim()) return;
    setIsSettingIntention(true);
    localStorage.setItem('faceworldd_daily_intention', intention);
    try {
      const feedback = await geminiService.analyzeJournal(`Today my intention is: ${intention}`, astroProfile);
      setIntentionFeedback(feedback.feedback);
      localStorage.setItem('faceworldd_intention_feedback', feedback.feedback);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSettingIntention(false);
    }
  };

  const handleSaveAstro = async () => {
    if (!astroProfile.birthDate || !astroProfile.birthLocation) return;
    setIsDecoding(true);
    try {
      const decoded = await geminiService.decodeBigThree(
        astroProfile.birthDate, 
        astroProfile.birthTime || '12:00', 
        astroProfile.birthLocation
      );
      const updatedProfile = {
        ...astroProfile,
        sunSign: decoded.sunSign,
        moonSign: decoded.moonSign,
        risingSign: decoded.risingSign,
        communicationLabel: decoded.communicationLabel,
        planets: decoded.planets,
        aspects: decoded.aspects
      };
      setAstroProfile(updatedProfile);
      const fullReadout = await geminiService.generateBirthChartReadout(updatedProfile);
      setReadout(fullReadout);
      localStorage.setItem('faceworldd_readout', fullReadout);
      setShowAstroModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDecoding(false);
    }
  };

  const handleSpeak = async () => {
    if (isSpeaking || !quote) return;
    setIsSpeaking(true);
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const audioData = await geminiService.synthesize(quote);
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

  const xpPercent = (stats.experiencePoints % 100);

  return (
    <div className="space-y-12 animate-in fade-in duration-1000 pb-24">
      
      {/* PWA INSTALLATION GUIDE - ONLY SHOWS IF NOT INSTALLED */}
      {!isStandalone && (
        <div className="bg-indigo-600/10 border border-indigo-500/30 rounded-[2rem] p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 shadow-2xl backdrop-blur-xl animate-bounce-slow">
           <div className="w-16 h-16 bg-white text-indigo-900 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
             <i className="fa-solid fa-mobile-screen-button"></i>
           </div>
           <div className="flex-1 text-center md:text-left">
             <h3 className="text-xl font-serif font-bold text-white">Unlock Your Home Screen Icon</h3>
             <p className="text-sm text-slate-300 mt-1">To get the full app experience: <span className="text-indigo-400 font-bold">Tap Share</span> and then <span className="text-indigo-400 font-bold">"Add to Home Screen"</span>.</p>
           </div>
           <div className="flex gap-2">
              <div className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase">iPhone: Share &rarr; Add</div>
              <div className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-[10px] font-bold uppercase">Android: Menu &rarr; Install</div>
           </div>
        </div>
      )}

      <section className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pt-4">
        <div className="text-center md:text-left">
          <div className="flex items-center gap-4 mb-2">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-white">
              Sanctuary <span className="text-indigo-400">Lv.{stats.level}</span>
            </h2>
            <button 
              onClick={() => setShowAstroModal(true)}
              className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-xs font-bold rounded-xl border border-indigo-500/30 transition-all flex items-center gap-2"
            >
              <i className="fa-solid fa-gear"></i>
              <span className="hidden sm:inline">Refine Chart</span>
            </button>
          </div>
          <p className="text-slate-400 font-medium tracking-wide">Rank: Star Seeker • {stats.streak} Day Streak 🔥</p>
        </div>
        
        <div className="w-full lg:w-72 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Experience</span>
            <span className="text-[10px] font-bold text-indigo-400">{stats.experiencePoints} XP</span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${xpPercent}%` }}></div>
          </div>
          <button 
            onClick={onCheckIn}
            className="w-full mt-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-[10px] font-bold uppercase rounded-lg border border-indigo-500/30 transition-all"
          >
            Claim Daily Alignment (+10 XP)
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gradient-to-br from-indigo-900/40 to-black rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden group border border-indigo-500/20 backdrop-blur-md min-h-[300px] flex flex-col justify-center">
          <div className="absolute -top-10 -right-10 p-8 opacity-5 text-[200px] group-hover:scale-110 transition-transform duration-1000 rotate-12">
            <i className="fa-solid fa-moon"></i>
          </div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <p className="text-indigo-300 text-sm font-bold uppercase tracking-widest">Oracle Transmission</p>
              <button 
                onClick={handleSpeak}
                disabled={isSpeaking || loading}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  isSpeaking ? 'bg-white text-indigo-950 animate-pulse' : 'bg-indigo-600/50 text-indigo-100 hover:bg-white hover:text-indigo-950 shadow-lg'
                }`}
              >
                <i className={`fa-solid ${isSpeaking ? 'fa-volume-high' : 'fa-play'}`}></i>
              </button>
            </div>
            <p className={`text-2xl md:text-3xl font-serif italic leading-relaxed mb-8 ${loading ? 'animate-pulse' : ''}`}>
               "{quote}"
            </p>
            <button 
              onClick={() => setView(AppView.JOURNAL)}
              className="mt-4 text-xs font-bold text-indigo-400 hover:text-white transition-colors uppercase tracking-widest flex items-center gap-2"
            >
              Document Reflection <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-md flex flex-col">
          <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-4">Solar Cycle Intention</h4>
          <textarea 
            value={intention}
            onChange={(e) => setIntention(e.target.value)}
            placeholder="What will you manifest today?"
            className="w-full flex-1 bg-transparent border-none focus:ring-0 text-white placeholder:text-slate-700 resize-none font-serif italic text-lg"
          ></textarea>
          {intentionFeedback && (
            <div className="mt-4 p-4 bg-indigo-600/10 border border-indigo-500/20 rounded-xl">
               <p className="text-[9px] text-indigo-400 uppercase font-bold mb-1">Oracle Feedback</p>
               <p className="text-xs text-slate-300 italic">"{intentionFeedback}"</p>
            </div>
          )}
          <button 
            onClick={handleSetIntention}
            disabled={isSettingIntention || !intention.trim()}
            className="w-full mt-4 py-3 bg-white text-indigo-950 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-indigo-50 transition-all disabled:opacity-50"
          >
            {isSettingIntention ? 'Consulting Stars...' : 'Set Daily Intention'}
          </button>
        </div>
      </div>

      {astroProfile.sunSign && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom duration-1000">
           <div className="lg:col-span-2 space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 backdrop-blur-md">
                <h3 className="text-2xl font-serif font-bold text-white mb-6 flex items-center gap-3">
                  <i className="fa-solid fa-wand-magic-sparkles text-amber-400"></i> Your Cosmic Blueprint
                </h3>
                <div className="prose prose-invert prose-indigo max-w-none text-slate-300 leading-relaxed space-y-4 mb-10">
                  {readout?.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                </div>
              </div>
           </div>

           <div className="space-y-6">
              <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-8 backdrop-blur-md">
                <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.3em] mb-6">Planetary Placements</h4>
                <div className="space-y-4">
                  {[
                    { planet: 'Sun', sign: astroProfile.sunSign, icon: 'fa-sun' },
                    { planet: 'Moon', sign: astroProfile.moonSign, icon: 'fa-moon' },
                    { planet: 'Rising', sign: astroProfile.risingSign, icon: 'fa-arrow-up' },
                    ...(astroProfile.planets || [])
                  ].map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all group">
                       <div className="flex items-center gap-3">
                          <i className={`fa-solid ${p.planet === 'Sun' ? 'fa-sun' : p.planet === 'Moon' ? 'fa-moon' : p.planet === 'Rising' ? 'fa-arrow-up' : 'fa-circle-dot'} text-indigo-400 group-hover:scale-110 transition-transform`}></i>
                          <span className="text-xs font-bold text-slate-300">{p.planet}</span>
                       </div>
                       <span className="text-xs font-serif italic text-white">{p.sign}</span>
                    </div>
                  ))}
                </div>
              </div>
           </div>
        </div>
      )}

      {showAstroModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-2xl p-8 shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-serif font-bold text-white">Refine Cosmic Profile</h3>
                <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Configure your birth data to discover your full chart</p>
              </div>
              {!isDecoding && (
                <button onClick={() => setShowAstroModal(false)} className="text-slate-500 hover:text-white p-2">
                  <i className="fa-solid fa-xmark text-xl"></i>
                </button>
              )}
            </div>
            
            <div className="space-y-8">
              <div className="bg-black/20 p-6 rounded-2xl border border-white/5 space-y-6">
                <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                   <i className="fa-solid fa-dna"></i> 1. Birth Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Exact Birth Date</label>
                    <input type="date" value={astroProfile.birthDate || ''} onChange={e => setAstroProfile({...astroProfile, birthDate: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-indigo-600 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Exact Birth Time</label>
                    <input type="time" value={astroProfile.birthTime || ''} onChange={e => setAstroProfile({...astroProfile, birthTime: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-indigo-600 outline-none" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Birth Location (City, Country)</label>
                    <input type="text" placeholder="e.g. London, UK" value={astroProfile.birthLocation || ''} onChange={e => setAstroProfile({...astroProfile, birthLocation: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-1 focus:ring-indigo-600 outline-none" />
                  </div>
                </div>
              </div>

              <div className="bg-black/20 p-6 rounded-2xl border border-white/5 space-y-6">
                <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                   <i className="fa-solid fa-brain"></i> 2. Oracle Persona
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {personalities.map(p => (
                    <button 
                      key={p} 
                      onClick={() => setAstroProfile({...astroProfile, aiPersonality: p})}
                      className={`px-3 py-2.5 rounded-xl text-[10px] font-bold border transition-all ${
                        astroProfile.aiPersonality === p ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <button 
                  onClick={handleSaveAstro}
                  disabled={!astroProfile.birthDate || !astroProfile.birthLocation || isDecoding}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all shadow-xl shadow-indigo-500/20 text-lg flex items-center justify-center gap-3"
                >
                  {isDecoding ? <><i className="fa-solid fa-spinner animate-spin"></i> Consulting the Ephemeris...</> : 'Sync Cosmic Blueprint'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
