
import { GoogleGenAI } from "@google/genai";
import { Product, Sale } from "../types";

// Always use the required initialization format and retrieve the API key from the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  // Directly check the existence of the API key string for availability.
  isAvailable: () => !!process.env.API_KEY,

  generateProductDescription: async (name: string, category: string, features: string): Promise<string> => {
    try {
      const prompt = `Escreva uma descrição atraente, curta e elegante (máximo 40 palavras) para uma loja de roupas feminina.
      Produto: ${name}
      Categoria: ${category}
      Características: ${features}
      
      Apenas a descrição, sem aspas.`;

      // Use 'gemini-3-flash-preview' for basic text generation tasks.
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      // Extract generated text directly from the response.text property.
      return response.text || "Descrição indisponível.";
    } catch (error) {
      console.error("Erro Gemini:", error);
      return "Erro ao gerar descrição.";
    }
  },

  analyzeSalesTrend: async (sales: Sale[]): Promise<string> => {
    if (sales.length === 0) return "Sem dados suficientes para análise.";

    // Summarize data for the prompt to save tokens
    const totalRevenue = sales.reduce((acc, s) => acc + s.total, 0);
    const totalSales = sales.length;
    
    // Simple logic to find top seller in JS before sending to AI
    const itemCounts: Record<string, number> = {};
    sales.forEach(s => s.items.forEach(i => {
      itemCounts[i.productName] = (itemCounts[i.productName] || 0) + i.quantity;
    }));
    const topProducts = Object.entries(itemCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([name, count]) => `${name} (${count})`)
      .join(", ");

    const prompt = `Atue como um consultor de vendas de moda experiente.
    Analise estes dados de vendas recentes:
    - Total Vendido: R$ ${totalRevenue.toFixed(2)}
    - Número de Vendas: ${totalSales}
    - Produtos mais vendidos: ${topProducts}

    Forneça um insight curto (max 50 palavras) e motivador para a equipe de vendas sobre o desempenho e uma dica rápida.`;

    try {
      // Use 'gemini-3-flash-preview' for complex text reasoning tasks.
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      // Extract generated text directly from the response.text property.
      return response.text || "Não foi possível analisar.";
    } catch (error) {
      console.error("Erro Gemini:", error);
      return "Erro na análise de vendas.";
    }
  }
};
