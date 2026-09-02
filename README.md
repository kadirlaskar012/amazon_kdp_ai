# KDP Intelligence Studio 🚀

**KDP Intelligence Studio** is an advanced **Amazon KDP Research, Keyword, Competition, Trend, Book-Idea, SEO, and Cover Intelligence platform** engineered for Windows 10/11 with Supabase Cloud Database and high-speed Cloud AI.

---

## ⚡ Key Highlights & Principles

* **Zero Mock Data Guarantee**: No fake books, no fabricated BSRs, no synthetic search volume. All metrics come directly from official Amazon APIs, live search endpoints, autocomplete suggestions, and verified observational records.
* **Supabase Cloud Database**: Stores all your research, keywords, book ideas, and historical queries in the cloud so you never have to regenerate data.
* **100% Cloud-Powered AI**: Powered by ultra-fast Cloud AI (Groq / OpenAI) with zero CPU/RAM load on your PC (~0.3s response time).
* **Complete Data Transparency**: Every data point is tagged with an audit badge: `LIVE`, `CACHED`, `OBSERVED`, `CALCULATED`, `ESTIMATED`, `AI ANALYSIS`, or `UNAVAILABLE`.
* **10 Global Amazon Marketplaces**: Switch seamlessly between US, UK, DE, CA, AU, FR, IT, ES, IN, and JP.

---

## 🛠️ System Architecture

```
                                  [ Browser / Next.js 14 UI ]
                                              │
                                              ▼
                                 [ FastAPI Python Backend ]
                                ┌─────────────┼─────────────┐
                                ▼             ▼             ▼
                      [ Amazon Live &    [ Cloud AI    [ Supabase Cloud
                       Suggest Connectors] (Groq / OpenAI)]  PostgreSQL ]
```

---

## 🚀 Quick Start (Windows)

### 1. One-Click Setup
Double-click `setup.bat` (or run in terminal):
```cmd
setup.bat
```
This automatically verifies Python 3.10+ and Node.js, installs all required packages, and initializes your environment.

### 2. Launch Application
Double-click `start.bat`:
```cmd
start.bat
```
* **Frontend**: [http://localhost:3000](http://localhost:3000)
* **Backend API Docs**: [http://127.0.0.1:8000/api/v1/docs](http://127.0.0.1:8000/api/v1/docs)

---

## 📦 Core Feature Suite

1. **Dashboard**: Executive health monitor, rising search momentum, approaching seasonal windows, and recent research logs.
2. **Book Finder**: Multi-filter catalog search (BSR, reviews, ratings, price, publication age) with sales velocity estimates.
3. **Book Detail Page**: Full metadata, historical BSR snapshot timeseries, and AI Listing Critiques.
4. **Best Sellers Research**: Category explorer with median reviews and price sweet spots.
5. **Keyword Research Engine**: Live Amazon autocomplete expansion and 0–100 Opportunity Scoring.
6. **Easy-Rank Keyword Finder**: Isolates low-competition keyword gems with competition score $\le 45/100$.
7. **Keyword Semantic Clustering**: Groups search terms into Primary, Long-tail, Intent, Audience, and Seasonal buckets.
8. **Competition Analyzer**: Calculates the *KDP Competition Score* and identifies underserved content and cover gaps.
9. **Trend Research**: Real-time momentum signals and forward-looking query frequency indicators.
10. **Seasonal Opportunity Calendar**: Dynamic holiday dates and preparation lead-time countdowns.
11. **Book Idea Concept Generator**: Data-grounded concepts with title, subtitle, target audience, differentiation, and interior specs.
12. **"What Should I Publish?" Engine**: 10-step multi-factor pipeline generating top 10 ranked publishing concepts.
13. **SEO Studio**: Title & Subtitle Generator, structured HTML Description Builder, and 7-box Backend Keywords Tool.
14. **Listing Auditor**: Listing health evaluation with prioritized Top 5 Fixes.
15. **Cover Intelligence & Maker**: Competitor visual analysis, typography breakdown, and commercial cover prompts.
16. **Ranking Strategy Engine**: Evidence-based 10-point launch and ranking roadmap.
17. **Project Workspaces**: Persistent cloud dossiers storing notes, target keywords, and publishing plans.
18. **Watchlists & Delta Alerts**: Background tracking of BSR drops and review velocity surges.
19. **Reports & Exports**: One-click generation of PDF Dossiers, Excel Spreadsheets, CSVs, and JSON dumps.
20. **Diagnostics & Settings**: Pipeline health monitors and cloud database management.

---

## 🧪 Testing

Run backend tests:
```bash
python -m pytest backend/tests
```
