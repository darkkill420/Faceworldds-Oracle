
import React, { useState, useEffect } from 'react';
import { CosmicMarker, UserStats } from '../types';

interface PulseProps {
  markers: CosmicMarker[];
  setMarkers: React.Dispatch<React.SetStateAction<CosmicMarker[]>>;
  stats: UserStats;
}

const Pulse: React.FC<PulseProps> = ({ markers, setMarkers, stats }) => {
  const [now, setNow] = useState(Date.now());
  const [newLabel, setNewLabel] = useState('');
  const [newTimestamp, setNewTimestamp] = useState('');
  const [newType, setNewType] = useState<'count-up' | 'count-down'>('count-up');

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const addMarker = () => {
    if (!newLabel || !newTimestamp) return;
    const marker: CosmicMarker = {
      id: Date.now().toString(),
      label: newLabel,
      timestamp: new Date(newTimestamp).getTime(),
      type: newType
    };
    setMarkers([...markers, marker]);
    setNewLabel('');
    setNewTimestamp('');
  };

  const removeMarker = (id: string) => {
    setMarkers(markers.filter(m => m.id !== id));
  };

  const formatTime = (diff: number) => {
    const absDiff = Math.abs(diff);
    const seconds = Math.floor((absDiff / 1000) % 60);
    const minutes = Math.floor((absDiff / (1000 * 60)) % 60);
    const hours = Math.floor((absDiff / (1000 * 60 * 60)) % 24);
    const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));

    return {
      days,
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0')
    };
  };

  const daysSinceJoin = Math.floor((Date.now() - stats.firstOpened) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <section>
        <h2 className="text-3xl font-serif font-bold text-white mb-2">Sanctuary Pulse</h2>
        <p className="text-slate-500">Track your markers in time and analyze your cosmic impact.</p>
      </section>

      {/* Meta Analysis Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { label: 'Days in Sanctuary', value: daysSinceJoin, icon: 'fa-calendar-day', color: 'text-indigo-400' },
          { label: 'Growth Sessions', value: stats.oracleInteractions, icon: 'fa-moon', color: 'text-purple-400' },
          { label: 'Star Logs Written', value: stats.journalEntries, icon: 'fa-book-sparkles', color: 'text-amber-400' },
          { label: 'Destinies Created', value: stats.visionCreations, icon: 'fa-meteor', color: 'text-emerald-400' },
          { label: 'Utilized Time', value: `${Math.floor(stats.totalActiveMinutes / 60)}h ${stats.totalActiveMinutes % 60}m`, icon: 'fa-clock', color: 'text-sky-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-lg flex items-center gap-5">
            <div className={`w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700 ${stat.color}`}>
              <i className={`fa-solid ${stat.icon} text-xl`}></i>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Timers Section */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-4 w-full md:max-w-md">
            <h3 className="text-xl font-bold text-slate-300 flex items-center gap-2">
              <i className="fa-solid fa-stopwatch text-indigo-400"></i> Cosmic Markers
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <input 
                type="text" 
                placeholder="Marker Label (e.g. Sobriety Date)" 
                className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
              />
              <div className="flex gap-2">
                <input 
                  type="datetime-local" 
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                  value={newTimestamp}
                  onChange={e => setNewTimestamp(e.target.value)}
                />
                <select 
                  className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                  value={newType}
                  onChange={e => setNewType(e.target.value as any)}
                >
                  <option value="count-up">Since</option>
                  <option value="count-down">Until</option>
                </select>
              </div>
              <button 
                onClick={addMarker}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/10"
              >
                Create Marker
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {markers.map(marker => {
            const time = formatTime(now - marker.timestamp);
            const isPast = now > marker.timestamp;
            return (
              <div key={marker.id} className="bg-gradient-to-br from-slate-900 to-indigo-900/10 border border-indigo-500/20 rounded-[2rem] p-8 relative group shadow-xl">
                <button 
                  onClick={() => removeMarker(marker.id)}
                  className="absolute top-6 right-6 text-slate-600 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <i className="fa-solid fa-trash-can"></i>
                </button>
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] mb-4">
                  {marker.type === 'count-up' ? 'Time In Continuum' : 'Approaching Alignment'}
                </p>
                <h4 className="text-xl font-bold text-white mb-6 font-serif">{marker.label}</h4>
                
                <div className="flex justify-between items-center text-center">
                  {[
                    { val: time.days, label: 'Days' },
                    { val: time.hours, label: 'Hrs' },
                    { val: time.minutes, label: 'Min' },
                    { val: time.seconds, label: 'Sec' }
                  ].map((unit, i) => (
                    <div key={i} className="space-y-1">
                      <p className="text-3xl font-mono font-bold text-white tabular-nums">{unit.val}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest">{unit.label}</p>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Base Date</p>
                  <p className="text-xs text-slate-400 font-mono">{new Date(marker.timestamp).toLocaleString()}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Pulse;
