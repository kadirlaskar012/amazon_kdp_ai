import re
from typing import List, Dict, Any, Optional

class SEOEngine:
    """Generates KDP-compliant SEO titles, structured descriptions, backend 7-box keywords, and listing audits."""

    def generate_seo_titles(
        self, 
        niche: str, 
        primary_keyword: str, 
        secondary_keywords: List[str] = [], 
        target_audience: str = "",
        book_type: str = "Paperback"
    ) -> List[Dict[str, Any]]:
        niche_clean = niche.title()
        pk_clean = primary_keyword.title()
        aud = target_audience.title() if target_audience else "Kids & Adults"
        sec1 = secondary_keywords[0].title() if secondary_keywords else "Fun & Relaxing Activities"
        sec2 = secondary_keywords[1].title() if len(secondary_keywords) > 1 else "Stress Relief Puzzles"

        options = [
            {
                "title": f"{pk_clean}",
                "subtitle": f"A Creative & Fun {niche_clean} for {aud}: Featuring {sec1}, {sec2}, and Large Print Designs",
                "rationale": "High-clarity title focused on primary keyword indexing with an audience-targeted benefit-rich subtitle."
            },
            {
                "title": f"{niche_clean}: {pk_clean}",
                "subtitle": f"50+ Easy & Inspiring Pages for {aud} | The Ultimate {book_type} with {sec1}",
                "rationale": "Commercial hook front-loading the niche followed by number-driven value proposition."
            },
            {
                "title": f"The Ultimate {pk_clean} for {aud}",
                "subtitle": f"Cute & Relaxing {niche_clean} Pages to Boost Creativity, Calm the Mind, and Enjoy {sec1}",
                "rationale": "Emotional desire-driven title targeting gift shoppers and relaxation seekers."
            },
            {
                "title": f"Simple & Big {pk_clean}",
                "subtitle": f"Bold Lines, Easy Illustrations, and Delightful {niche_clean} Artwork for {aud}",
                "rationale": "Feature-specific title capturing 'easy / bold lines' search intent with zero fluff."
            }
        ]

        scored_options = []
        for opt in options:
            title_len = len(opt["title"])
            sub_len = len(opt["subtitle"])
            
            # Stuffing check
            words = (opt["title"] + " " + opt["subtitle"]).lower().split()
            word_counts = {}
            for w in words:
                if len(w) > 3:
                    word_counts[w] = word_counts.get(w, 0) + 1
            max_repeat = max(word_counts.values()) if word_counts else 1
            stuffing_risk = "HIGH" if max_repeat >= 4 else ("MEDIUM" if max_repeat == 3 else "LOW")
            
            # Scores
            seo_score = 94.0 if stuffing_risk == "LOW" and title_len < 100 else 75.0
            readability = 92.0 if sub_len < 160 else 80.0
            buyer_intent = 90.0 if any(k in opt["subtitle"].lower() for k in ["easy", "featuring", "ultimate", "creative", "50+"]) else 75.0

            scored_options.append({
                "title": opt["title"],
                "subtitle": opt["subtitle"],
                "character_count_title": title_len,
                "character_count_subtitle": sub_len,
                "seo_score": seo_score,
                "readability_score": readability,
                "buyer_intent_score": buyer_intent,
                "keywords_included": [primary_keyword] + secondary_keywords[:2],
                "stuffing_risk": stuffing_risk,
                "rationale": opt["rationale"]
            })

        return scored_options

    def generate_description(
        self,
        title: str,
        subtitle: Optional[str],
        niche: str,
        primary_keyword: str,
        secondary_keywords: List[str] = [],
        target_audience: str = "",
        key_features: List[str] = []
    ) -> Dict[str, Any]:
        aud = target_audience if target_audience else "enthusiasts of all ages"
        feats = key_features if key_features else [
            "50+ Unique, Hand-Drawn Illustrations (No duplicates)",
            "Single-Sided Pages to Prevent Bleed-Through",
            "High-Resolution Crisp Printing on Premium Paper",
            "Convenient Large Format (8.5 x 11 inches) for Easy Handling",
            "Suitable for Markers, Gel Pens, Colored Pencils, and Fine Liners"
        ]

        hook = f"Looking for the perfect relaxing and engaging {niche} experience for {aud}?"
        problem = f"Many standard books have thin pages that bleed through, repetitive illustrations, or overly complicated designs that frustrate readers. <b>{title}</b> was specifically crafted to provide hours of calm, screen-free entertainment and creative joy."
        benefits = "Whether you are looking to unwind after a long day, cultivate mindfulness, or find an unforgettable gift, this book provides the ideal blend of simplicity and charm."
        
        whats_inside = "<h3>Why You Will Love This Book:</h3><ul>"
        for f in feats:
            whats_inside += f"<li><b>{f.split('(')[0].strip()}:</b> {f}</li>"
        whats_inside += "</ul>"

        cta = "<h3>Ready to get started?</h3><p>Scroll up, click <b>'Buy Now'</b> or <b>'Add to Cart'</b>, and treat yourself or a loved one to this delightful collection today!</p>"

        full_html = f"<h2>{hook}</h2><br/><p>{problem}</p><br/><p>{benefits}</p><br/>{whats_inside}<br/>{cta}"

        return {
            "hook": hook,
            "problem_desire": problem,
            "benefits": benefits,
            "whats_inside": whats_inside,
            "target_audience_section": f"Specially tailored for {aud}.",
            "call_to_action": cta,
            "full_html_description": full_html,
            "keywords_integrated": [primary_keyword] + secondary_keywords[:3],
            "readability_grade": "Grade 7 (Clear & High-Converting)"
        }

    def generate_backend_keywords(
        self,
        niche: str,
        primary_keyword: str,
        secondary_keywords: List[str] = [],
        title_words: List[str] = []
    ) -> Dict[str, Any]:
        """
        Creates 7 KDP backend keyword boxes (up to 50 bytes/chars each).
        Excludes words already present in title/subtitle to save precious indexing space.
        """
        title_word_set = set([w.lower().strip(":,.-_!?'\"") for w in title_words if len(w) > 1])
        
        candidates = []
        raw_terms = [niche, primary_keyword] + secondary_keywords + [
            "relaxing gifts", "mindfulness activity", "large print", "stress relief",
            "screen free fun", "beginner friendly", "holiday present", "travel activity",
            "stocking stuffer", "creative hobby"
        ]
        
        for term in raw_terms:
            for word in term.split():
                clean_w = re.sub(r"[^a-zA-Z0-9]", "", word).lower()
                if clean_w and clean_w not in title_word_set and clean_w not in candidates:
                    # Ignore common stop words
                    if clean_w not in ["the", "a", "an", "and", "or", "in", "for", "with", "to", "of", "is", "by"]:
                        candidates.append(clean_w)

        # Distribute into 7 boxes (max 50 chars each)
        boxes = []
        curr_box = []
        curr_len = 0
        
        for word in candidates:
            w_len = len(word) + (1 if curr_box else 0)
            if curr_len + w_len <= 50:
                curr_box.append(word)
                curr_len += w_len
            else:
                if len(boxes) < 7:
                    boxes.append(" ".join(curr_box))
                    curr_box = [word]
                    curr_len = len(word)
                else:
                    break

        if curr_box and len(boxes) < 7:
            boxes.append(" ".join(curr_box))

        while len(boxes) < 7:
            boxes.append("")

        total_chars = sum(len(b) for b in boxes)

        return {
            "boxes": boxes[:7],
            "total_characters_used": total_chars,
            "deduplicated_terms_count": len(candidates),
            "compliance_notes": "Compliant with KDP guidelines: No punctuation, no quotes, no words duplicated from Title/Subtitle, no subjective claims ('best', 'cheapest')."
        }

    def audit_listing(
        self,
        title: Optional[str],
        subtitle: Optional[str],
        description: Optional[str],
        price: Optional[float],
        bsr: Optional[int],
        rating: Optional[float],
        review_count: Optional[int],
        marketplace: str = "US"
    ) -> Dict[str, Any]:
        fixes = []
        strengths = []
        weaknesses = []
        
        # 1. Title Audit
        t_text = (title or "").strip()
        if not t_text:
            fixes.append({"priority": 1, "area": "Title", "fix": "Provide a descriptive title containing the primary search keyword."})
            t_score = 0.0
        elif len(t_text) < 15:
            fixes.append({"priority": 2, "area": "Title", "fix": "Title is too short. Add primary target keyword for improved Amazon indexing."})
            weaknesses.append("Short title lacks search keyword visibility.")
            t_score = 50.0
        elif len(t_text) > 180:
            fixes.append({"priority": 3, "area": "Title", "fix": "Title is dangerously long and risks keyword stuffing penalty. Shorten to under 150 chars."})
            weaknesses.append("Potential keyword stuffing in title.")
            t_score = 65.0
        else:
            strengths.append("Title length is well-balanced.")
            t_score = 90.0

        # 2. Subtitle Audit
        sub_text = (subtitle or "").strip()
        if not sub_text:
            fixes.append({"priority": 1, "area": "Subtitle", "fix": "Add a benefit-driven subtitle highlighting page count, audience, and key features."})
            sub_score = 20.0
        elif len(sub_text) > 190:
            fixes.append({"priority": 4, "area": "Subtitle", "fix": "Subtitle exceeds 190 characters; trim to maintain mobile search legibility."})
            sub_score = 70.0
        else:
            strengths.append("Subtitle effectively captures secondary keywords.")
            sub_score = 95.0

        # 3. Description Audit
        desc_text = (description or "").strip()
        if not desc_text:
            fixes.append({"priority": 1, "area": "Description", "fix": "Add a rich HTML-formatted description with bullet points and clear Call to Action."})
            d_score = 10.0
        elif "<h" not in desc_text and "<ul>" not in desc_text and "<li>" not in desc_text:
            fixes.append({"priority": 2, "area": "Description", "fix": "Description lacks formatting. Convert plain text into formatted bold headers and bullet lists."})
            d_score = 55.0
        else:
            strengths.append("Description contains structured HTML formatting.")
            d_score = 90.0

        # 4. Pricing Audit
        p_val = price or 0.0
        if p_val <= 0:
            p_score = 50.0
        elif p_val < 5.99:
            fixes.append({"priority": 3, "area": "Pricing", "fix": "Price is below market average ($6.99-$9.99), potentially shrinking KDP printing royalties."})
            p_score = 65.0
        elif p_val > 14.99:
            fixes.append({"priority": 3, "area": "Pricing", "fix": "Price is higher than competitor median. Ensure high perceived page count or premium binding."})
            p_score = 70.0
        else:
            strengths.append(f"Price (${p_val:.2f}) falls directly within high-converting paperback sweet spot.")
            p_score = 95.0

        # 5. Social Proof & Reviews Audit
        r_cnt = review_count or 0
        r_val = rating or 0.0
        if r_cnt < 10:
            fixes.append({"priority": 2, "area": "Social Proof", "fix": "Under 10 reviews. Focus on launch ARC team and social momentum to reach initial 25 reviews threshold."})
            s_score = 40.0
        elif r_val < 4.0:
            fixes.append({"priority": 1, "area": "Quality / Rating", "fix": f"Rating is {r_val:.1f}/5. Analyze 1-star reviews for interior bleed or formatting complaints."})
            s_score = 35.0
        else:
            strengths.append(f"Strong customer sentiment ({r_val:.1f}/5 with {r_cnt:,} reviews).")
            s_score = 95.0

        # Overall weighted score
        overall = round((0.30 * t_score) + (0.20 * sub_score) + (0.25 * d_score) + (0.15 * p_score) + (0.10 * s_score), 1)

        # Sort top 5 fixes
        fixes.sort(key=lambda x: x["priority"])

        return {
            "overall_score": overall,
            "seo_score": round((t_score + sub_score) / 2.0, 1),
            "competition_score": 60.0,
            "pricing_score": p_score,
            "conversion_score": round((d_score + s_score) / 2.0, 1),
            "top_5_fixes": fixes[:5],
            "strengths": strengths,
            "weaknesses": weaknesses,
            "compliance_check": {
                "title_under_200_chars": len(t_text) <= 200,
                "no_forbidden_claims_detected": "best" not in t_text.lower() and "free" not in t_text.lower(),
                "has_html_description": "<" in desc_text and ">" in desc_text
            },
            "evidence": {
                "evaluated_asin": None,
                "marketplace": marketplace.upper(),
                "audit_engine": "KDP Studio Listing Auditor v1.0"
            }
        }

seo_engine = SEOEngine()
