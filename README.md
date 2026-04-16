# Road Crashes (AU)

**35 years of Australian road fatality data — searchable, mapped, and visualised**

🔗 **Live:** [https://au-crashes.benrichardson.dev](https://au-crashes.benrichardson.dev)

## What is this?

Road Crashes (AU) is an interactive explorer for the Australian Road Deaths Database (ARDD), maintained by the Bureau of Infrastructure and Transport Research Economics (BITRE). It turns 55,000+ individual fatality records spanning 1989–2023 into a rich, searchable, visual tool.

The raw data exists as CSV files on data.gov.au with no interactive interface. This site provides eight distinct views for exploring the data: a dashboard with headline statistics, a searchable table, year-by-year trend analysis, a state choropleth map, contributing factor breakdowns, demographic cross-reference heatmaps, temporal heatmaps showing when crashes occur, and state comparison matrices.

Every road death recorded in Australia over the past 35 years is searchable by state, crash type, road user type, demographics, speed limit, road type, remoteness area, and local government area.

## Who is this for?

Road safety researchers, transport planners, policy analysts, journalists, and engaged citizens who want to understand road fatality patterns across Australia. Whether you're writing a report on road safety trends, researching which demographics are most at risk, or simply curious about how road deaths have changed over time — this tool gives you instant answers without downloading spreadsheets.

## Data Sources

| Source | What it provides | Update frequency |
|--------|-------------------|-----------------|
| [ARDD Fatalities (BITRE)](https://data.gov.au/data/dataset/australian-road-deaths-database) | Individual fatality records with crash type, road user, demographics, location, speed limit, road type | Monthly |

## Features

- **Dashboard** — headline stats, year-over-year change, state ranking with per-capita rates
- **Searchable Table** — all 55,000+ records, filterable by state, year, crash type, road user
- **Trend Analysis** — stacked bar chart of annual fatalities by state, with sparklines
- **State Map** — Leaflet choropleth coloured by per-capita fatality rate
- **Contributing Factors** — crash type, speed limit, road type, remoteness, heavy vehicle involvement
- **Demographics Heatmap** — age group × gender cross-reference matrix
- **Temporal Heatmap** — day-of-week × hour-of-day showing when crashes happen
- **State Comparison** — states vs crash types and road user types as heatmaps

## Tech Stack

- **Runtime:** Vanilla TypeScript
- **Build:** Vite 6
- **Testing:** Vitest
- **Hosting:** GitHub Pages (static, no backend)
- **Data:** GitHub Actions pipeline (monthly fetch from data.gov.au)
- **Maps:** Leaflet
- **Charts:** Hand-rolled SVG (no chart library dependencies)

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm test

# Production build
npm run build

# Preview production build
npm run preview

# Run data pipeline
npm run pipeline
```

## How it works

A GitHub Actions data pipeline runs monthly, downloading the ARDD CSVs from data.gov.au and processing them into optimised JSON files in `public/data/`. The frontend fetches these JSON files and renders eight different visualization views — all client-side, no backend required. The data is pre-aggregated into summaries, trends, demographics, temporal matrices, and state comparison matrices for fast rendering. Individual records are stored in a compact column-oriented format for the searchable table.

## License

MIT
