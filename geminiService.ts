
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AstroProfile, AIPersonality, UserStats } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  private getPersonaStyle(personality?: AIPersonality): string {
    const styles: Record<string, string> = {
      'Aries': "The Blunt Initiator: Direct, fast, zero filter.",
      'Taurus': "The Steady Soother: Calm, measured, practical.",
      'Gemini': "The Freestyle Chatter: Quick, witty, tangent-prone.",
      'Cancer': "The Emotional Translator: Soft, caring, feeling-first.",
      'Leo': "The Story Performer: Dramatic, warm, magnetic.",
      'Virgo': "The Detail Editor: Precise, thoughtful, practical.",
      'Libra': "The Smooth Diplomat: Polite, balancing, charming.",
      'Scorpio': "The Intense Decoder: Deep, probing, private.",
      'Sagittarius': "The Truth Teller: Honest, blunt-humorous, big-picture.",
      'Capricorn': "The Executive Speaker: Structured, serious, goal-focused.",
      'Aquarius': "The Signal Booster: Abstract, future-thinking, quirky.",
      'Pisces': "The Dream Poet: Soft, metaphorical, intuitive."
    };
    return styles[personality || 'Pisces'] || styles['Pisces'];
  }

  private getAstroContext(astro?: AstroProfile) {
    if (!astro || !astro.sunSign) return "The user is seeking self-awareness and growth.";
    const persona = this.getPersonaStyle(astro.aiPersonality);
    return `The user is a ${astro.sunSign} Sun, ${astro.moonSign} Moon, ${astro.risingSign} Rising. Born: ${astro.birthDate} ${astro.birthTime} in ${astro.birthLocation}. 
    YOU ARE AN INTUITIVE ASTROLOGER & GROWTH COACH. STYLE: ${persona}.`;
  }

  async decodeBigThree(birthDate: string, birthTime: string, birthLocation: string) {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Calculate the natal chart for someone born on ${birthDate} at ${birthTime} in ${birthLocation}. 
      Return structured JSON including Big 3, planet positions (Mercury, Venus, Mars, Jupiter, Saturn), and 3 major aspects. 
      If exact calculation is impossible, provide the most symbolically accurate approximation.`,
      config: {
        systemInstruction: "You are a professional astrologer. Return ONLY valid JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sunSign: { type: Type.STRING },
            moonSign: { type: Type.STRING },
            risingSign: { type: Type.STRING },
            communicationLabel: { type: Type.STRING },
            planets: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  planet: { type: Type.STRING },
                  sign: { type: Type.STRING },
                  house: { type: Type.STRING }
                },
                required: ["planet", "sign"]
              }
            },
            aspects: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["sunSign", "moonSign", "risingSign", "communicationLabel", "planets", "aspects"]
        }
      }
    });
    return JSON.parse(response.text);
  }

  async generateBirthChartReadout(astro: AstroProfile) {
    const astroContext = this.getAstroContext(astro);
    const planetsDesc = astro.planets?.map(p => `${p.planet} in ${p.sign}`).join(", ");
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide a profound 'Big 3' reading. Sun: ${astro.sunSign}, Moon: ${astro.moonSign}, Rising: ${astro.risingSign}. 
      Other placements: ${planetsDesc}. Aspects: ${astro.aspects?.join(", ")}. 
      Explain how these interact for growth and self-awareness.`,
      config: {
        systemInstruction: `You are Faceworldd, an intuitive self-awareness coach. ${astroContext} Use Markdown.`
      }
    });
    return response.text;
  }

  async generateZodiacEducation(sign: string) {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Teach me about ${sign}. Include: Core Strengths, Shadow Weaknesses, and Compatibility logic.`,
      config: {
        systemInstruction: "You are a cosmic librarian. Provide structured, educational Markdown."
      }
    });
    return response.text;
  }

  async generateCompatibility(sign1: string, sign2: string) {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the astrological compatibility between ${sign1} and ${sign2}. 
      Include: Synergies, Challenges, and a 'Cosmic Rating' from 1-100. Use Markdown.`,
      config: {
        systemInstruction: "You are an expert synastry astrologer. Provide a deep, helpful, and poetic compatibility analysis."
      }
    });
    return response.text;
  }

  async generateGrowthQuote(astro?: AstroProfile) {
    const astroContext = this.getAstroContext(astro);
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Generate a unique growth quote.",
      config: { systemInstruction: `You are Faceworldd. ${astroContext} Output only quote and author.` }
    });
    return response.text;
  }

  async synthesize(text: string): Promise<string | null> {
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
        },
      });
      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch (err) {
      return null;
    }
  }

  decodeBase64(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  }

  async decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number = 24000): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const buffer = ctx.createBuffer(1, dataInt16.length, sampleRate);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
    return buffer;
  }

  async analyzeJournal(content: string, astro?: AstroProfile) {
    const astroContext = this.getAstroContext(astro);
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: content,
      config: {
        systemInstruction: `You are Faceworldd. ${astroContext} Analyze entry.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            feedback: { type: Type.STRING },
            mood: { type: Type.STRING },
            growthAction: { type: Type.STRING }
          },
          required: ["feedback", "mood", "growthAction"]
        }
      }
    });
    return JSON.parse(response.text);
  }

  async generateAffirmation(astro: AstroProfile) {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Cosmic affirmation.",
      config: { systemInstruction: `You are Faceworldd. ${this.getAstroContext(astro)}` }
    });
    return response.text;
  }

  async generateVisionImage(prompt: string, astro?: AstroProfile): Promise<string | null> {
    try {
      const astroContext = this.getAstroContext(astro);
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { text: `Manifest this vision for my destiny: ${prompt}. Infuse with the following cosmic energy: ${astroContext}` }
          ]
        },
        config: { imageConfig: { aspectRatio: "1:1" } }
      });
      const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      if (part?.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async editVisionImage(base64: string, prompt: string): Promise<string | null> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: base64, mimeType: 'image/png' } },
            { text: `Apply this cosmic shift to the image: ${prompt}` }
          ]
        }
      });
      const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      if (part?.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
      return null;
    } catch (error) {
      return null;
    }
  }
}

export const geminiService = new GeminiService();
