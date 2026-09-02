import asyncio
import json
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select
from backend.app.core.database import AsyncSessionLocal
from backend.app.models.db_models import Watchlist, Book, BookObservation, Alert, SystemLog
from backend.app.connectors.amazon_live import amazon_live_connector

class SchedulerService:
    """Manages scheduled background refresh of watchlists, books, and generates alerts on notable changes."""

    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.is_running = False

    def start(self):
        if not self.is_running:
            self.scheduler.add_job(self.refresh_watchlists_job, "interval", hours=6, id="refresh_watchlists")
            self.scheduler.start()
            self.is_running = True

    def stop(self):
        if self.is_running:
            self.scheduler.shutdown()
            self.is_running = False

    async def refresh_watchlists_job(self):
        async with AsyncSessionLocal() as session:
            try:
                # Query all active watchlists
                stmt = select(Watchlist)
                res = await session.execute(stmt)
                watchlists = res.scalars().all()

                for item in watchlists:
                    if item.item_type == "BOOK":
                        asin = item.item_id
                        mp = item.marketplace
                        detail_res = await amazon_live_connector.get_book_details(asin, mp)
                        if detail_res.success and detail_res.data:
                            book_data = detail_res.data
                            curr_bsr = book_data.get("current_bsr")
                            curr_revs = book_data.get("current_review_count")
                            curr_price = book_data.get("price")

                            # Parse previous metrics
                            prev_metrics = json.loads(item.current_metrics_json) if item.current_metrics_json else {}
                            prev_bsr = prev_metrics.get("bsr")
                            prev_revs = prev_metrics.get("reviews")
                            prev_price = prev_metrics.get("price")

                            # Check for notable changes & alert triggers
                            if prev_bsr and curr_bsr and abs(curr_bsr - prev_bsr) >= 5000:
                                alert = Alert(
                                    alert_type="BSR_CHANGE",
                                    title=f"BSR Shift for ASIN {asin}",
                                    message=f"BSR moved from #{prev_bsr:,} to #{curr_bsr:,} ({'improved' if curr_bsr < prev_bsr else 'dropped'}).",
                                    severity="INFO" if curr_bsr < prev_bsr else "WARNING",
                                    source_entity_id=asin
                                )
                                session.add(alert)

                            if prev_revs is not None and curr_revs is not None and (curr_revs - prev_revs) >= 5:
                                alert = Alert(
                                    alert_type="REVIEW_SURGE",
                                    title=f"Review Surge for ASIN {asin}",
                                    message=f"Gained +{curr_revs - prev_revs} new reviews ({prev_revs} -> {curr_revs}).",
                                    severity="SUCCESS",
                                    source_entity_id=asin
                                )
                                session.add(alert)

                            # Record new observation
                            obs = BookObservation(
                                asin=asin,
                                marketplace=mp,
                                source="amazon_live",
                                data_type="OBSERVED",
                                bsr=curr_bsr,
                                price=curr_price,
                                rating=book_data.get("current_rating"),
                                review_count=curr_revs,
                                retrieved_at=datetime.utcnow()
                            )
                            session.add(obs)

                            # Update watchlist item
                            new_metrics = {
                                "bsr": curr_bsr,
                                "reviews": curr_revs,
                                "price": curr_price,
                                "rating": book_data.get("current_rating"),
                                "updated_at": datetime.utcnow().isoformat()
                            }
                            item.current_metrics_json = json.dumps(new_metrics)
                            item.last_checked_at = datetime.utcnow()

                log = SystemLog(
                    level="INFO",
                    component="Scheduler",
                    message=f"Completed automated watchlist background refresh for {len(watchlists)} items."
                )
                session.add(log)
                await session.commit()
            except Exception as e:
                await session.rollback()

scheduler_service = SchedulerService()
