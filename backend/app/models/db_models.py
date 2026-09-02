from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey, Index, Date
)
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class Setting(Base):
    __tablename__ = "settings"
    key = Column(String(100), primary_key=True, index=True)
    value_json = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Marketplace(Base):
    __tablename__ = "marketplaces"
    code = Column(String(10), primary_key=True) # 'US', 'UK', etc.
    name = Column(String(100), nullable=False)
    domain = Column(String(50), nullable=False)
    currency = Column(String(10), nullable=False)
    currency_symbol = Column(String(10), nullable=False, default="$")
    region = Column(String(20), nullable=False)
    pa_api_supported = Column(Boolean, default=True)
    suggest_api_supported = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)

class DataSource(Base):
    __tablename__ = "data_sources"
    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    status = Column(String(30), default="CONNECTED") # CONNECTED, DISCONNECTED, RATE_LIMITED, AUTH_REQUIRED, UNAVAILABLE
    last_checked_at = Column(DateTime, default=datetime.utcnow)
    last_success_at = Column(DateTime, nullable=True)
    last_error_message = Column(Text, nullable=True)

class Book(Base):
    __tablename__ = "books"
    asin = Column(String(20), primary_key=True, index=True)
    marketplace = Column(String(10), nullable=False, index=True)
    title = Column(Text, nullable=False)
    subtitle = Column(Text, nullable=True)
    author = Column(String(255), nullable=True)
    publisher = Column(String(255), nullable=True)
    publication_date = Column(String(50), nullable=True)
    isbn = Column(String(20), nullable=True)
    price = Column(Float, nullable=True)
    currency = Column(String(10), nullable=True, default="USD")
    format = Column(String(50), nullable=True, default="Paperback")
    page_count = Column(Integer, nullable=True)
    cover_image_url = Column(Text, nullable=True)
    amazon_url = Column(Text, nullable=False)
    category_path = Column(Text, nullable=True)
    current_bsr = Column(Integer, nullable=True, index=True)
    current_rating = Column(Float, nullable=True)
    current_review_count = Column(Integer, nullable=True)
    is_tracked = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    observations = relationship("BookObservation", back_populates="book", cascade="all, delete-orphan")

class BookObservation(Base):
    __tablename__ = "book_observations"
    id = Column(Integer, primary_key=True, autoincrement=True)
    asin = Column(String(20), ForeignKey("books.asin", ondelete="CASCADE"), nullable=False, index=True)
    marketplace = Column(String(10), nullable=False)
    source = Column(String(50), nullable=False) # 'amazon_paapi', 'amazon_live'
    data_type = Column(String(30), default="OBSERVED") # OBSERVED, ACTUAL
    bsr = Column(Integer, nullable=True)
    price = Column(Float, nullable=True)
    rating = Column(Float, nullable=True)
    review_count = Column(Integer, nullable=True)
    sales_rank_category = Column(String(255), nullable=True)
    retrieved_at = Column(DateTime, default=datetime.utcnow, index=True)

    book = relationship("Book", back_populates="observations")

class Keyword(Base):
    __tablename__ = "keywords"
    id = Column(Integer, primary_key=True, autoincrement=True)
    keyword = Column(String(255), nullable=False, index=True)
    marketplace = Column(String(10), nullable=False, index=True)
    seed_keyword = Column(String(255), nullable=True)
    opportunity_score = Column(Float, nullable=True)
    competition_score = Column(Float, nullable=True)
    trend_score = Column(Float, nullable=True)
    opportunity_label = Column(String(30), nullable=True) # EXCELLENT, GOOD, MODERATE, WEAK
    cluster_group = Column(String(100), nullable=True)
    recommended_use = Column(String(50), nullable=True) # Title, Subtitle, Backend Keyword, Description, Book Idea
    relevant_books_count = Column(Integer, default=0)
    avg_competitor_reviews = Column(Float, default=0.0)
    last_checked_at = Column(DateTime, default=datetime.utcnow)
    is_tracked = Column(Boolean, default=False, index=True)

    observations = relationship("KeywordObservation", back_populates="keyword_rel", cascade="all, delete-orphan")

class KeywordObservation(Base):
    __tablename__ = "keyword_observations"
    id = Column(Integer, primary_key=True, autoincrement=True)
    keyword_id = Column(Integer, ForeignKey("keywords.id", ondelete="CASCADE"), nullable=False, index=True)
    source = Column(String(50), nullable=False)
    search_volume_indicator = Column(String(50), default="MEDIUM") # HIGH, MEDIUM, LOW, EMERGING
    observed_results_count = Column(Integer, default=0)
    top_competitors_avg_bsr = Column(Integer, nullable=True)
    retrieved_at = Column(DateTime, default=datetime.utcnow)

    keyword_rel = relationship("Keyword", back_populates="observations")

class Niche(Base):
    __tablename__ = "niches"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False, index=True)
    marketplace = Column(String(10), nullable=False, default="US")
    category = Column(String(255), nullable=True)
    opportunity_score = Column(Float, nullable=True)
    competition_level = Column(String(30), default="MODERATE") # VERY_EASY, EASY, MODERATE, DIFFICULT, VERY_DIFFICULT
    trend_status = Column(String(30), default="STABLE") # RISING, GROWING, STABLE, DECLINING
    avg_price = Column(Float, default=0.0)
    avg_reviews = Column(Float, default=0.0)
    avg_bsr = Column(Integer, default=0)
    new_book_penetration_rate = Column(Float, default=0.0)
    content_gap_summary = Column(Text, nullable=True)
    cover_gap_summary = Column(Text, nullable=True)
    last_updated_at = Column(DateTime, default=datetime.utcnow)

class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    event_date = Column(Date, nullable=False)
    prep_window_start = Column(Date, nullable=False)
    marketplace = Column(String(10), default="US")
    category = Column(String(100), default="Seasonal")
    related_niches_json = Column(Text, default="[]")
    keyword_opportunities_json = Column(Text, default="[]")
    evidence_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    niche = Column(String(255), nullable=False)
    target_audience = Column(String(255), nullable=True)
    marketplace = Column(String(10), default="US")
    status = Column(String(50), default="RESEARCH") # RESEARCH, DRAFTING, READY_TO_PUBLISH
    seo_data_json = Column(Text, default="{}")
    cover_prompt_json = Column(Text, default="{}")
    ranking_strategy_json = Column(Text, default="{}")
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ProjectBook(Base):
    __tablename__ = "project_books"
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True)
    asin = Column(String(20), primary_key=True)
    role = Column(String(50), default="DIRECT_COMPETITOR") # BENCHMARK, DIRECT_COMPETITOR, INSPIRATION

class ProjectKeyword(Base):
    __tablename__ = "project_keywords"
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True)
    keyword_id = Column(Integer, ForeignKey("keywords.id", ondelete="CASCADE"), primary_key=True)
    target_placement = Column(String(50), default="TITLE")

class Watchlist(Base):
    __tablename__ = "watchlists"
    id = Column(Integer, primary_key=True, autoincrement=True)
    item_type = Column(String(30), nullable=False) # 'BOOK', 'KEYWORD', 'NICHE'
    item_id = Column(String(100), nullable=False) # ASIN, keyword string, or niche name
    marketplace = Column(String(10), default="US")
    label = Column(String(255), nullable=True)
    baseline_metrics_json = Column(Text, default="{}")
    current_metrics_json = Column(Text, default="{}")
    last_checked_at = Column(DateTime, default=datetime.utcnow)

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, autoincrement=True)
    alert_type = Column(String(50), nullable=False) # BSR_CHANGE, REVIEW_SURGE, NEW_COMPETITOR, EVENT_UPCOMING
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String(20), default="INFO") # INFO, SUCCESS, WARNING
    is_read = Column(Boolean, default=False)
    source_entity_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class SystemLog(Base):
    __tablename__ = "system_logs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    level = Column(String(20), default="INFO") # INFO, WARN, ERROR, AUDIT
    component = Column(String(50), nullable=False)
    message = Column(Text, nullable=False)
    details_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class SearchHistory(Base):
    __tablename__ = "search_history"
    id = Column(Integer, primary_key=True, autoincrement=True)
    query = Column(String(255), nullable=False)
    query_type = Column(String(50), nullable=False) # BOOK_SEARCH, KEYWORD_RESEARCH, NICHE_ANALYSIS
    marketplace = Column(String(10), default="US")
    results_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
