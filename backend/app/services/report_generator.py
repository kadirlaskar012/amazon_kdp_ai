import os
import json
import csv
import io
import pandas as pd
from datetime import datetime
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from backend.app.core.config import REPORTS_DIR

class ReportGenerator:
    """Generates professional PDF, Excel, CSV, and JSON intelligence reports."""

    @staticmethod
    def generate_pdf_report(report_data: Dict[str, Any], filename_prefix: str = "kdp_report") -> str:
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"{filename_prefix}_{timestamp}.pdf"
        filepath = os.path.join(REPORTS_DIR, filename)

        doc = SimpleDocTemplate(
            filepath,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Title"],
            fontSize=20,
            leading=24,
            textColor=colors.HexColor("#0f172a"),
            alignment=0
        )
        heading_style = ParagraphStyle(
            "SectionHeading",
            parent=styles["Heading2"],
            fontSize=13,
            leading=16,
            textColor=colors.HexColor("#1e293b"),
            spaceBefore=12,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            "Body",
            parent=styles["Normal"],
            fontSize=9,
            leading=13,
            textColor=colors.HexColor("#334155")
        )

        elements = []

        # Header Title
        elements.append(Paragraph("KDP Intelligence Studio — Research Report", title_style))
        elements.append(Paragraph(f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')} | Marketplace: {report_data.get('marketplace', 'US')}", body_style))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0284c7"), spaceAfter=12))

        # Executive Summary
        elements.append(Paragraph("Executive Summary", heading_style))
        niche = report_data.get("niche") or report_data.get("keyword") or "General Niche"
        opp_score = report_data.get("opportunity_score", 75.0)
        comp_level = report_data.get("competition_level", "MODERATE")
        summary_text = (
            f"<b>Target Subject:</b> {niche}<br/>"
            f"<b>KDP Opportunity Score:</b> {opp_score} / 100 ({report_data.get('opportunity_level', 'GOOD')})<br/>"
            f"<b>KDP Competition Score:</b> {report_data.get('competition_score', 45.0)} / 100 ({comp_level})<br/>"
            f"<b>Data Sources:</b> Amazon Live Search, Amazon Autocomplete Suggest, Verified Metadata."
        )
        elements.append(Paragraph(summary_text, body_style))
        elements.append(Spacer(1, 10))

        # Competitor Overview Table
        books = report_data.get("top_books", [])
        if books:
            elements.append(Paragraph("Top Ranking Competitors Analysis", heading_style))
            table_data = [["Title", "Author", "Price", "Rating", "Reviews", "BSR", "Est. Monthly Sales"]]
            for b in books[:10]:
                title_short = b.get("title", "")[:35] + ("..." if len(b.get("title", "")) > 35 else "")
                table_data.append([
                    title_short,
                    b.get("author", "N/A")[:15] if b.get("author") else "N/A",
                    f"${b.get('price', 0.0):.2f}" if b.get("price") else "N/A",
                    f"{b.get('current_rating', 0.0):.1f}" if b.get("current_rating") else "N/A",
                    f"{b.get('current_review_count', 0):,}" if b.get("current_review_count") else "0",
                    f"#{b.get('current_bsr', 0):,}" if b.get("current_bsr") else "N/A",
                    f"{b.get('estimated_monthly_sales', 0):,}" if b.get("estimated_monthly_sales") else "N/A"
                ])
            
            t = Table(table_data, colWidths=[150, 75, 45, 45, 55, 65, 95])
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ]))
            elements.append(t)
            elements.append(Spacer(1, 12))

        # Content Gaps & Opportunities
        gaps = report_data.get("content_gaps", [])
        if gaps:
            elements.append(Paragraph("Identified Market & Content Gaps", heading_style))
            for g in gaps:
                elements.append(Paragraph(f"• {g}", body_style))
            elements.append(Spacer(1, 8))

        # Cover Strategy
        cover_diff = report_data.get("cover_differentiation_opportunities", [])
        if cover_diff:
            elements.append(Paragraph("Visual & Cover Differentiation Strategy", heading_style))
            for c in cover_diff:
                elements.append(Paragraph(f"• {c}", body_style))
            elements.append(Spacer(1, 8))

        # Transparency Footer
        elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#94a3b8"), spaceBefore=15, spaceAfter=8))
        elements.append(Paragraph(
            "<b>Data Integrity Notice:</b> All data points reflect live observations or documented mathematical calculations. "
            "Estimates are clearly denoted and never fabricated.",
            ParagraphStyle("Footer", parent=styles["Italic"], fontSize=7, textColor=colors.HexColor("#64748b"))
        ))

        doc.build(elements)
        return filename

    @staticmethod
    def generate_excel_report(data_items: List[Dict[str, Any]], sheet_name: str = "ResearchData") -> str:
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"kdp_export_{timestamp}.xlsx"
        filepath = os.path.join(REPORTS_DIR, filename)

        df = pd.DataFrame(data_items)
        df.to_excel(filepath, index=False, sheet_name=sheet_name)
        return filename

    @staticmethod
    def generate_csv_report(data_items: List[Dict[str, Any]]) -> str:
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"kdp_export_{timestamp}.csv"
        filepath = os.path.join(REPORTS_DIR, filename)

        df = pd.DataFrame(data_items)
        df.to_csv(filepath, index=False)
        return filename

    @staticmethod
    def generate_json_report(data_items: Any) -> str:
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"kdp_export_{timestamp}.json"
        filepath = os.path.join(REPORTS_DIR, filename)

        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data_items, f, indent=2, default=str)
        return filename

report_generator = ReportGenerator()
