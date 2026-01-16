import { GoogleGenAI } from "@google/genai";
import { ApiResponse, VoxyModel } from '../types';

const USAGE_KEY = 'voxy_usage_v3';
const DAILY_LIMIT = 4;
const COOLDOWN = 60000;

const getUsage = () => {
  if (typeof window === 'undefined') return { count: 0, lastTime: 0, firstTime: 0 };
  const data = localStorage.getItem(USAGE_KEY);
  if (!data) return { count: 0, lastTime: 0, firstTime: 0 };
  const parsed = JSON.parse(data);
  if (Date.now() - parsed.firstTime > 86400000) return { count: 0, lastTime: 0, firstTime: 0 };
  return parsed;
};

const saveUsage = (usage: any) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USAGE_KEY, JSON.stringify(usage));
  }
};

export const getRemainingLimit = () => {
  const usage = getUsage();
  return Math.max(0, DAILY_LIMIT - usage.count);
};

const fileToPart = async (file: File) => {
  return new Promise<{ inlineData: { data: string; mimeType: string } }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve({ inlineData: { data: base64, mimeType: file.type } });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const uploadImage = async (file: File): Promise<ApiResponse> => {
  const usage = getUsage();
  if (Date.now() - usage.lastTime < COOLDOWN) {
    return { status: false, hd_url: "", message: "Harap tunggu 1 menit." };
  }
  if (usage.count >= DAILY_LIMIT) {
    return { status: false, hd_url: "", message: "Limit harian tercapai." };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    const imagePart = await fileToPart(file);
    
    // Model Gemini 2.5 Flash Image untuk hasil HD yang cepat dan gratis
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          imagePart, 
          { text: "Enhance this image to Ultra HD quality. Sharpen details and remove noise." }
        ],
      },
    });
    
    let hdUrl = "";
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const p of parts) {
        if (p.inlineData) {
          hdUrl = `data:${p.inlineData.mimeType};base64,${p.inlineData.data}`;
          break;
        }
      }
    }
    
    if (!hdUrl) throw new Error("AI tidak memberikan gambar.");

    const now = Date.now();
    saveUsage({
      firstTime: usage.count === 0 ? now : usage.firstTime,
      lastTime: now,
      count: usage.count + 1
    });

    return { status: true, hd_url: hdUrl };
  } catch (error: any) {
    return { status: false, hd_url: "", message: error.message };
  }
};

export const uploadToRemote = async (file: File): Promise<string> => {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("https://api.ferdev.my.id/remote/uploader", { method: "POST", body: form });
  const data = await res.json();
  return data.url || data.data?.url || "";
};

export const enhanceLink = async (url: string, model: VoxyModel): Promise<string> => {
  const endpoints: Record<string, string> = {
    hd1: "https://api-faa.my.id/faa/superhd",
    hd2: "https://api-faa.my.id/faa/hdv2",
    hd3: "https://api-faa.my.id/faa/hdv3",
    hd4: "https://api-faa.my.id/faa/hdv4",
  };

  if (model === 'hd5') {
    const res = await fetch(`https://api.ferdev.my.id/tools/remini?link=${encodeURIComponent(url)}&apikey=RS-gt81r3w1ds`);
    const data = await res.json();
    return data.result;
  }

  const res = await fetch(endpoints[model], {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: url }),
  });
  const data = await res.json();
  return data.result;
};