# Source License Tiers

Four-tier license classification that gates which sources the corpus layer may fetch full content from.
It does not change any source status and does not approve learner-facing reuse.

## Tier Counts

- Total sources: 11221
- permissive: 315
- restricted_default: 10613
- public_domain: 280
- open_access: 13
- Corpus-eligible (public_domain + open_access): 293
- Regional Fed / FRED exceptions held back for terms review: 109

## Tier Rules

- `public_domain`: US federal .gov/.mil hosts. Federal works carry no copyright, but individual documents can embed third-party material, so spot review is still required before commercial quoting.
- `permissive`: GitHub repositories whose license metadata is MIT, Apache-2.0, BSD, ISC, CC0, 0BSD, or Unlicense. Reuse requires attribution and license preservation.
- `open_access`: arXiv. Full text may enter the internal research layer only; learner-facing output must cite and use original wording.
- `restricted_default`: everything else, including all video platforms and quasi-governmental regional Fed/FRED content. Metadata and taxonomy use only.

## Boundary

License tiers gate corpus harvesting only. They are not legal advice, not publication approval, and not a learner-facing promotion. Restricted sources stay metadata-only.
