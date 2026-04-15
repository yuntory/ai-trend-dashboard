from __future__ import annotations

import hashlib
import os
import random
import re
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Iterable
from zoneinfo import ZoneInfo

from dotenv import load_dotenv
from playwright.sync_api import Locator, Page, sync_playwright
from supabase import Client, create_client


load_dotenv()


@dataclass(frozen=True)
class ScraperConfig:
    target_url: str
    service_name: str
    period: str
    card_selector: str
    name_selector: str
    image_selector: str
    chat_count_selector: str
    tag_selector: str
    table_name: str
    upsert_key: str
    max_items: int


def get_config() -> ScraperConfig:
    return ScraperConfig(
        target_url=require_env("SCRAPER_TARGET_URL"),
        service_name=os.getenv("SCRAPER_SERVICE_NAME", "제타"),
        period=os.getenv("SCRAPER_PERIOD", "daily"),
        card_selector=os.getenv("SCRAPER_CARD_SELECTOR", ".ranking-card"),
        name_selector=os.getenv("SCRAPER_NAME_SELECTOR", ".character-name"),
        image_selector=os.getenv("SCRAPER_IMAGE_SELECTOR", "img.character-image"),
        chat_count_selector=os.getenv("SCRAPER_CHAT_COUNT_SELECTOR", ".chat-count"),
        tag_selector=os.getenv("SCRAPER_TAG_SELECTOR", ".genre-tag"),
        table_name=os.getenv("SUPABASE_TABLE_NAME", "characters_trend"),
        upsert_key=os.getenv("SUPABASE_UPSERT_KEY", "source_key,trend_date,period"),
        max_items=int(os.getenv("SCRAPER_MAX_ITEMS", "20")),
    )


def require_env(key: str) -> str:
    value = os.getenv(key)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {key}")
    return value


def random_delay(min_seconds: float = 1.0, max_seconds: float = 3.0) -> None:
    time.sleep(random.uniform(min_seconds, max_seconds))


def clean_text(value: str | None) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def parse_metric_count(raw_text: str) -> int:
    text = clean_text(raw_text).lower().replace(",", "")
    if not text:
        return 0

    match = re.search(r"(\d+(?:\.\d+)?)\s*([k만천]?)", text)
    if not match:
        digits = re.sub(r"\D", "", text)
        return int(digits) if digits else 0

    number = float(match.group(1))
    unit = match.group(2)
    multiplier = {
        "k": 1_000,
        "천": 1_000,
        "만": 10_000,
    }.get(unit, 1)
    return int(number * multiplier)


def first_text(card: Locator, selector: str) -> str:
    target = card.locator(selector).first
    return clean_text(target.inner_text(timeout=3_000)) if target.count() else ""


def all_texts(card: Locator, selector: str) -> list[str]:
    targets = card.locator(selector)
    return [clean_text(item) for item in targets.all_inner_texts() if clean_text(item)]


def image_url(card: Locator, selector: str) -> str:
    image = card.locator(selector).first
    if not image.count():
        return ""

    return (
        image.get_attribute("src")
        or image.get_attribute("data-src")
        or image.get_attribute("srcset")
        or ""
    )


def build_source_key(service_name: str, character_name: str, image: str) -> str:
    raw_key = f"{service_name}:{character_name}:{image}".encode("utf-8")
    return hashlib.sha256(raw_key).hexdigest()


def parse_character_cards(page: Page, config: ScraperConfig) -> list[dict]:
    page.wait_for_selector(config.card_selector, timeout=30_000)
    cards = page.locator(config.card_selector)
    scraped_at = datetime.now(timezone.utc).isoformat()
    trend_date = datetime.now(ZoneInfo("Asia/Seoul")).date().isoformat()
    rows: list[dict] = []

    for index in range(min(cards.count(), config.max_items)):
        card = cards.nth(index)
        random_delay()

        character_name = first_text(card, config.name_selector)
        image = image_url(card, config.image_selector)
        chat_count = parse_metric_count(first_text(card, config.chat_count_selector))
        genre_tags = all_texts(card, config.tag_selector)[:5]

        if not character_name:
            continue

        rows.append(
            {
                "source_key": build_source_key(config.service_name, character_name, image),
                "character_name": character_name,
                "image_url": image,
                "service_name": config.service_name,
                "genre_tags": genre_tags,
                "chat_count": chat_count,
                "ranking": index + 1,
                "period": config.period,
                "trend_date": trend_date,
                "scraped_at": scraped_at,
            }
        )

    return rows


def create_supabase_client() -> Client:
    url = require_env("SUPABASE_URL")
    key = require_env("SUPABASE_SERVICE_ROLE_KEY")
    return create_client(url, key)


def upsert_rows(client: Client, table_name: str, rows: Iterable[dict], upsert_key: str) -> None:
    payload = list(rows)
    if not payload:
        print("No rows scraped. Skipping Supabase upsert.")
        return

    response = client.table(table_name).upsert(payload, on_conflict=upsert_key).execute()
    print(f"Upserted {len(payload)} rows into {table_name}.")
    if getattr(response, "data", None) is not None:
        print(f"Supabase returned {len(response.data)} rows.")


def scrape() -> list[dict]:
    config = get_config()

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        context = browser.new_context(
            locale="ko-KR",
            viewport={"width": 1440, "height": 1200},
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
        )
        page = context.new_page()

        print(f"Opening ranking page: {config.target_url}")
        page.goto(config.target_url, wait_until="domcontentloaded", timeout=60_000)
        random_delay()

        rows = parse_character_cards(page, config)
        context.close()
        browser.close()

    return rows


def main() -> None:
    config = get_config()
    rows = scrape()
    upsert_rows(create_supabase_client(), config.table_name, rows, config.upsert_key)


if __name__ == "__main__":
    main()
