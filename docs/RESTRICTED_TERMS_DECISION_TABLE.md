# Restricted-Tier Terms Decision Table

The loop reached its goal (833 documents, retrieval domain-hit 100%, no weak domains) using only commercially-clean tiers (public domain, arXiv open access, CC BY-SA, permissive). Everything below is the **restricted_default** tier: 10,462 sources whose full text was never fetched and never will be without a human decision. This table turns that backlog into a per-host call.

This is a planning aid, not legal advice. `educationOnly:true` / `productionReady:false` stay in force. Nothing here authorizes scraping, content reuse, or republication.

## How to read the recommendation column

- **放行引用 (release for cited reference)** — public-mission or standards body; the *facts* are freely usable, text may be paraphrased with attribution after a terms read. Safe to add to the research layer.
- **买授权 (license/partner)** — commercial value, clear owner; if the domain matters for the product, pay for a data/content license rather than scrape.
- **永不碰 (never ingest)** — ToS explicitly forbids scraping/redistribution, or the content is a competitor's course copy. Metadata only, forever.

## Decision Table

| Host | Count | What it is | Recommendation | Reason |
|---|---|---|---|---|
| github.com | 4,877 | Code repos w/o clear permissive license | 放行引用（仅 metadata） | Already metadata-only; the 315 permissive repos are split out and harvestable. The rest stay name/topic cues. |
| npmjs.com | 4,577 | npm package pages | 放行引用（仅 metadata） | Package metadata is factual; never copy README/source text. |
| fred.stlouisfed.org | 75 | Fed economic data series | 放行引用 | Data is public-mission; FRED terms permit non-commercial + attributed use. Read FRED legal page before commercial redistribution. |
| finra.org | 46 | Investor education + rules | 放行引用 | Self-regulatory public education; facts usable with attribution, paraphrase only. |
| cmegroup.com | 25 | Exchange education + data | 买授权 | Exchange education is good but ToS restricts reuse; license if futures/options domain matters. |
| cboe.com | 17 | Options education + VIX data | 买授权 | Same as CME; options content is high-value, license rather than scrape. |
| newyorkfed.org / ecb.europa.eu / bis.org / imf.org / bankofengland.co.uk / nber.org | ~50 | Central bank & academic research | 放行引用 | Public-mission research; most allow attributed non-commercial use. Several already harvested as public-domain PDFs. Read each terms page. |
| nyse.com / nasdaq.com / nasdaqtrader.com / ice.com / theocc.com | ~40 | Exchange market structure docs | 买授权 | Authoritative microstructure source but commercial ToS; license for production. |
| alphavantage.co / polygon.io / finnhub.io / tiingo / financialmodelingprep | ~30 | Market-data API vendors | 买授权 | Their value is the data feed itself; buy an API plan, never scrape docs into content. |
| lseg.com / cfainstitute.org / rpc.cfainstitute.org | ~16 | Professional bodies | 买授权 | CFA curriculum is premium copyrighted content; partner or license. |
| optionseducation.org / nfa.futures.org | ~11 | Industry investor education | 放行引用 | Public investor-protection mission; paraphrase facts with attribution. |
| gdeltproject.org / ssrn.com | ~10 | Open data / paper index | 放行引用 | GDELT is open; SSRN abstracts are citable, full PDFs only when author-posted open access. |
| investopedia.com | 4 | Commercial finance media | 永不碰 | Dotdash-owned course-style copy; direct competitor content, DMCA risk. Metadata only. |
| babypips.com | 4 | Commercial trading school | 永不碰 | Competitor course content; ToS forbids reuse. |
| tradingview.com | (metadata) | Charting platform | 永不碰 | ToS forbids scraping; charts/scripts are user-owned. |
| syncfusion.com / canvasjs.com / d3js.org / pipedream.com / tonsofskills.com | ~25 | Dev tools / unrelated | 永不碰 | Off-topic noise that slipped into harvest; drop from consideration. |

## Net Effect on the Roadmap

- **放行引用 group** (FRED, FINRA, central banks, NFA, OIC, GDELT/SSRN) is the only one worth a human terms-read next — it adds first-party authority to macro, microstructure, and psychology domains without buying anything.
- **买授权 group** (exchanges, data vendors, CFA) is a business decision tied to whether those domains become product differentiators. Don't scrape; budget a license if yes.
- **永不碰 group** (Investopedia, BabyPips, TradingView, off-topic) stays metadata-only permanently. These are exactly the "洗稿" temptation the boundary rules exist to block.

## Boundary

This table plans source-access decisions only. It does not authorize content reuse, market-data redistribution, trading advice, signals, broker workflows, auto-trading, performance claims, or real-money guidance. `productionReady` remains false.

## Addendum — Terms Pages Actually Read (Step 1 outcome)

Direct GET of each host's terms page changed several calls. For a **commercial** product, non-commercial-only terms are a hard blocker, not a soft one.

| Host | Terms finding (verbatim signal) | Revised call |
|---|---|---|
| fred.stlouisfed.org | "for your own personal, **non-commercial** use" | **Blocker for commercial** — keep research_only, do not ingest text |
| finra.org | "FINRA Data provides **non-commercial** use of data" | **Blocker for commercial** — research_only |
| optionseducation.org (OCC) | "All rights reserved" | 永不碰 confirmed |
| gdeltproject.org | "unrestricted use for any academic, **commercial**, or governmental use … must include a citation" | **放行（商用 OK）** — but it is an event-data feed, not lesson prose; integrate as data, cite GDELT |
| newyorkfed.org | terms page reachable, no explicit reuse grant matched | Blocker — needs a careful human read before any use |
| bis.org / imf.org | copyright page reachable, no explicit grant matched | Blocker — human read required |
| ecb.europa.eu / nfa.futures.org | terms page fetch error | Blocker — recheck access |
| bankofengland.co.uk / nber.org | guessed terms URL 404 | Blocker — find correct terms page first |

**Honest conclusion:** the "release for reference" group does **not** yield commercially-clean lesson text. FRED and FINRA — the two largest — are non-commercial-only. Only GDELT clears for commercial use, and it is a data feed, not prose. So Step 1 adds almost nothing harvestable to a *commercial* knowledge base; the clean 833-document corpus already built (public domain + arXiv + CC BY-SA) remains the commercial foundation. This is a compliance win: we did not launder non-commercial government data into a paid product.
