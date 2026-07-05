# MoMo Insights

**MoMo Insights** is a privacy-first web app that analyzes mobile money statements entirely in your browser. Upload a PDF or paste statement text to get spending breakdowns, activity patterns, and personalized financial advice.

> v1 is tested on **Airtel Money** statements. Other providers may work if the statement format is similar.

## Features

- **PDF & text upload** — drag-and-drop or paste raw statement text
- **Automatic parsing** — extracts metadata, balances, and transactions
- **Smart categorization** — loan repayments, agent cash-outs, merchant spending, transfers, airtime, and more
- **Interactive charts** — pie, line, bar, and activity heatmap (click to filter)
- **Financial insights** — 3–5 personalized recommendations based on your spending
- **Export** — download transactions as CSV or a PDF analysis report
- **100% private** — all processing happens locally; no data leaves your device

## Tech Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Recharts
- pdf.js (client-side PDF text extraction)
- Zustand
- Static export for Vercel

## Getting Started

```bash
cd momo-insights
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build for Production

```bash
npm run build
```

Static files are output to the `out/` directory.

## Deploy to Vercel

1. Push this repository to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Set the **Root Directory** to `momo-insights` (if the app is in a subdirectory)
4. Deploy — no environment variables required

Vercel auto-detects Next.js. The app uses `output: 'export'` for static hosting.

Alternatively, deploy the `out/` folder to any static host after running `npm run build`.

## Usage

1. Upload your mobile money statement PDF, or paste the copied text
2. Review the summary cards and charts
3. Click chart segments to filter the transaction table
4. Read personalized insights
5. Export CSV or PDF as needed

## Privacy

No backend, no analytics on statement data, no network requests during analysis. Your financial data never leaves your browser.

## License

MIT
