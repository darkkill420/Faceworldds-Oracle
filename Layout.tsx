
import React from 'react';
import { AppView, AstroProfile, UserStats } from '../types';

interface LayoutProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  astroProfile: AstroProfile;
  stats: UserStats;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ currentView, setView, astroProfile, stats, children }) => {
  const navItems = [
    { id: AppView.DASHBOARD, label: 'Cosmos', icon: 'fa-sun' },
    { id: AppView.TEMPLE, label: 'Temple', icon: 'fa-fort-awesome' },
    { id: AppView.JOURNAL, label: 'Star Log', icon: 'fa-book-sparkles' },
    { id: AppView.COACH, label: 'Oracle', icon: 'fa-moon' },
    { id: AppView.VISION_BOARD, label: 'Destiny', icon: 'fa-meteor' },
    { id: AppView.PULSE, label: 'Pulse', icon: 'fa-heart-pulse' },
  ];

  const getTheme = (sign: string) => {
    const s = (sign || 'pisces').toLowerCase();
    switch (s) {
      case 'aries': return { bg: 'from-red-950 to-black', accent: 'text-red-400', border: 'border-red-500/30', btn: 'bg-red-600' };
      case 'taurus': return { bg: 'from-emerald-950 to-black', accent: 'text-emerald-400', border: 'border-emerald-500/30', btn: 'bg-emerald-600' };
      case 'gemini': return { bg: 'from-amber-900 to-black', accent: 'text-amber-400', border: 'border-amber-500/30', btn: 'bg-amber-500' };
      case 'cancer': return { bg: 'from-slate-800 to-black', accent: 'text-slate-200', border: 'border-slate-400/30', btn: 'bg-slate-600' };
      case 'leo': return { bg: 'from-orange-800 to-black', accent: 'text-yellow-400', border: 'border-yellow-500/30', btn: 'bg-orange-600' };
      case 'virgo': return { bg: 'from-stone-900 to-black', accent: 'text-stone-300', border: 'border-stone-500/30', btn: 'bg-stone-600' };
      case 'libra': return { bg: 'from-rose-950 to-black', accent: 'text-pink-300', border: 'border-pink-500/30', btn: 'bg-rose-600' };
      case 'scorpio': return { bg: 'from-purple-950 to-black', accent: 'text-purple-400', border: 'border-purple-500/30', btn: 'bg-purple-700' };
      case 'sagittarius': return { bg: 'from-indigo-900 to-black', accent: 'text-indigo-400', border: 'border-indigo-500/30', btn: 'bg-indigo-600' };
      case 'capricorn': return { bg: 'from-gray-900 to-black', accent: 'text-gray-400', border: 'border-gray-500/30', btn: 'bg-gray-700' };
      case 'aquarius': return { bg: 'from-cyan-900 to-black', accent: 'text-cyan-400', border: 'border-cyan-500/30', btn: 'bg-cyan-600' };
      case 'pisces': return { bg: 'from-teal-900 to-black', accent: 'text-teal-300', border: 'border-teal-500/30', btn: 'bg-teal-600' };
      default: return { bg: 'from-slate-950 to-black', accent: 'text-indigo-400', border: 'border-indigo-500/30', btn: 'bg-indigo-600' };
    }
  };

  const theme = getTheme(astroProfile.sunSign);

  const getSoundCloudEmbedUrl = (url?: string) => {
    if (!url) return null;
    return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%234f46e5&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`;
  };

  const activeSoundCloud = getSoundCloudEmbedUrl(stats.creatorLinks?.soundcloud);

  return (
    <div className={`min-h-screen flex flex-col md:flex-row bg-black bg-gradient-to-br ${theme.bg} text-slate-100 transition-all duration-1000 overflow-hidden`}>
      {/* Persistent Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-black/40 backdrop-blur-2xl border-r border-white/5 p-6 h-screen overflow-hidden">
        <div className="flex items-center gap-3 mb-8">
          <div className={`w-10 h-10 rounded-xl ${theme.btn} flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-500/20`}>
            <i className="fa-solid fa-shuttle-space"></i>
          </div>
          <h1 className="text-2xl font-bold tracking-tight font-serif text-white">Faceworldd</h1>
        </div>

        {/* User Profile Brief */}
        <div className="mb-8 p-4 rounded-2xl bg-white/5 border border-white/5">
           <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs text-indigo-400 border border-indigo-500/30">
                <i className="fa-solid fa-user-astronomer"></i>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Cosmic Identity</p>
                <p className="text-xs font-bold text-white mt-1">
                  {astroProfile.sunSign ? `${astroProfile.sunSign} Sun` : 'Identity Unset'}
                </p>
              </div>
           </div>
           <button 
             onClick={() => setView(AppView.DASHBOARD)} 
             className="w-full py-1.5 text-[10px] font-bold text-indigo-400 hover:text-white border border-indigo-500/20 hover:border-indigo-500 rounded-lg transition-all uppercase"
           >
             Refine Natal Chart
           </button>
        </div>

        <nav className="space-y-1 mb-8">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                currentView === item.id
                  ? `bg-white/10 ${theme.accent} font-semibold border ${theme.border}`
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <i className={`fa-solid ${item.icon} w-6`}></i>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* PERSISTENT GLOBAL FREQUENCY PLAYER */}
        <div className="mt-auto pt-6 border-t border-white/5">
          {activeSoundCloud ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                  <i className="fa-solid fa-waveform animate-pulse"></i> Constant Vibe
                </p>
                <i className="fa-brands fa-soundcloud text-orange-500"></i>
              </div>
              <div className="rounded-xl overflow-hidden border border-white/10 shadow-2xl h-24 bg-black">
                <iframe 
                  width="100%" 
                  height="96" 
                  scrolling="no" 
                  frameBorder="no" 
                  allow="autoplay" 
                  src={activeSoundCloud}
                ></iframe>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-white/5 border border-dashed border-white/10 text-center">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">No Frequency Set</p>
              <button 
                onClick={() => setView(AppView.TEMPLE)} 
                className="text-[9px] font-bold text-indigo-400 hover:text-white transition-colors underline underline-offset-4"
              >
                Connect SoundCloud
              </button>
            </div>
          )}
          <div className="mt-4">
             <p className="text-[9px] text-slate-600 text-center uppercase tracking-[0.3em]">Sanctuary Secured</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto pb-24 md:pb-0 h-screen custom-scrollbar relative">
        <div className="max-w-5xl mx-auto p-6 md:p-12">
          {children}
        </div>
      </main>

      {/* Mobile Player & Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/5 flex flex-col z-50">
        {activeSoundCloud && (
          <div className="px-4 py-2 border-b border-white/5 bg-indigo-950/20">
             <iframe width="100%" height="60" scrolling="no" frameBorder="no" allow="autoplay" src={activeSoundCloud}></iframe>
          </div>
        )}
        <div className="flex justify-around p-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex flex-col items-center gap-1 transition-all ${
                currentView === item.id ? `${theme.accent} scale-110` : 'text-slate-500'
              }`}
            >
              <i className={`fa-solid ${item.icon} text-lg`}></i>
              <span className="text-[9px] font-bold uppercase tracking-tighter">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
