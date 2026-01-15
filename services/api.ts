import { GoogleGenAI } from "@google/genai";
import { ApiResponse, VoxyModel } from '../types';

const USAGE_KEY = 'voxy_usage_v3';
const DAILY_LIMIT = 4;
const COOLDOWN = 60000;

interface UsageData {
  firstTime: number;
  lastTime: number;
  count: number;
}

const getUsage = (): UsageData => {
  const data = localStorage.getItem(USAGE_KEY);
  const now = Date.now();
  if (!data) return { firstTime: 0, lastTime: 0, count: 0 };
  try {
    const parsed = JSON.parse(data);
    if (now - parsed.firstTime > 86400000) return { firstTime: 0, lastTime: 0, count: 0 };
    return parsed;
  } catch (e) {
    return { firstTime: 0, lastTime: 0, count: 0 };
  }
};

const saveUsage = (usage: UsageData) => {
  localStorage.setItem(USAGE_KEY, JSON.stringify(usage));
};

export const getRemainingLimit = () => {
  const usage = getUsage();
  return Math.max(0, DAILY_LIMIT - usage.count);
};

const fileToPart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        const base64 = result.split(',')[1];
        if (base64) resolve({ inlineData: { data: base64, mimeType: file.type } });
        else reject(new Error("Gagal mengonversi gambar ke base64."));
      } else reject(new Error("Format file tidak terbaca."));
    };
    reader.onerror = () => reject(new Error("Gagal membaca file."));
    reader.readAsDataURL(file);
  });
};

/**
 * GEMINI AI ENHANCER (Direct Upload)
 */
export const uploadImage = async (file: File): Promise<ApiResponse> => {
  const now = Date.now();
  const usage = getUsage();
  if (now - usage.lastTime < COOLDOWN) {
    return { status: false, hd_url: "", message: "Harap tunggu 1 menit antar upload." };
  }
  if (usage.count >= DAILY_LIMIT) {
    return { status: false, hd_url: "", message: "Limit harian tercapai (4/4)." };
  }

  try {
    // Menggunakan GoogleGenAI dengan API_KEY yang tersedia di environment
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const part = await fileToPart(file);
    
    // Menggunakan gemini-2.5-flash-image untuk output gambar HD yang cepat dan gratis
    // Model ini dikhususkan untuk tugas pengeditan dan pembuatan gambar.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [part, { text: "Tingkatkan resolusi gambar ini menjadi sangat tajam (Ultra HD). Bersihkan noise, pertajam tepi, dan tingkatkan detail tekstur tanpa mengubah bentuk asli." }],
      },
    });
    
    let url = "";
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const p of parts) {
        if (p.inlineData) {
          url = `data:${p.inlineData.mimeType || 'image/png'};base64,${p.inlineData.data}`;
          break;
        }
      }
    }
    
    if (!url) throw new Error("AI tidak mengembalikan data gambar.");
    saveUsage({ firstTime: usage.count === 0 ? now : usage.firstTime, lastTime: now, count: usage.count + 1 });
    return { status: true, hd_url: url };
  } catch (error: any) {
    return { status: false, hd_url: "", message: error.message };
  }
};

/**
 * VOXY REMOTE UPLOADER
 */
export const uploadToRemote = async (file: File): Promise<string> => {
  const form = new FormData();
  form.append("file", file);

  try {
    const res = await fetch("https://api.ferdev.my.id/remote/uploader", {
      method: "POST",
      body: form
    });

    if (!res.ok) {
      throw new Error(`UPLOAD FAILED: Server merespon dengan status ${res.status}.`);
    }

    const data = await res.json();
    console.log("Uploader raw response:", data);

    const findUrl = (obj: any): string | null => {
      if (!obj || typeof obj !== "object") return null;
      for (const key in obj) {
        const val = obj[key];
        if (typeof val === "string" && val.match(/^https?:\/\/.+/)) {
          return val;
        }
        if (typeof val === "object") {
          const nested = findUrl(val);
          if (nested) return nested;
        }
      }
      return null;
    };

    const foundUrl = data.url || (data.data && data.data.url) || findUrl(data);

    if (!foundUrl) {
      throw new Error("Server tidak memberikan link hasil upload. Coba lagi atau cek API.");
    }

    return foundUrl;
  } catch (err: any) {
    if (err.message === "Failed to fetch") {
      throw new Error("UPLOAD FAILED: Koneksi ke server uploader gagal (Network/CORS error).");
    }
    throw err;
  }
};

/**
 * VOXY MULTI-MODEL ENHANCER (HD1 - HD5)
 */
export const enhanceLink = async (url: string, model: VoxyModel): Promise<string> => {
  const endpoints: Record<string, string> = {
    hd1: "https://api-faa.my.id/faa/superhd",
    hd2: "https://api-faa.my.id/faa/hdv2",
    hd3: "https://api-faa.my.id/faa/hdv3",
    hd4: "https://api-faa.my.id/faa/hdv4",
  };

  try {
    if (model === 'hd5') {
      const apiUrl = `https://api.ferdev.my.id/tools/remini?link=${encodeURIComponent(url)}&apikey=RS-gt81r3w1ds`;
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error(`Remini API error (${res.status})`);
      const data = await res.json();
      if (!data.result) throw new Error("Remini tidak memberikan hasil. Link mungkin expired.");
      return data.result;
    }

    const res = await fetch(endpoints[model], {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: url }),
    });

    if (!res.ok) {
      throw new Error(`Gagal! API ${model.toUpperCase()} offline atau merespon dengan error ${res.status}.`);
    }

    const data = await res.json();
    console.log(`Enhancer ${model} raw response:`, data);

    if (!data.result) {
      throw new Error(`API ${model.toUpperCase()} berhasil diakses tapi tidak memberikan hasil gambar.`);
    }

    return data.result;
  } catch (err: any) {
    if (err.message === "Failed to fetch") {
      throw new Error("Network/CORS error: Pastikan API sedang aktif dan mendukung request dari domain ini.");
    }
    throw err;
  }
};