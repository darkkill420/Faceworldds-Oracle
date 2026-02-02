
import React, { useState } from 'react';
import { geminiService } from '../services/geminiService';
import { AstroProfile } from '../types';

interface VisionBoardProps {
  astroProfile?: AstroProfile;
  onVisionCreated?: () => void;
}

const VisionBoard: React.FC<VisionBoardProps> = ({ astroProfile, onVisionCreated }) => {
  const [prompt, setPrompt] = useState('');
  const [editPrompt, setEditPrompt] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const img = await geminiService.generateVisionImage(prompt, astroProfile);
      setImage(img);
      setPrompt('');
      if (onVisionCreated) onVisionCreated();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!image || !editPrompt.trim()) return;
    setEditing(true);
    try {
      const base64 = image.split(',')[1];
      const updatedImg = await geminiService.editVisionImage(base64, editPrompt);
      if (updatedImg) setImage(updatedImg);
      setEditPrompt('');
    } catch (err) {
      console.error(err);
    } finally {
      setEditing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      <section>
        <h2 className="text-3xl font-serif font-bold text-white mb-2">Visual Destiny</h2>
        <p className="text-slate-500">Manifest your cosmic path. Create and transform the reality you desire.</p>
      </section>

      {!image ? (
        <div className="bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-800 p-16 text-center space-y-8 shadow-2xl">
          <div className="w-24 h-24 bg-slate-950 rounded-full flex items-center justify-center mx-auto text-indigo-500 shadow-inner border border-slate-800">
            <i className="fa-solid fa-cloud-arrow-up text-4xl"></i>
          </div>
          <div className="max-w-md mx-auto space-y-6">
            <p className="text-slate-400 text-lg italic">"A vision captured is a future manifest."</p>
            <div className="flex flex-col gap-4">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your highest timeline..."
                className="w-full px-6 py-4 bg-slate-950 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-white"
              />
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50"
              >
                {loading ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Create Destiny'}
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-[0.3em] text-slate-500"><span className="bg-slate-900 px-4">OR SHARE AN IMAGE</span></div>
            </div>
            <label className="inline-block cursor-pointer bg-slate-800 hover:bg-slate-700 text-white font-bold px-10 py-4 rounded-2xl transition-all border border-slate-700 shadow-lg">
              Upload Cosmic Insight
              <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
            </label>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="bg-slate-900 p-6 rounded-[2.5rem] shadow-2xl border border-slate-800 group relative">
            <img src={image} alt="Vision" className="w-full rounded-3xl max-h-[700px] object-contain bg-slate-950 shadow-inner" />
            <button 
              onClick={() => setImage(null)}
              className="absolute top-10 right-10 w-12 h-12 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full shadow-2xl backdrop-blur flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 border border-slate-700"
            >
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
          </div>

          <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-3xl p-8 text-white shadow-2xl backdrop-blur-sm">
            <h4 className="font-bold text-xl mb-6 flex items-center gap-3">
              <i className="fa-solid fa-wand-magic-sparkles text-indigo-400"></i> Transform Reality
            </h4>
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                placeholder="e.g. 'Add more celestial lights', 'Make it feel like a dream', 'Shift the aura to gold'..."
                className="flex-1 px-6 py-4 bg-slate-950/50 border border-indigo-500/30 rounded-2xl focus:ring-2 focus:ring-indigo-400 outline-none placeholder:text-slate-600 text-white"
              />
              <button
                onClick={handleEdit}
                disabled={editing || !editPrompt}
                className="bg-white text-indigo-950 px-10 py-4 rounded-2xl font-bold hover:bg-indigo-50 transition-all disabled:opacity-50 shadow-xl"
              >
                {editing ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Apply Shift'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisionBoard;
