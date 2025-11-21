import { GoogleGenAI } from "@google/genai";
import { Match, Player } from "../types";

// Note: In a real production app, API keys should be proxy-served.
// For this frontend-only demo, we assume the key is in env or user provided context (not implemented in UI to keep prompt strict to requirements, but code handles it).
// Since I cannot ask for user input for API key in this specific request's logic flow easily without cluttering, 
// I will gracefully degrade if process.env.API_KEY is missing.

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

let ai: GoogleGenAI | null = null;
if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
}

export const getMatchCommentary = async (match: Match, homePlayer: Player, awayPlayer: Player): Promise<string> => {
    if (!ai) return "Comentario AI no disponible (Falta API Key).";

    const prompt = `
        Actúa como un narrador de fútbol de eSports eufórico y divertido (estilo Manolo Lama o narrador latino).
        
        Partido de FIFA:
        ${homePlayer.name} (usando ${homePlayer.team}) vs ${awayPlayer.name} (usando ${awayPlayer.team}).
        Marcador Final: ${match.homeScore} - ${match.awayScore}.
        
        Dame un comentario breve de 2 frases sobre el resultado.
        Si fue goleada, búrlate un poco del perdedor. Si fue empate, di que fue aburrido o tenso.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "¡Qué partido!";
    } catch (error) {
        console.error("AI Error", error);
        return "¡Increíble partido!";
    }
};

export const getTournamentPrediction = async (leader: string, leaderTeam: string, runnerUp: string): Promise<string> => {
     if (!ai) return "";
     
     const prompt = `
        Estamos en un torneo de FIFA.
        El líder actual es ${leader} jugando con ${leaderTeam}.
        Le sigue de cerca ${runnerUp}.
        
        Haz una predicción picante de 50 palabras sobre si el líder aguantará la presión. Habla como periodista deportivo de 'El Chiringuito'.
     `;

     try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "";
    } catch (error) {
        return "";
    }
}
