from datetime import datetime, date
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field

# Base Data Transparency Metadata
class DataSourceMetadata(BaseModel):
    source: str # 'amazon_paapi', 'amazon_live', 'amazon_suggest', 'calculated', 'estimated', 'local_ai'
    marketplace: str
    data_status: str # 'LIVE', 'CACHED', 'STALE', 'OBSERVED', 'CALCULATED', 'ESTIMATED', 'AI_ANALYSIS', 'UNAVAILABLE'
    retrieved_at: datetime = Field(default_factory=datetime.utcnow)
    confidence: Optional[str] = "HIGH" # HIGH, MEDIUM, LOW
    notes: Optional[str] = None

# Marketplace
class MarketplaceSchema(BaseModel):
    code: str
    name: str
    domain: str
    currency: str
    currency_symbol: str
    region: str
    pa_api_supported: bool
    suggest_api_supported: bool
    is_active: bool

    class Config:
        from_attributes = True

# Book schemas
class BookObservationSchema(BaseModel):
    id: int
    asin: str
    source: str
    data_type: str
    bsr: Optional[int] = None
    price: Optional[float] = None
    rating: Optional[float] = None
    review_count: Optional[int] = None
    sales_rank_category: Optional[str] = None
    retrieved_at: datetime

    class Config:
        from_attributes = True

class BookSchema(BaseModel):
    asin: str
    marketplace: str
    title: str
    subtitle: Optional[str] = None
    author: Optional[str] = None
    publisher: Optional[str] = None
    publication_date: Optional[str] = None
    isbn: Optional[str] = None
    price: Optional[float] = None
    currency: Optional[str] = "USD"
    format: Optional[str] = "Paperback"
    page_count: Optional[int] = None
    cover_image_url: Optional[str] = None
    amazon_url: str
    category_path: Optional[str] = None
    current_bsr: Optional[int] = None
    current_rating: Optional[float] = None
    current_review_count: Optional[int] = None
    is_tracked: bool = False
    
    # Calculated & estimated metrics
    estimated_monthly_sales: Optional[int] = None
    estimated_monthly_revenue: Optional[float] = None
    opportunity_score: Optional[float] = None
    
    # Transparency
    data_status: str = "LIVE" # LIVE, CACHED, OBSERVED, ESTIMATED, UNAVAILABLE
    source: str = "amazon"
    retrieved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class BookDetailResponse(BaseModel):
    book: BookSchema
    observations: List[BookObservationSchema]
    competitor_strength: str # 'LOW', 'MEDIUM', 'HIGH', 'DOMINANT'
    ai_analysis: Optional[Dict[str, Any]] = None

class BookSearchRequest(BaseModel):
    query: str
    marketplace: str = "US"
    category: Optional[str] = "books"
    min_bsr: Optional[int] = None
    max_bsr: Optional[int] = None
    min_reviews: Optional[int] = None
    max_reviews: Optional[int] = None
    min_rating: Optional[float] = None
    max_rating: Optional[float] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    publication_window_days: Optional[int] = None
    format: Optional[str] = None
    page: int = 1
    page_size: int = 20
    sort_by: Optional[str] = "relevance" # relevance, bsr_asc, reviews_desc, price_asc, rating_desc

class BookSearchResponse(BaseModel):
    query: str
    marketplace: str
    total_results: int
    results: List[BookSchema]
    source: str
    data_status: str
    retrieved_at: datetime = Field(default_factory=datetime.utcnow)
    avg_price: Optional[float] = None
    avg_reviews: Optional[float] = None
    avg_bsr: Optional[int] = None
    median_reviews: Optional[float] = None

# Keyword schemas
class KeywordSchema(BaseModel):
    id: Optional[int] = None
    keyword: str
    marketplace: str
    seed_keyword: Optional[str] = None
    opportunity_score: float = 0.0
    competition_score: float = 0.0
    trend_score: float = 0.0
    opportunity_label: str = "MODERATE" # EXCELLENT, GOOD, MODERATE, WEAK
    cluster_group: Optional[str] = None
    recommended_use: Optional[str] = None
    relevant_books_count: int = 0
    avg_competitor_reviews: float = 0.0
    search_volume_indicator: str = "MEDIUM" # HIGH, MEDIUM, LOW, EMERGING
    data_status: str = "LIVE"
    source: str = "amazon_suggest"
    last_checked_at: Optional[datetime] = None
    is_tracked: bool = False

    class Config:
        from_attributes = True

class KeywordResearchRequest(BaseModel):
    seed_keyword: str
    marketplace: str = "US"
    expand_depth: int = 1 # 1: direct, 2: alpha-expansion (a-z)
    include_questions: bool = True
    include_buyer_intent: bool = True

class KeywordResearchResponse(BaseModel):
    seed_keyword: str
    marketplace: str
    keywords: List[KeywordSchema]
    clusters: Dict[str, List[KeywordSchema]]
    top_opportunities: List[KeywordSchema]
    data_status: str
    retrieved_at: datetime = Field(default_factory=datetime.utcnow)

# Competition Analysis
class CompetitionAnalysisRequest(BaseModel):
    keyword: str
    marketplace: str = "US"
    sample_size: int = 20

class CompetitionAnalysisResponse(BaseModel):
    keyword: str
    marketplace: str
    competition_score: float # 0 - 100
    competition_level: str # VERY_EASY, EASY, MODERATE, DIFFICULT, VERY_DIFFICULT
    opportunity_score: float # 0 - 100
    opportunity_level: str # EXCELLENT, GOOD, MODERATE, WEAK
    top_books: List[BookSchema]
    metrics: Dict[str, Any] # avg_reviews, median_reviews, avg_rating, avg_price, new_book_share
    score_breakdown: Dict[str, Any]
    content_gaps: List[str]
    cover_differentiation_opportunities: List[str]
    evidence: Dict[str, Any]
    data_status: str
    retrieved_at: datetime = Field(default_factory=datetime.utcnow)

# Trend Schemas
class TrendSignalSchema(BaseModel):
    topic: str
    marketplace: str
    status: str # RISING, GROWING, STABLE, DECLINING
    score: float # 0 - 100
    velocity_percent: float
    time_range: str
    evidence: str
    confidence: str # HIGH, MEDIUM, LOW
    source: str
    retrieved_at: datetime = Field(default_factory=datetime.utcnow)

# Event Schema
class EventSchema(BaseModel):
    id: Optional[int] = None
    name: str
    event_date: date
    prep_window_start: date
    days_until_event: int
    days_until_prep: int
    marketplace: str
    category: str
    related_niches: List[str]
    keyword_opportunities: List[str]
    evidence_notes: Optional[str] = None

# Idea Generation
class BookIdeaRequest(BaseModel):
    niche: str
    marketplace: str = "US"
    target_audience: Optional[str] = None
    age_group: Optional[str] = None
    book_type: Optional[str] = "Coloring Book" # Activity Book, Log Book, Journal, Guided Planner, Non-fiction
    optional_keyword: Optional[str] = None

class BookConcept(BaseModel):
    title_concept: str
    subtitle_concept: str
    target_audience: str
    primary_keyword: str
    secondary_keywords: List[str]
    content_concept: str
    differentiation_hook: str
    cover_concept: str
    interior_concept: str
    opportunity_score: float
    competition_level: str
    recommended_publishing_window: str
    evidence_basis: List[str]

class BookIdeaResponse(BaseModel):
    niche: str
    marketplace: str
    ideas: List[BookConcept]
    retrieved_at: datetime = Field(default_factory=datetime.utcnow)

# SEO Studio
class SEOTitleRequest(BaseModel):
    niche: str
    primary_keyword: str
    secondary_keywords: List[str] = []
    target_audience: str = ""
    book_type: str = "Paperback"

class SEOTitleOption(BaseModel):
    title: str
    subtitle: str
    character_count_title: int
    character_count_subtitle: int
    seo_score: float # 0 - 100
    readability_score: float # 0 - 100
    buyer_intent_score: float # 0 - 100
    keywords_included: List[str]
    stuffing_risk: str # 'LOW', 'MEDIUM', 'HIGH'
    rationale: str

class SEODescriptionRequest(BaseModel):
    title: str
    subtitle: Optional[str] = None
    niche: str
    primary_keyword: str
    secondary_keywords: List[str] = []
    target_audience: str = ""
    key_features: List[str] = []

class SEODescriptionResponse(BaseModel):
    hook: str
    problem_desire: str
    benefits: str
    whats_inside: str
    target_audience_section: str
    call_to_action: str
    full_html_description: str
    keywords_integrated: List[str]
    readability_grade: str

class BackendKeywordsRequest(BaseModel):
    niche: str
    primary_keyword: str
    secondary_keywords: List[str] = []
    title_words: List[str] = [] # To exclude words already in title

class BackendKeywordsResponse(BaseModel):
    boxes: List[str] # 7 boxes, max 50 chars / bytes each without repetition
    total_characters_used: int
    deduplicated_terms_count: int
    compliance_notes: str

# Listing Auditor
class ListingAuditRequest(BaseModel):
    asin: Optional[str] = None
    amazon_url: Optional[str] = None
    title: Optional[str] = None
    subtitle: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    bsr: Optional[int] = None
    rating: Optional[float] = None
    review_count: Optional[int] = None
    marketplace: str = "US"

class ListingAuditResponse(BaseModel):
    overall_score: float # 0 - 100
    seo_score: float
    competition_score: float
    pricing_score: float
    conversion_score: float
    top_5_fixes: List[Dict[str, Any]]
    strengths: List[str]
    weaknesses: List[str]
    compliance_check: Dict[str, bool]
    evidence: Dict[str, Any]

# Cover Studio
class CoverAnalysisRequest(BaseModel):
    keyword: str
    marketplace: str = "US"

class CoverAnalysisResponse(BaseModel):
    dominant_color_tendencies: List[str]
    typography_styles: List[str]
    visual_density: str # 'Minimalist', 'Moderate', 'Dense/Packed'
    title_placement_patterns: List[str]
    thumbnail_readability_analysis: str
    visual_differentiation_opportunities: List[str]
    recommended_cover_prompt: str
    recommended_trim_size: str
    evidence_covers: List[Dict[str, Any]]

# Ranking Strategy
class RankingStrategyRequest(BaseModel):
    niche: str
    primary_keyword: str
    marketplace: str = "US"
    target_price: float = 9.99

class RankingStrategyResponse(BaseModel):
    niche: str
    keyword_strategy: str
    title_strategy: str
    subtitle_strategy: str
    category_strategy: str
    cover_strategy: str
    description_strategy: str
    launch_strategy: str
    review_strategy: str
    pricing_strategy: str
    competitor_strategy: str
    monitoring_strategy: str
    why_this_recommendation: List[str]
    generated_at: datetime = Field(default_factory=datetime.utcnow)

# Projects
class ProjectCreateRequest(BaseModel):
    title: str
    niche: str
    target_audience: Optional[str] = None
    marketplace: str = "US"
    status: Optional[str] = "PENDING" # PENDING, IN_PROGRESS, DONE
    seo_data_json: Optional[str] = "{}"
    cover_prompt_json: Optional[str] = "{}"
    ranking_strategy_json: Optional[str] = "{}"
    notes: Optional[str] = ""

class ProjectStatusUpdateRequest(BaseModel):
    status: str # PENDING, IN_PROGRESS, DONE

class ProjectSchema(BaseModel):
    id: int
    title: str
    niche: str
    target_audience: Optional[str] = None
    marketplace: str = "US"
    status: str
    seo_data_json: str
    cover_prompt_json: str
    ranking_strategy_json: str
    notes: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Watchlist & Alerts
class WatchlistCreateRequest(BaseModel):
    item_type: str # 'BOOK', 'KEYWORD', 'NICHE'
    item_id: str
    marketplace: str = "US"
    label: Optional[str] = None

class WatchlistSchema(BaseModel):
    id: int
    item_type: str
    item_id: str
    marketplace: str
    label: Optional[str] = None
    baseline_metrics_json: str
    current_metrics_json: str
    last_checked_at: datetime
    delta: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class AlertSchema(BaseModel):
    id: int
    alert_type: str
    title: str
    message: str
    severity: str
    is_read: bool
    source_entity_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Settings & Health
class SettingsSchema(BaseModel):
    amazon_access_key: Optional[str] = None
    amazon_secret_key: Optional[str] = None
    amazon_associate_tag: Optional[str] = None
    amazon_default_marketplace: str = "US"
    ai_provider: str = "openai"
    openai_api_key: Optional[str] = None
    openai_base_url: Optional[str] = "https://api.groq.com/openai/v1"
    openai_model: str = "openai/gpt-oss-120b"
    use_postgres: bool = True
    postgres_url: Optional[str] = None

class ConnectionTestResponse(BaseModel):
    connector_id: str
    name: str
    status: str # CONNECTED, DISCONNECTED, ERROR
    latency_ms: Optional[float] = None
    message: str
