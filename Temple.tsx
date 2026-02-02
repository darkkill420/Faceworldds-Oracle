
import React, { useState, useRef, useEffect } from 'react';
import { UserStats, Badge, AstroProfile } from '../types';
import { geminiService } from '../services/geminiService';

interface TempleProps {
  stats: UserStats;
  astroProfile: AstroProfile;
  onUpdateStats: (newStats: Partial<UserStats>) => void;
}

const Temple: React.FC<TempleProps> = ({ stats, astroProfile, onUpdateStats }) => {
  const [activeTab, setActiveTab] = useState<'avatar' | 'affirmations' | 'sounds' | 'guide' | 'synastry'>('avatar');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [scUrl, setScUrl] = useState(stats.creatorLinks?.soundcloud || 'https://soundcloud.com/user-145909547/sets/vibe-tribe?utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing');
  
  // Guide State
  const [guideSign, setGuideSign] = useState<string>('');
  const [guideData, setGuideData] = useState<string | null>(null);
  const [guideLoading, setGuideLoading] = useState(false);

  // Synastry State
  const [compSign1, setCompSign1] = useState<string>(astroProfile.sunSign || '');
  const [compSign2, setCompSign2] = useState<string>('');
  const [compData, setCompData] = useState<string | null>(null);
  const [compLoading, setCompLoading] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);

  const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];

  const handleFetchGuide = async (sign: string) => {
    setGuideSign(sign);
    setGuideLoading(true);
    try {
      const data = await geminiService.generateZodiacEducation(sign);
      setGuideData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setGuideLoading(false);
    }
  };

  const handleUpdateSoundCloud = () => {
    onUpdateStats({
      creatorLinks: {
        ...stats.creatorLinks,
        soundcloud: scUrl
      }
    });
  };

  const handleCheckCompatibility = async () => {
    if (!compSign1 || !compSign2) return;
    setCompLoading(true);
    try {
      const data = await geminiService.generateCompatibility(compSign1, compSign2);
      setCompData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCompLoading(false);
    }
  };

  const handlePlayAffirmations = async () => {
    if (isSynthesizing) return;
    setIsSynthesizing(true);
    try {
      const text = await geminiService.generateAffirmation(astroProfile);
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const audioData = await geminiService.synthesize(text || "I am aligned with the stars.");
      if (audioData) {
        const buffer = await geminiService.decodeAudioData(geminiService.decodeBase64(audioData), audioCtxRef.current);
        const source = audioCtxRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtxRef.current.destination);
        source.onended = () => setIsSynthesizing(false);
        source.start();
      }
    } catch (err) {
      setIsSynthesizing(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-1000 pb-20">
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-white mb-2">The Celestial Temple</h2>
          <p className="text-slate-500">A sanctuary for spirit, growth, and cosmic knowledge.</p>
        </div>
        <div className="bg-slate-900 p-1 rounded-xl flex flex-wrap border border-slate-800 gap-1">
           {['avatar', 'guide', 'synastry', 'affirmations', 'sounds'].map((tab) => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab as any)}
               className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
             >
               {tab}
             </button>
           ))}
        </div>
      </section>

      {activeTab === 'avatar' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-10 text-[180px]"><i className="fa-solid fa-user-astronaut"></i></div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-40 h-40 bg-indigo-600/20 rounded-full flex items-center justify-center border-4 border-indigo-500/30 mb-6 shadow-2xl shadow-indigo-500/20 animate-float">
                 <i className="fa-solid fa-shuttle-space text-6xl text-indigo-400"></i>
              </div>
              <h3 className="text-2xl font-serif font-bold text-white">Avatar of Growth</h3>
              <p className="text-indigo-400 font-bold uppercase tracking-widest text-[10px] mt-1">Level {stats.level} Cosmic Entity</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sounds' && (
        <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 p-12 max-w-2xl mx-auto shadow-2xl text-center">
           <i className="fa-brands fa-soundcloud text-6xl text-orange-500 mb-6"></i>
           <h3 className="text-2xl font-serif font-bold text-white mb-4">Constant Vibe</h3>
           <p className="text-slate-400 mb-8">Paste a SoundCloud track or playlist URL to set the frequency of your sanctuary.</p>
           <div className="flex flex-col gap-4">
             <input 
               type="text" 
               value={scUrl}
               onChange={(e) => setScUrl(e.target.value)}
               placeholder="https://soundcloud.com/..."
               className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-indigo-600 outline-none"
             />
             <button 
               onClick={handleUpdateSoundCloud}
               className="bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl"
             >
               Lock Frequency
             </button>
           </div>
        </div>
      )}

      {activeTab === 'guide' && (
        <div className="space-y-8 animate-in fade-in duration-500">
           <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
             {signs.map(sign => (
               <button 
                key={sign}
                onClick={() => handleFetchGuide(sign)}
                className={`p-3 rounded-2xl border transition-all text-center group ${guideSign === sign ? 'bg-indigo-600 border-indigo-400 scale-105 shadow-xl' : 'bg-slate-900 border-slate-800 hover:border-indigo-500'}`}
               >
                 <div className="text-xl mb-1 group-hover:animate-bounce"><i className={`fa-solid fa-zodiac-${sign.toLowerCase()}`}></i></div>
                 <p className={`text-[9px] font-bold uppercase tracking-widest ${guideSign === sign ? 'text-white' : 'text-slate-400'}`}>{sign}</p>
               </button>
             ))}
           </div>

           {guideLoading && (
             <div className="py-20 text-center animate-pulse space-y-4">
                <i className="fa-solid fa-book-sparkles text-5xl text-indigo-500"></i>
                <p className="text-slate-500 italic">Consulting the Cosmic Library...</p>
             </div>
           )}

           {guideData && !guideLoading && (
             <div className="bg-slate-900 border border-white/5 rounded-3xl p-8 md:p-12 shadow-2xl animate-in slide-in-from-bottom duration-500">
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white text-3xl shadow-lg">
                    <i className={`fa-solid fa-zodiac-${guideSign.toLowerCase()}`}></i>
                  </div>
                  <h3 className="text-3xl font-serif font-bold text-white">The Path of {guideSign}</h3>
                </div>
                <div className="prose prose-invert prose-indigo max-w-none text-slate-300 space-y-6">
                   {guideData.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                </div>
             </div>
           )}
        </div>
      )}

      {activeTab === 'synastry' && (
        <div className="space-y-8 animate-in fade-in duration-500">
           <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl backdrop-blur-md">
              <h3 className="text-2xl font-serif font-bold text-white mb-8 text-center">Zodiac Synastry</h3>
              
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 mb-10">
                {/* Sign 1 */}
                <div className="flex flex-col items-center gap-4">
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sign I</p>
                   <select 
                    value={compSign1}
                    onChange={(e) => setCompSign1(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-indigo-600 outline-none w-48 text-center font-bold"
                   >
                     <option value="">Select Sign</option>
                     {signs.map(s => <option key={s} value={s}>{s}</option>)}
                   </select>
                   {compSign1 && <i className={`fa-solid fa-zodiac-${compSign1.toLowerCase()} text-4xl text-indigo-400 mt-2`}></i>}
                </div>

                <div className="text-indigo-500/30 text-4xl hidden md:block">
                  <i className="fa-solid fa-link"></i>
                </div>
                <div className="text-indigo-500/30 text-4xl md:hidden">
                  <i className="fa-solid fa-link rotate-90"></i>
                </div>

                {/* Sign 2 */}
                <div className="flex flex-col items-center gap-4">
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sign II</p>
                   <select 
                    value={compSign2}
                    onChange={(e) => setCompSign2(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-indigo-600 outline-none w-48 text-center font-bold"
                   >
                     <option value="">Select Sign</option>
                     {signs.map(s => <option key={s} value={s}>{s}</option>)}
                   </select>
                   {compSign2 && <i className={`fa-solid fa-zodiac-${compSign2.toLowerCase()} text-4xl text-rose-400 mt-2`}></i>}
                </div>
              </div>

              <div className="flex justify-center">
                <button 
                  onClick={handleCheckCompatibility}
                  disabled={!compSign1 || !compSign2 || compLoading}
                  className="px-12 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-3"
                >
                  {compLoading ? (
                    <>
                      <i className="fa-solid fa-spinner animate-spin"></i>
                      Aligning Frequencies...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-heart-pulse"></i>
                      Analyze Compatibility
                    </>
                  )}
                </button>
              </div>
           </div>

           {compData && !compLoading && (
              <div className="bg-slate-900 border border-indigo-500/20 rounded-[2.5rem] p-8 md:p-12 shadow-2xl animate-in slide-in-from-bottom duration-500">
                 <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-8">
                    <h4 className="text-2xl font-serif font-bold text-white">Analysis: {compSign1} & {compSign2}</h4>
                    <div className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 rounded-xl border border-indigo-500/30">
                      <i className="fa-solid fa-star text-amber-400"></i>
                      <span className="text-xs font-bold text-indigo-300">Cosmic Link Verified</span>
                    </div>
                 </div>
                 <div className="prose prose-invert prose-indigo max-w-none text-slate-300 space-y-6">
                    {compData.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                 </div>
              </div>
           )}
        </div>
      )}
      
      {activeTab === 'affirmations' && (
        <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 p-12 text-center max-w-2xl mx-auto shadow-2xl">
          <i className="fa-solid fa-microphone-lines text-6xl text-indigo-500 mb-6"></i>
          <h3 className="text-2xl font-serif font-bold text-white mb-4">Voice Affirmations</h3>
          <p className="text-slate-400 mb-8">Receive a unique affirmation tailored to your cosmic identity.</p>
          <button 
            onClick={handlePlayAffirmations}
            disabled={isSynthesizing}
            className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all disabled:opacity-50"
          >
            {isSynthesizing ? 'Chanting...' : 'Listen to Oracle'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Temple;
