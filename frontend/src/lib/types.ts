export type DataStatusBadge = 
  | 'LIVE' 
  | 'CACHED' 
  | 'STALE' 
  | 'OBSERVED' 
  | 'CALCULATED' 
  | 'ESTIMATED' 
  | 'AI_ANALYSIS' 
  | 'UNAVAILABLE';

export interface Marketplace {
  code: string;
  name: string;
  domain: string;
  currency: string;
  currency_symbol: string;
  region: string;
  pa_api_supported: boolean;
  suggest_api_supported: boolean;
  is_active: boolean;
}

export interface Book {
  asin: string;
  marketplace: string;
  title: string;
  subtitle?: string;
  author?: string;
  publisher?: string;
  publication_date?: string;
  isbn?: string;
  price?: number;
  currency?: string;
  format?: string;
  page_count?: number;
  cover_image_url?: string;
  amazon_url: string;
  category_path?: string;
  current_bsr?: number;
  current_rating?: number;
  current_review_count?: number;
  is_tracked: boolean;
  estimated_monthly_sales?: number;
  estimated_monthly_revenue?: number;
  data_status: string;
  source: string;
  retrieved_at?: string;
}

export interface BookObservation {
  id: number;
  asin: string;
  source: string;
  data_type: string;
  bsr?: number;
  price?: number;
  rating?: number;
  review_count?: number;
  sales_rank_category?: string;
  retrieved_at: string;
}

export interface Keyword {
  id?: number;
  keyword: string;
  marketplace: string;
  seed_keyword?: string;
  opportunity_score: number;
  competition_score: number;
  trend_score: number;
  opportunity_label: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'WEAK';
  cluster_group?: string;
  recommended_use?: string;
  relevant_books_count: number;
  avg_competitor_reviews: number;
  search_volume_indicator: 'HIGH' | 'MEDIUM' | 'LOW' | 'EMERGING';
  data_status: string;
  source: string;
  is_tracked: boolean;
}

export interface TrendSignal {
  topic: string;
  marketplace: string;
  status: 'RISING' | 'GROWING' | 'STABLE' | 'DECLINING';
  score: number;
  velocity_percent: number;
  time_range: string;
  evidence: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  source: string;
  related_queries?: string[];
  data_status: string;
  retrieved_at: string;
}

export interface SeasonalEvent {
  id?: number;
  name: string;
  event_date: string;
  prep_window_start: string;
  days_until_event: number;
  days_until_prep: number;
  marketplace: string;
  category: string;
  related_niches: string[];
  keyword_opportunities: string[];
  evidence_notes?: string;
}

export interface BookConcept {
  title_concept: string;
  subtitle_concept: string;
  target_audience: string;
  primary_keyword: string;
  secondary_keywords: string[];
  content_concept: string;
  differentiation_hook: string;
  cover_concept: string;
  interior_concept: string;
  opportunity_score: number;
  competition_level: string;
  recommended_publishing_window: string;
  evidence_basis: string[];
}

export interface SEOTitleOption {
  title: string;
  subtitle: string;
  character_count_title: number;
  character_count_subtitle: number;
  seo_score: number;
  readability_score: number;
  buyer_intent_score: number;
  keywords_included: string[];
  stuffing_risk: 'LOW' | 'MEDIUM' | 'HIGH';
  rationale: string;
}

export interface SEODescriptionResponse {
  hook: string;
  problem_desire: string;
  benefits: string;
  whats_inside: string;
  target_audience_section: string;
  call_to_action: string;
  full_html_description: string;
  keywords_integrated: string[];
  readability_grade: string;
}

export interface BackendKeywordsResponse {
  boxes: string[];
  total_characters_used: number;
  deduplicated_terms_count: number;
  compliance_notes: string;
}

export interface ListingAuditResponse {
  overall_score: number;
  seo_score: number;
  competition_score: number;
  pricing_score: number;
  conversion_score: number;
  top_5_fixes: Array<{ priority: number; area: string; fix: string }>;
  strengths: string[];
  weaknesses: string[];
  compliance_check: Record<string, boolean>;
  evidence: Record<string, any>;
}

export interface CoverAnalysisResponse {
  dominant_color_tendencies: string[];
  typography_styles: string[];
  visual_density: string;
  title_placement_patterns: string[];
  thumbnail_readability_analysis: string;
  visual_differentiation_opportunities: string[];
  recommended_cover_prompt: string;
  recommended_trim_size: string;
  evidence_covers: Array<{ asin: string; title: string; cover_url: string; price?: number; rating?: number }>;
}

export interface RankingStrategyResponse {
  niche: string;
  keyword_strategy: string;
  title_strategy: string;
  subtitle_strategy: string;
  category_strategy: string;
  cover_strategy: string;
  description_strategy: string;
  launch_strategy: string;
  review_strategy: string;
  pricing_strategy: string;
  competitor_strategy: string;
  monitoring_strategy: string;
  why_this_recommendation: string[];
  generated_at: string;
}

export interface Project {
  id: number;
  title: string;
  niche: string;
  target_audience?: string;
  marketplace: string;
  status: string;
  seo_data_json: string;
  cover_prompt_json: string;
  ranking_strategy_json: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface WatchlistItem {
  id: number;
  item_type: 'BOOK' | 'KEYWORD' | 'NICHE';
  item_id: string;
  marketplace: string;
  label?: string;
  baseline_metrics_json: string;
  current_metrics_json: string;
  last_checked_at: string;
  delta?: {
    bsr_change?: number;
    reviews_change?: number;
    price_change?: number;
  };
}

export interface AlertItem {
  id: number;
  alert_type: string;
  title: string;
  message: string;
  severity: 'INFO' | 'SUCCESS' | 'WARNING';
  is_read: boolean;
  source_entity_id?: string;
  created_at: string;
}

export interface SystemLog {
  id: number;
  level: string;
  component: string;
  message: string;
  details_json?: string;
  created_at: string;
}

export interface AppSettings {
  amazon_access_key?: string;
  amazon_secret_key?: string;
  amazon_associate_tag?: string;
  amazon_default_marketplace: string;
  ai_provider: string;
  ollama_base_url: string;
  ollama_model: string;
  openai_api_key?: string;
  openai_base_url?: string;
  openai_model: string;
  use_postgres: boolean;
  postgres_url?: string;
}
