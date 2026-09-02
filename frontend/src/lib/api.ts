const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

async function fetchJson<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    let errorDetail = 'API request failed';
    try {
      const err = await res.json();
      errorDetail = err.detail || errorDetail;
    } catch {
      errorDetail = `HTTP ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

export const api = {
  // 1-Click Master Research
  runMasterBlueprint: (keyword: string, marketplace: string = 'US') =>
    fetchJson<any>('/master/blueprint', { method: 'POST', body: JSON.stringify({ keyword, marketplace }) }),

  // Marketplaces & Health
  getMarketplaces: () => fetchJson<any[]>('/marketplaces'),
  
  // Books
  searchBooks: (params: {
    query: string;
    marketplace?: string;
    category?: string;
    page?: number;
    min_bsr?: number;
    max_bsr?: number;
    min_reviews?: number;
    max_reviews?: number;
    min_rating?: number;
    max_rating?: number;
    min_price?: number;
    max_price?: number;
  }) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') q.append(k, String(v));
    });
    return fetchJson<any>(`/books/search?${q.toString()}`);
  },
  
  getBookDetails: (asin: string, marketplace: string = 'US') => 
    fetchJson<any>(`/books/${asin}?marketplace=${marketplace}`),
    
  toggleBookTracking: (asin: string) => 
    fetchJson<any>(`/books/${asin}/track`, { method: 'POST' }),
    
  getBestsellers: (category: string = 'coloring books', marketplace: string = 'US') =>
    fetchJson<any>(`/books/bestsellers?category=${encodeURIComponent(category)}&marketplace=${marketplace}`),

  // Keywords
  researchKeywords: (data: {
    seed_keyword: string;
    marketplace?: string;
    expand_depth?: number;
    include_questions?: boolean;
    include_buyer_intent?: boolean;
  }) => fetchJson<any>('/keywords/research', { method: 'POST', body: JSON.stringify(data) }),

  getEasyRankKeywords: (data: {
    seed_keyword: string;
    marketplace?: string;
    expand_depth?: number;
  }) => fetchJson<any>('/keywords/easy-rank', { method: 'POST', body: JSON.stringify(data) }),

  // Competition
  analyzeCompetition: (data: { keyword: string; marketplace?: string; sample_size?: number }) =>
    fetchJson<any>('/competition/analyze', { method: 'POST', body: JSON.stringify(data) }),

  // Trends & Events
  getTrendSignals: (query: string = 'coloring book', marketplace: string = 'US') =>
    fetchJson<any>(`/trends/signals?query=${encodeURIComponent(query)}&marketplace=${marketplace}`),
    
  getRisingTrends: (marketplace: string = 'US') =>
    fetchJson<any>(`/trends/rising?marketplace=${marketplace}`),

  getEventsCalendar: (marketplace: string = 'US', days_ahead: number = 180) =>
    fetchJson<any[]>(`/events/calendar?marketplace=${marketplace}&days_ahead=${days_ahead}`),

  // Ideas & "What to Publish"
  generateBookIdeas: (data: any) =>
    fetchJson<any>('/ideas/generate', { method: 'POST', body: JSON.stringify(data) }),

  whatShouldIPublish: (theme_prompt: string, marketplace: string = 'US') =>
    fetchJson<any>(`/ideas/what-to-publish?theme_prompt=${encodeURIComponent(theme_prompt)}&marketplace=${marketplace}`, { method: 'POST' }),

  // SEO Studio
  generateTitles: (data: any) =>
    fetchJson<any[]>('/seo/title-studio', { method: 'POST', body: JSON.stringify(data) }),

  generateDescription: (data: any) =>
    fetchJson<any>('/seo/description', { method: 'POST', body: JSON.stringify(data) }),

  generateBackendKeywords: (data: any) =>
    fetchJson<any>('/seo/backend-keywords', { method: 'POST', body: JSON.stringify(data) }),

  auditListing: (data: any) =>
    fetchJson<any>('/seo/audit-listing', { method: 'POST', body: JSON.stringify(data) }),

  // Cover Intelligence
  getCoverIntelligence: (data: { keyword: string; marketplace?: string }) =>
    fetchJson<any>('/cover/intelligence', { method: 'POST', body: JSON.stringify(data) }),

  generateCoverPrompt: (params: any) => {
    const q = new URLSearchParams(params);
    return fetchJson<any>(`/cover/prompt-maker?${q.toString()}`, { method: 'POST' });
  },

  // Ranking Strategy
  getRankingStrategy: (data: any) =>
    fetchJson<any>('/strategy/how-to-rank', { method: 'POST', body: JSON.stringify(data) }),

  // Projects
  getProjects: (status?: string) => fetchJson<any[]>(`/projects${status ? `?status=${status}` : ''}`),
  createProject: (data: any) => fetchJson<any>('/projects', { method: 'POST', body: JSON.stringify(data) }),
  getProject: (id: number) => fetchJson<any>(`/projects/${id}`),
  updateProjectStatus: (id: number, status: string) => fetchJson<any>(`/projects/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  updateProject: (id: number, data: any) => fetchJson<any>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProject: (id: number) => fetchJson<any>(`/projects/${id}`, { method: 'DELETE' }),

  // Watchlist & Alerts
  getWatchlist: () => fetchJson<any[]>('/watchlist'),
  addToWatchlist: (data: any) => fetchJson<any>('/watchlist', { method: 'POST', body: JSON.stringify(data) }),
  deleteWatchlistItem: (id: number) => fetchJson<any>(`/watchlist/${id}`, { method: 'DELETE' }),
  getAlerts: () => fetchJson<any[]>('/watchlist/alerts'),
  markAlertRead: (id: number) => fetchJson<any>(`/watchlist/alerts/${id}/read`, { method: 'POST' }),

  // Reports & Exports
  exportPdf: (reportData: any) => fetchJson<any>('/reports/pdf', { method: 'POST', body: JSON.stringify(reportData) }),
  exportExcel: (dataItems: any[], sheetName?: string) => 
    fetchJson<any>(`/reports/excel?sheet_name=${sheetName || 'Data'}`, { method: 'POST', body: JSON.stringify(dataItems) }),
  exportCsv: (dataItems: any[]) => fetchJson<any>('/reports/csv', { method: 'POST', body: JSON.stringify(dataItems) }),
  exportJson: (dataItems: any) => fetchJson<any>('/reports/json', { method: 'POST', body: JSON.stringify(dataItems) }),

  // Settings & Diagnostics
  getSettings: () => fetchJson<any>('/settings'),
  updateSettings: (data: any) => fetchJson<any>('/settings', { method: 'POST', body: JSON.stringify(data) }),
  testConnection: (connectorId: string) => fetchJson<any>(`/settings/test-connection/${connectorId}`),
  testAllConnections: () => fetchJson<any[]>('/settings/test-all'),
  triggerBackup: () => fetchJson<any>('/settings/backup', { method: 'POST' }),
  listBackups: () => fetchJson<any[]>('/settings/backups'),

  // Logs & History
  getSystemLogs: (level?: string, limit: number = 50) => 
    fetchJson<any[]>(`/logs/system?limit=${limit}${level ? `&level=${level}` : ''}`),
  getSearchHistory: (limit: number = 50) => fetchJson<any[]>(`/logs/history?limit=${limit}`),
};
