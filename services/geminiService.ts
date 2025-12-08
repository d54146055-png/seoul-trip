import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const sendGeminiMessage = async (
  history: ChatMessage[],
  currentMessage: string,
  userLocation?: { latitude: number; longitude: number }
): Promise<ChatMessage> => {
  try {
    const model = 'gemini-2.5-flash';
    
    // Configure tools - specifically Google Maps
    const tools: any[] = [{ googleMaps: {} }];
    
    let toolConfig: any = undefined;
    if (userLocation) {
        toolConfig = {
            retrievalConfig: {
                latLng: {
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude
                }
            }
        };
    }

    const chatHistory = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    const chat = ai.chats.create({
      model: model,
      history: chatHistory,
      config: {
        tools: tools,
        toolConfig: toolConfig,
        systemInstruction: `You are an expert travel guide for Seoul, South Korea. 
        Help the user find locations, plan routes, and discover hidden gems in Seoul.
        Always provide practical advice about transport (Subway/Bus/Naver Maps).
        Reply in Traditional Chinese (繁體中文).
        Keep responses concise and mobile-friendly.`,
      }
    });

    const result = await chat.sendMessage({ message: currentMessage });
    const responseText = result.text || "抱歉，我現在無法回答。";
    
    // Extract map grounding info if available
    const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const mapLinks: Array<{title: string, uri: string}> = [];

    if (groundingChunks) {
      groundingChunks.forEach((chunk: any) => {
        if (chunk.maps?.uri && chunk.maps?.title) {
          mapLinks.push({
            title: chunk.maps.title,
            uri: chunk.maps.uri
          });
        }
      });
    }

    return {
      id: Date.now().toString(),
      role: 'model',
      text: responseText,
      mapLinks: mapLinks.length > 0 ? mapLinks : undefined
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      id: Date.now().toString(),
      role: 'model',
      text: "連線發生錯誤，請稍後再試。請確認您的 API Key 是否正確。",
    };
  }
};