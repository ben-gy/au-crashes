# Site Plan: Road Crashes (AU)

## Overview
- **Name:** Road Crashes (AU)
- **Repo name:** au-crashes
- **Tagline:** 35 years of Australian road fatality data — searchable, mapped, and visualised

### Naming Convention
Uses country suffix: "Road Crashes (AU)" not "Australian Road Crashes"

## Target Audience
Australian road safety researchers, policy analysts, journalists, council planners, and concerned citizens who want to understand road fatality patterns by location, time, demographics, and contributing factors. People Googling "road deaths Australia by state" or "how many people die on Australian roads" should find this.

## Value Proposition
The ARDD data exists as raw CSV files on data.gov.au with no interactive explorer. This site turns 55,000+ fatality records (1989–2023) into a rich, searchable, visual tool. Users can instantly see which states are most dangerous, whether road deaths are trending down, what times and roads are deadliest, and how demographics play into fatality patterns — all without downloading spreadsheets or writing queries.

## Data Sources
| Source | URL | What it provides | Update frequency | Auth required? |
|--------|-----|-------------------|-----------------|----------------|
| ARDD Fatalities (BITRE via data.gov.au) | https://data.gov.au/data/dataset/australian-road-deaths-database | Individual fatality records with crash type, road user, demographics, location, speed limit, road type | Monthly | No |
| ARDD Fatal Crashes (BITRE via data.gov.au) | Same dataset, different resource | Crash-level records with fatality counts and vehicle involvement | Monthly | No |

## Key Features
1. **Dashboard overview** — headline stats, year-over-year change, sparklines, state ranking
2. **Searchable table** — all 55K+ records, filterable by state, year range, crash type, road user, gender, age group
3. **Trend analysis** — fatalities by year with state breakdown, showing the long-term decline from 1989 to present
4. **State map** — choropleth map of fatalities by state using Leaflet + GeoJSON
5. **Contributing factors** — bar charts of crash type, speed limit, road type, vehicle involvement
6. **Demographics heatmap** — age group × gender cross-reference matrix
7. **Temporal heatmap** — day-of-week × time-of-day matrix showing when crashes happen
8. **State comparison matrix** — states vs. crash types / road users as a heatmap

## Target Audience (detailed)
Primary users are road safety professionals, transport planners, and policy analysts on desktop who need to quickly pull stats for reports or presentations — "how many pedestrian deaths in NSW in 2022?" or "what's the trend for motorcycle fatalities?". Secondary users are journalists researching stories and engaged citizens who want to understand the data behind road safety campaigns. They arrive via Google, expect clean civic design, and need the data to be immediately comprehensible without domain expertise. Most are on desktop, some on tablet. They want fast answers and the ability to drill down.

## Style Direction
**Tone:** Professional/civic — authoritative but accessible
**Colour palette:** Light theme with navy and teal accents. Clean whites and light greys for backgrounds, with a strong navy (#1e3a5f) as the primary accent and a warm amber (#d97706) for warnings/highlights. Red is used sparingly and only for fatality-related emphasis — this is sensitive data about human lives.
**UI density:** Balanced — data-rich but not overwhelming. Cards with clear headings, generous whitespace between sections.
**Dark/light theme:** Light — civic and general-audience tool
**Reference sites for tone:** abs.gov.au (clean government data portal), fuelaustralia.org (simple utility, great SEO)

## Technical Architecture
- **Stack:** Vanilla TypeScript + Vite
- **Data strategy:** Pipeline — GitHub Actions downloads ARDD CSVs monthly, processes into optimized JSON in public/data/
- **Key libraries:** Leaflet (maps), hand-rolled SVG (all charts)

## Layout
- Fixed header (48px) with site name, view tabs, and info button
- Main content area fills remaining viewport height
- Each view tab shows a different visualization
- Footer with data source attribution and benrichardson.dev credit
- Responsive: tabs collapse to dropdown on mobile, charts reflow vertically

## Pages/Views
Single page with tabbed views:
1. Dashboard (default)
2. Table
3. Trends
4. Map
5. Factors
6. Demographics
7. Temporal
8. Comparison

## Visualization Strategy
1. **Dashboard** — summary cards (total fatalities, fatalities per 100K population, year-over-year change, worst state, deadliest time), plus a mini sparkline of the 35-year trend. Provides the "at a glance" overview.
2. **Table** — sortable, filterable, paginated table of all individual fatality records. The raw data exploration view for users who need specific records.
3. **Trends (bar chart)** — stacked bar chart of annual fatalities by state. Shows the long-term decline from 2,800+/year in 1989 to ~1,200/year in 2023. Unique insight: visualises the national road safety success story.
4. **Map** — Leaflet choropleth of fatalities by state (or SA4 region). Geographic distribution at a glance — shows that NSW and Vic dominate raw numbers but remote areas have highest per-capita rates.
5. **Factors (horizontal bar charts)** — crash type (single vs. multiple vehicle), road user type (driver, passenger, pedestrian, cyclist, motorcyclist), speed limit distribution, road type, heavy vehicle involvement. Reveals the structural patterns behind fatalities.
6. **Demographics (cross-reference matrix/heatmap)** — age group rows × gender columns, cell intensity = fatality count. Instantly reveals the massive over-representation of young males (17-25). Unique insight not visible in any single bar chart.
7. **Temporal heatmap** — 7 rows (days of week) × time-of-day columns (Night, Day categories or hourly buckets). Reveals that weekend nights are the deadliest — a pattern invisible in aggregate stats.
8. **State comparison matrix** — states as rows, crash types or road user types as columns, cell intensity = count. Reveals which states have unique patterns (e.g., high pedestrian deaths in urban states, high single-vehicle crashes in remote states).
