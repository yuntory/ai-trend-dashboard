@echo off
cd /d "%~dp0"

echo [System] Starting Integrated Scrapers...

echo [1/3] Running Zeta Scraper...
node scripts/scrape-zeta.mjs

echo [2/3] Running Crack Scraper...
node scripts/scrape-crack.mjs

echo [3/3] Running KakaoPage Scraper...
node scripts/scrape-kakaopage.mjs

echo [System] All Tasks Completed!
pause