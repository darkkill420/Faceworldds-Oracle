
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { TranscriptionItem, AstroProfile } from '../types';
import { geminiService } from '../services/geminiService';

interface GrowthCoachProps {
  astroProfile?: AstroProfile;
  onOracleChat?: () => void;
}

const GrowthCoach: React.FC<GrowthCoachProps> = ({ astroProfile, onOracleChat }) => {
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'voice' | 'text'>('voice');
  const [inputText, setInputText] = useState('');
  const [transcriptions, setTranscriptions] = useState<TranscriptionItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessingText, setIsProcessingText] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  
  const sessionRef = useRef<any>(null);
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);
  const currentTranscriptionRef = useRef({ user: '', model: '' });
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcriptions]);

  const astroContext = astroProfile?.sunSign 
    ? `The seeker is a ${astroProfile.sunSign} Sun, ${astroProfile.moonSign} Moon, and ${astroProfile.risingSign} Rising. Use these archetypes to guide them.`
    : "The seeker is on a path to self-discovery.";

  const systemInstruction = `You are Faceworldd, the Cosmic Oracle. You help seekers find clarity through compassionate inquiry and astrological wisdom. ${astroContext} Keep responses supportive, brief, and insightful. Encourage radical self-awareness. Speak like a wise elder from the stars.`;

  // Local helper for decoding audio data following guidelines
  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  // Local helper for encoding audio blob following guidelines
  const createBlob = (data: Float32Array) => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    const bytes = new Uint8Array(int16.buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return {
      data: btoa(binary),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioContextInRef.current) audioContextInRef.current.close();
    if (audioContextOutRef.current) audioContextOutRef.current.close();
    
    setIsActive(false);
  };

  const startSession = async () => {
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtxIn = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const audioCtxOut = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextInRef.current = audioCtxIn;
      audioContextOutRef.current = audioCtxOut;
      
      const outputNode = audioCtxOut.createGain();
      outputNode.connect(audioCtxOut.destination);

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = audioCtxIn.createMediaStreamSource(stream);
            const scriptProcessor = audioCtxIn.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioCtxIn.destination);
          },
          onmessage: async (message) => {
            if (message.serverContent?.outputTranscription) {
              currentTranscriptionRef.current.model += message.serverContent.outputTranscription.text;
            } else if (message.serverContent?.inputTranscription) {
              currentTranscriptionRef.current.user += message.serverContent.inputTranscription.text;
            }

            if (message.serverContent?.turnComplete) {
              const { user, model } = currentTranscriptionRef.current;
              if (user || model) {
                setTranscriptions(prev => [...prev, { text: user, sender: 'user' }, { text: model, sender: 'model' }]);
                if (onOracleChat) onOracleChat();
              }
              currentTranscriptionRef.current = { user: '', model: '' };
            }

            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioCtxOut.currentTime);
              const buffer = await decodeAudioData(geminiService.decodeBase64(audioData), audioCtxOut, 24000, 1);
              const source = audioCtxOut.createBufferSource();
              source.buffer = buffer;
              source.connect(outputNode);
              source.addEventListener('ended', () => sourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => setError("Celestial connection interrupted."),
          onclose: () => setIsActive(false),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: systemInstruction,
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        },
      });

      sessionRef.current = await sessionPromise;
      setIsActive(true);
    } catch (err: any) {
      setError(err.message || "Failed to initiate celestial connection.");
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isProcessingText) return;
    const userMsg = inputText.trim();
    setInputText('');
    setTranscriptions(prev => [...prev, { text: userMsg, sender: 'user' }]);
    setIsProcessingText(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: {
          systemInstruction: systemInstruction + " Keep responses brief and poetic."
        }
      });
      
      const modelText = response.text || "The stars are shifting, please repeat.";
      setTranscriptions(prev => [...prev, { text: modelText, sender: 'model' }]);
      if (onOracleChat) onOracleChat();
      // No longer auto-calling synthesize here to respect user preference for triggered voice
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingText(false);
    }
  };

  const replayMessage = async (text: string) => {
    if (isSynthesizing) return;
    setIsSynthesizing(true);
    try {
      if (!audioContextOutRef.current) {
        audioContextOutRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const audioData = await geminiService.synthesize(text);
      if (audioData) {
        const buffer = await geminiService.decodeAudioData(geminiService.decodeBase64(audioData), audioContextOutRef.current);
        const source = audioContextOutRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextOutRef.current.destination);
        source.onended = () => setIsSynthesizing(false);
        source.start();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-1000">
      <section className="text-center">
        <h2 className="text-3xl font-serif font-bold text-white mb-2">The Oracle</h2>
        <div className="flex justify-center mt-4">
          <div className="bg-slate-900 p-1 rounded-full flex gap-1 border border-slate-800 shadow-xl">
            <button 
              onClick={() => { stopSession(); setMode('voice'); }}
              className={`px-8 py-2.5 rounded-full text-sm font-bold transition-all ${mode === 'voice' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <i className="fa-solid fa-microphone mr-2"></i> Voice Session
            </button>
            <button 
              onClick={() => { stopSession(); setMode('text'); }}
              className={`px-8 py-2.5 rounded-full text-sm font-bold transition-all ${mode === 'text' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <i className="fa-solid fa-keyboard mr-2"></i> Text Transmission
            </button>
          </div>
        </div>
      </section>

      <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-800 flex flex-col min-h-[550px] overflow-hidden relative">
        {mode === 'voice' ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-10">
            {isActive ? (
              <>
                <div className="relative">
                  <div className="w-40 h-40 bg-indigo-900/20 rounded-full flex items-center justify-center animate-pulse">
                    <div className="w-32 h-32 bg-indigo-600 rounded-full flex items-center justify-center text-white text-4xl shadow-2xl shadow-indigo-500/50">
                      <i className="fa-solid fa-microphone"></i>
                    </div>
                  </div>
                  <div className="absolute inset-0 w-40 h-40 rounded-full border-2 border-indigo-500/30 animate-ping opacity-25"></div>
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-serif font-bold text-white">The Oracle is Listening</h3>
                  <p className="text-indigo-400 mt-2 font-medium tracking-wide">Voice Responses are Automated in Live Session</p>
                </div>
                <div className="w-full max-h-48 overflow-y-auto space-y-4 px-6 custom-scrollbar">
                   {transcriptions.slice(-4).map((t, idx) => (
                     <div key={idx} className={`flex ${t.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                       <div className={`max-w-[85%] px-5 py-2.5 rounded-2xl text-sm border ${t.sender === 'user' ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-indigo-950/50 text-indigo-300 border-indigo-500/20'}`}>
                         {t.text}
                       </div>
                     </div>
                   ))}
                </div>
                <button onClick={stopSession} className="px-10 py-3.5 bg-rose-950/30 text-rose-400 font-bold rounded-full border border-rose-900/50 hover:bg-rose-900/50 transition-all">Sever Connection</button>
              </>
            ) : (
              <div className="text-center space-y-8">
                <div className="w-28 h-28 bg-slate-950 rounded-full flex items-center justify-center mx-auto text-indigo-500 shadow-inner border border-slate-800">
                  <i className="fa-solid fa-waveform text-5xl"></i>
                </div>
                <div className="max-w-sm">
                  <p className="text-slate-400 text-lg leading-relaxed italic mb-8">"Speak, and the cosmos shall answer through the Oracle's voice."</p>
                  <button onClick={startSession} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-xl hover:bg-indigo-700 shadow-2xl shadow-indigo-500/30 transition-all active:scale-95 flex items-center justify-center gap-4">
                    <i className="fa-solid fa-sparkles"></i> Open the Portal
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-[650px]">
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-slate-950/20">
              {transcriptions.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-40">
                  <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                    <i className="fa-solid fa-comments text-4xl text-slate-500"></i>
                  </div>
                  <p className="text-lg">Share a thought to receive a cosmic transmission.<br/>Engage the voice manually when ready.</p>
                </div>
              )}
              {transcriptions.map((t, idx) => (
                <div key={idx} className={`flex ${t.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4`}>
                  <div className={`group relative max-w-[85%] px-6 py-4 rounded-3xl shadow-lg border ${
                    t.sender === 'user' ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-500/20'
                  }`}>
                    {t.text}
                    {t.sender === 'model' && (
                      <button 
                        onClick={() => replayMessage(t.text)}
                        className="absolute -right-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-indigo-400 hover:text-indigo-300 transition-all p-2"
                        title="Hear Transmission"
                      >
                        <i className={`fa-solid ${isSynthesizing ? 'fa-spinner animate-spin' : 'fa-volume-high'} text-xl`}></i>
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {isProcessingText && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 border border-slate-700 px-6 py-4 rounded-3xl flex gap-1.5 items-center">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-150"></span>
                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce delay-300"></span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            
            <div className="p-8 bg-slate-900 border-t border-slate-800">
              <div className="relative flex gap-3">
                <input 
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={`Seek guidance, ${astroProfile?.sunSign || 'traveler'}...`}
                  className="flex-1 px-6 py-5 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:ring-2 focus:ring-indigo-600 outline-none pr-16 transition-all"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || isProcessingText}
                  className="absolute right-2 top-2 bottom-2 w-14 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-all shadow-lg disabled:opacity-50"
                >
                  <i className="fa-solid fa-shuttle-space"></i>
                </button>
              </div>
              <p className="mt-4 text-[10px] text-center text-slate-500 uppercase tracking-widest font-bold">Voice Synthesis on request</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GrowthCoach;
