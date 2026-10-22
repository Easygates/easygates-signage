# Image Credits — public/brands/

Business logos used by the multi-business settings (`/admin?tab=business`).

| File | Business | Source |
|------|----------|--------|
| `easygates-direct-logo.png` | EasyGates Direct — gate automation, access control & safety | Supplied by the business |
| `smart-secure-logo.png` | Smart & Secure — smart home, security & home cinema | Supplied by the business |

Both are transparent PNGs. They are referenced by the two shipped business
profiles in `BUSINESS_PRESETS` (`src/lib/brand.ts`), which set:

| Business | Logo | Plate | Accent | Background |
|----------|------|-------|--------|------------|
| EasyGates Direct | `easygates-direct-logo.png` | dark (the mark is silver `#d1d1d1` + red `#e62d34`) | `#ff3b43` | `#07131f` |
| Smart & Secure | `smart-secure-logo.png` | white (the mark is teal `#74c0cd`, coral `#d07374`, cream `#ecea91`) | `#74c0cd` | `#08161b` |

The accent colours are read straight off the supplied logo files, then nudged
until text on them clears WCAG AA (checked by `tests/businesses.test.mjs`).

## Adding a logo

Drop a transparent PNG in here and point the business's **Logo address** at
`/brands/<file>.png`. Turn **“Put the logo on a white badge”** off for white or
silver marks, and on for coloured or dark ones.
