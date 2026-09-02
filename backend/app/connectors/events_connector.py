from datetime import date, timedelta
from typing import List, Dict, Any

class EventsConnector:
    """Dynamically generates upcoming calendar events, prep windows, and seasonal opportunities for any year."""

    def get_upcoming_events(self, reference_date: date = None, marketplace: str = "US", days_ahead: int = 180) -> List[Dict[str, Any]]:
        if reference_date is None:
            reference_date = date.today()
            
        current_year = reference_date.year
        candidate_years = [current_year, current_year + 1]
        
        # Base event definitions with dynamic date computation
        event_defs = [
            {
                "name": "Halloween",
                "month": 10, "day": 31,
                "category": "Holiday / Seasonal",
                "prep_lead_days": 75,
                "niches": ["Halloween Coloring Book", "Spooky Activity Book for Kids", "Halloween Word Search", "Haunted House Cut and Paste"],
                "keywords": ["halloween coloring book for toddlers", "spooky puzzles", "halloween activity book kids 4-8", "halloween treats logbook"]
            },
            {
                "name": "Thanksgiving & Fall Harvest",
                "month": 11, "day": 26, # Approximate late November
                "category": "Holiday / Seasonal",
                "prep_lead_days": 60,
                "niches": ["Thanksgiving Coloring Book", "Gratitude Journal for Kids", "Autumn Crossword Puzzle Book", "Fall Craft Activity Book"],
                "keywords": ["thanksgiving coloring book for kids", "daily gratitude journal 2026", "autumn activity book", "turkey coloring book"]
            },
            {
                "name": "Christmas & Holiday Season",
                "month": 12, "day": 25,
                "category": "Gift / Mega Holiday",
                "prep_lead_days": 90,
                "niches": ["Christmas Coloring Book", "Stocking Stuffer Activity Book", "Santa Word Search", "Winter Wonderland Planner", "Christmas Dot Markers"],
                "keywords": ["christmas coloring book for kids", "stocking stuffers for adults", "christmas activity book toddlers", "winter puzzle book"]
            },
            {
                "name": "New Year & Goal Planning",
                "month": 1, "day": 1,
                "category": "Productivity / Resolutions",
                "prep_lead_days": 60,
                "niches": ["Habit Tracker Journal", "Fitness Log Book", "Budget Planner 2026", "Goal Setting Workbook", "Daily Planner Undated"],
                "keywords": ["habit tracker journal 2026", "financial budget planner", "workout log book for men", "manifestation journal"]
            },
            {
                "name": "Valentine's Day",
                "month": 2, "day": 14,
                "category": "Gift / Holiday",
                "prep_lead_days": 60,
                "niches": ["Valentine's Coloring Book", "Couples Journal", "Love Coupons Book", "Kids Valentine Activity Book"],
                "keywords": ["valentines coloring book toddlers", "romantic prompts journal", "valentines day activity book", "i love you because journal"]
            },
            {
                "name": "Mother's Day",
                "month": 5, "day": 10, # Second Sunday in May approx
                "category": "Gift Occasion",
                "prep_lead_days": 60,
                "niches": ["Mom Guided Memory Journal", "Mother's Day Coloring Book", "Grandma Tell Me Your Story", "Self-Care Journal for Moms"],
                "keywords": ["mom i want to hear your story", "mothers day gift book", "mindfulness journal for busy moms", "grandma memory book"]
            },
            {
                "name": "Father's Day",
                "month": 6, "day": 21,
                "category": "Gift Occasion",
                "prep_lead_days": 60,
                "niches": ["Dad Joke Book", "Father's Memory Journal", "Fishing Log Book", "Woodworking Project Planner"],
                "keywords": ["dad i want to hear your story", "best dad jokes 2026", "fishing journal and log book", "golf score tracker book"]
            },
            {
                "name": "Back to School",
                "month": 8, "day": 15,
                "category": "Educational / Seasonal",
                "prep_lead_days": 75,
                "niches": ["Handwriting Practice Paper", "Kindergarten Math Workbook", "Homeschool Lesson Planner", "Teacher Lesson Plan Book"],
                "keywords": ["handwriting practice paper for kids", "preschool tracing workbook", "homeschool planner 2026-2027", "teacher gradebook"]
            },
            {
                "name": "Easter & Spring Celebrations",
                "month": 4, "day": 5, # Approx spring
                "category": "Holiday / Spring",
                "prep_lead_days": 60,
                "niches": ["Easter Basket Stuffer Coloring", "Spring Scissor Skills", "Easter Word Scramble", "Spring Garden Planner"],
                "keywords": ["easter coloring book for kids", "easter basket stuffers for toddlers", "spring activity book", "gardening log book"]
            }
        ]
        
        events = []
        for year in candidate_years:
            for edef in event_defs:
                try:
                    ev_date = date(year, edef["month"], edef["day"])
                except Exception:
                    ev_date = date(year, edef["month"], 28)
                    
                prep_start = ev_date - timedelta(days=edef["prep_lead_days"])
                
                days_until_event = (ev_date - reference_date).days
                days_until_prep = (prep_start - reference_date).days
                
                # Include if within upcoming target window
                if 0 <= days_until_event <= days_ahead or (days_until_event >= 0 and days_until_prep <= 30):
                    events.append({
                        "name": f"{edef['name']} {year}",
                        "event_date": ev_date,
                        "prep_window_start": prep_start,
                        "days_until_event": days_until_event,
                        "days_until_prep": days_until_prep,
                        "marketplace": marketplace.upper(),
                        "category": edef["category"],
                        "related_niches": edef["niches"],
                        "keyword_opportunities": edef["keywords"],
                        "evidence_notes": f"Historical KDP sales velocity for this holiday starts surging {edef['prep_lead_days']} days prior as early shoppers and Amazon indexing take effect."
                    })
                    
        events.sort(key=lambda x: x["days_until_event"])
        return events

events_connector = EventsConnector()
