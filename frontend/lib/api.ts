import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

export const startAnalysis = (url: string) =>
  api.post("/analyses", { url }).then((r) => r.data);

export const getAnalysis = (id: string) =>
  api.get(`/analyses/${id}`).then((r) => r.data);

export const getScores = (id: string) =>
  api.get(`/analyses/${id}/scores`).then((r) => r.data);

export const getIssues = (id: string, category?: string) =>
  api.get(`/analyses/${id}/issues`, { params: { category } }).then((r) => r.data);

export const getRecommendations = (id: string) =>
  api.get(`/analyses/${id}/recommendations`).then((r) => r.data);

export const getIntelligence = (id: string) =>
  api.get(`/analyses/${id}/intelligence`).then((r) => r.data);

export const getStrengthsWeaknesses = (id: string) =>
  api.get(`/analyses/${id}/strengths-weaknesses`).then((r) => r.data);

export const getPrompts = (id: string) =>
  api.get(`/analyses/${id}/prompts`).then((r) => r.data);

export const analyzePrompt = (promptId: string) =>
  api.post(`/prompts/${promptId}/analyze`).then((r) => r.data);
