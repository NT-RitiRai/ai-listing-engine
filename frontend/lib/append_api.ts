
export const generateSummaryReport = (id: string) =>
  api.post(`/analyses/${id}/summary-report`).then((r) => r.data);

export const getSummaryReport = (id: string) =>
  api.get(`/analyses/${id}/summary-report`).then((r) => r.data);
