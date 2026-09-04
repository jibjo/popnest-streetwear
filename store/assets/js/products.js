/* ==========================================================================
   HEAVENLY.CO — Product Catalog (demo/preview data)
   --------------------------------------------------------------------------
   This file mirrors the Shopify product architecture (see /shopify-theme and
   /docs/INTEGRATION.md). In production every field below is managed in the
   Shopify admin (products, variants, metafields, inventory) — this file only
   powers the static design preview.

   ⚠ All products, prices, stock levels and the two "sample" reviews on the
   flagship product are DEMO CONTENT, clearly labelled on the storefront.
   Replace with real catalog data and verified reviews before launch.
   ========================================================================== */

window.HN = window.HN || {};

HN.CATALOG = {
  currency: "USD",
  currencySymbol: "$",
  freeShippingThreshold: 150, // Free shipping on qualifying orders over $150 (set by merchant)
  returnWindowDays: null,     // Merchant sets the real policy window; null = use policy placeholder
  categories: [
    { slug: "outdoor-lighting",  title: "Outdoor Lighting",  tagline: "Weather-rated elegance" },
    { slug: "wall-sconces",      title: "Wall Sconces",      tagline: "Architectural accents" },
    { slug: "pendant-lighting",  title: "Pendant Lighting",  tagline: "Sculpted overhead" },
    { slug: "chandeliers",       title: "Chandeliers",       tagline: "Statement pieces" },
    { slug: "lamps",             title: "Lamps",             tagline: "Warm layered light" },
    { slug: "mirrors",           title: "Mirrors",           tagline: "Light & space" },
    { slug: "rugs",              title: "Rugs",              tagline: "Grounded texture" },
    { slug: "home-accessories",  title: "Home Accessories",  tagline: "Finishing touches" },
    { slug: "decorative-objects",title: "Decorative Objects",tagline: "Quiet sculpture" }
  ]
};

/* Reviews shown below are SAMPLE CONTENT for the design preview (flagship only).
   They are labelled as samples in the UI and must be replaced by verified
   customer reviews from a review app (Judge.me / Loox / Okendo / Yotpo). */
const SAMPLE_REVIEWS_ARDEN = [
  {
    author: "Sample review — Amara O.",
    rating: 5,
    date: "Preview",
    title: "Exactly the architectural look we wanted",
    body: "The up-down beam pattern looks beautiful on our limestone entry wall. Finish feels substantial, not hollow. Installation took about 30 minutes with an existing junction box. (This is a labelled sample review shown during the design preview — verified customer reviews will replace it at launch.)",
    verified: true
  },
  {
    author: "Sample review — Daniel R.",
    rating: 5,
    date: "Preview",
    title: "Soft warm glow, no harsh glare",
    body: "We flanked our patio doors with two. The 3000K temperature is warm without being yellow, and the diffuser hides the LEDs completely. (Sample review — development preview only.)",
    verified: true
  }
];

HN.PRODUCTS = [
  {
    handle: "arden-modern-outdoor-wall-sconce",
    title: "Arden Modern Outdoor Wall Sconce",
    category: "outdoor-lighting",
    tags: ["outdoor", "sconce", "bestseller-sample", "new"],
    price: 149,
    compareAtPrice: null, // Compare-at is only set when the merchant has a factual reference price
    sku: "HN-OUT-ARD-024",
    supplierSku: "SET-ON-IMPORT",
    barcode: null,
    cost: null, // merchant-only field — managed in admin, never shown on the storefront
    stockStatus: "in", // "in" | "low" | "out"  — wired to live inventory in the Shopify theme
    stockQty: null,    // exact counts intentionally hidden (no fake scarcity)
    images: [
      { src: "assets/img/product-arden-front.jpg",  alt: "Arden Modern Outdoor Wall Sconce — front view, textured black aluminum body" },
      { src: "assets/img/product-arden-angle.jpg",  alt: "Arden sconce three-quarter view showing the wall-mount profile" },
      { src: "assets/img/product-arden-glow.jpg",   alt: "Arden sconce at dusk casting warm up-and-down light beams on a plaster wall" },
      { src: "assets/img/product-arden-detail.jpg", alt: "Close-up of the Arden sconce's powder-coated aluminum body and diffuser edge" },
      { src: "assets/img/product-arden-entry.jpg",  alt: "Arden sconce beside a walnut front door on a travertine entry wall" }
    ],
    description:
      "A slim line of light for the places you arrive home to. The Arden sconce throws a soft, warm wash of light up and down the wall — grazing texture, marking the entry, and giving patios and garden walls a quiet architectural glow. Machined from marine-grade aluminum with a sealed IP65 enclosure, it is built to hold its finish through seasons of sun, rain and coastal air.",
    features: [
      "Up-and-down beam pattern that highlights wall texture",
      "Sealed IP65 enclosure — rated for rain, dust and outdoor use",
      "Powder-coated aluminum body that resists fading and corrosion",
      "Integrated warm-white LED — no bulbs to buy or change",
      "Hardwires to a standard exterior junction box"
    ],
    variants: [
      { option: "Finish", label: "Textured Black", hex: "#26282b", sku: "HN-OUT-ARD-024-BLK", price: 149 },
      { option: "Finish", label: "Brushed Bronze", hex: "#7d684d", sku: "HN-OUT-ARD-024-BRZ", price: 149 }
    ],
    specs: [
      { label: "Dimensions",            value: 'H 24" × W 2.4" × D 3.1" (61 × 6 × 8 cm)' },
      { label: "Weight",                value: "3.1 lb (1.4 kg)" },
      { label: "Material",              value: "Powder-coated aluminum, silicone-sealed lens" },
      { label: "Light source",          value: "Integrated LED (non-replaceable module)" },
      { label: "Wattage",               value: "14 W total (7 W up + 7 W down)" },
      { label: "Voltage",               value: "AC 100–240 V, 50/60 Hz" },
      { label: "Color temperature",     value: "3000 K warm white" },
      { label: "Luminous flux",         value: "≈ 1,100 lm" },
      { label: "Dimmable",              value: "Compatible with most leading/trailing-edge dimmers" },
      { label: "IP rating",             value: "IP65 — protected against water jets and dust" },
      { label: "Installation",          value: "Hardwired, flush wall mount; professional installation recommended" },
      { label: "Compatibility",         value: "Covered outdoor locations: entries, patios, garden walls, porches" },
      { label: "Care",                  value: "Wipe with a soft damp cloth; avoid abrasive cleaners" },
      { label: "Expected LED lifetime", value: "≈ 30,000 hours" }
    ],
    specsNote: "Specifications are example values for the design preview. The store owner enters the confirmed supplier specifications in the Shopify admin before launch (see theme settings / metafields).",
    warranty: { label: "Warranty", value: "2-year limited warranty against manufacturing defects. Full terms ship in the box and live in our FAQ." },
    faqs: [
      { q: "Is the Arden suitable for coastal homes?", a: "The powder-coated aluminum body and sealed IP65 enclosure are designed for humid and coastal air. For direct oceanfront exposure, we recommend the Brushed Bronze finish and rinsing the fixture occasionally with fresh water." },
      { q: "Can I mount it horizontally?", a: "Yes. The mount bracket rotates, so the Arden can be installed vertically above a door or horizontally to line a long wall — the beam always runs along the fixture." },
      { q: "Does it need a bulb?", a: "No. The Arden uses an integrated, energy-efficient LED module rated for roughly 30,000 hours — many years of typical evening use." },
      { q: "What does installation involve?", a: "The Arden hardwires to a standard outdoor junction box. If you are comfortable turning off the circuit and basic wiring, it is a straightforward swap; otherwise we recommend a licensed electrician." }
    ],
    sampleReviews: SAMPLE_REVIEWS_ARDEN
  },

  {
    handle: "strata-up-down-outdoor-sconce",
    title: "Strata Up-Down Outdoor Sconce",
    category: "outdoor-lighting",
    tags: ["outdoor", "sconce"],
    price: 119,
    compareAtPrice: null,
    sku: "HN-OUT-STR-012",
    stockStatus: "low",
    stockQty: null,
    images: [{ src: "assets/img/product-strata.jpg", alt: "Strata compact up-down outdoor sconce glowing warmly on a concrete wall at dusk" }],
    description:
      "The Strata distils the up-down wall light to its purest form: a compact cylinder that throws two soft beams above and below. Ideal for flanking doors, lining a fence run, or adding rhythm to a garden wall.",
    features: ["Compact footprint for tight walls", "Warm 3000 K up-down beams", "IP65 weather-sealed aluminum", "Integrated LED module"],
    variants: [{ option: "Finish", label: "Matte Black", hex: "#26282b", sku: "HN-OUT-STR-012-BLK", price: 119 }],
    specs: [
      { label: "Dimensions", value: 'H 8" × W 3.5" × D 4" (20 × 9 × 10 cm)' },
      { label: "Material", value: "Powder-coated aluminum" },
      { label: "Wattage", value: "10 W integrated LED" },
      { label: "Voltage", value: "AC 100–240 V" },
      { label: "Color temperature", value: "3000 K" },
      { label: "IP rating", value: "IP65" },
      { label: "Installation", value: "Hardwired, flush wall mount" },
      { label: "Care", value: "Soft damp cloth; avoid abrasive cleaners" }
    ],
    specsNote: "Example specifications — confirm and edit in the Shopify admin before launch.",
    warranty: { label: "Warranty", value: "2-year limited warranty against manufacturing defects." }
  },

  {
    handle: "vela-opal-dome-pendant",
    title: "Vela Opal Dome Pendant",
    category: "pendant-lighting",
    tags: ["indoor", "pendant", "new"],
    price: 189,
    compareAtPrice: null,
    sku: "HN-IN-VEL-016",
    stockStatus: "in",
    stockQty: null,
    images: [{ src: "assets/img/product-vela.jpg", alt: "Vela pendant — opal glass dome shade on a brushed brass cord, softly illuminated" }],
    description:
      "A hand-blown opal glass dome that turns light into soft sculpture. The Vela hangs beautifully alone, in pairs over a kitchen island, or as a gentle constellation at different heights.",
    features: ["Hand-blown opal glass with seamless glow", "Brushed brass hardware", "Adjustable cord length up to 78\"", "Dimmable with standard E26/E27 bulb"],
    variants: [{ option: "Size", label: 'D 14"', hex: "#d8cfc0", sku: "HN-IN-VEL-016-14", price: 189 }],
    specs: [
      { label: "Dimensions", value: 'Shade Ø 14" × H 8.5"; cord max 78"' },
      { label: "Material", value: "Opal glass, brushed brass canopy" },
      { label: "Bulb", value: "1 × E26/E27 LED, 8–10 W (sold separately)" },
      { label: "Voltage", value: "AC 110–240 V" },
      { label: "Color temperature", value: "2700 K recommended" },
      { label: "Installation", value: "Hardwired or swag-hook; instructions included" },
      { label: "Care", value: "Dust with dry cloth; glass cleaner on cool glass only" }
    ],
    specsNote: "Example specifications — confirm and edit in the Shopify admin before launch.",
    warranty: { label: "Warranty", value: "2-year limited warranty against manufacturing defects." }
  },

  {
    handle: "meridian-linen-drum-chandelier",
    title: "Meridian Linen Drum Chandelier",
    category: "chandeliers",
    tags: ["indoor", "chandelier"],
    price: 429,
    compareAtPrice: null,
    sku: "HN-IN-MER-032",
    stockStatus: "in",
    stockQty: null,
    images: [{ src: "assets/img/product-meridian.jpg", alt: "Meridian chandelier — wide ivory linen drum with brushed brass frame over a dining table" }],
    description:
      "The Meridian anchors a room without shouting. A wide linen drum diffuses light into a calm, even glow while the brass inner frame catches a quiet highlight — dinner-table architecture at its most relaxed.",
    features: ["Fine woven linen shade with diffuser", "Brushed brass inner frame", "Sloped-ceiling compatible canopy", "Five-bulb, dimmable layout"],
    variants: [{ option: "Size", label: 'Ø 32"', hex: "#e8ddc8", sku: "HN-IN-MER-032", price: 429 }],
    specs: [
      { label: "Dimensions", value: 'Ø 32" × H 11"; rod length adjustable 12"–48"' },
      { label: "Material", value: "Linen shade, brass frame, steel rods" },
      { label: "Bulbs", value: "5 × E26/E27 LED, 6–8 W each (sold separately)" },
      { label: "Voltage", value: "AC 110–240 V" },
      { label: "Weight", value: "12.5 lb (5.7 kg)" },
      { label: "Installation", value: "Hardwired; two-person install recommended" },
      { label: "Care", value: "Dust shade with a soft brush attachment" }
    ],
    specsNote: "Example specifications — confirm and edit in the Shopify admin before launch.",
    warranty: { label: "Warranty", value: "2-year limited warranty against manufacturing defects." }
  },

  {
    handle: "aurora-ribbed-table-lamp",
    title: "Aurora Ribbed Table Lamp",
    category: "lamps",
    tags: ["indoor", "lamp"],
    price: 119,
    compareAtPrice: null,
    sku: "HN-IN-AUR-021",
    stockStatus: "in",
    stockQty: null,
    images: [{ src: "assets/img/product-aurora.jpg", alt: "Aurora table lamp with ribbed off-white ceramic base and natural linen shade, glowing warmly" }],
    description:
      "A bedside favourite. The Aurora's ribbed ceramic base catches light like folded paper, while the linen shade keeps the glow soft enough for late chapters and slow mornings.",
    features: ["Hand-finished ribbed ceramic base", "Natural linen shade", "In-line dimmer on cord", "Pairs symmetrically for bedside sets"],
    variants: [{ option: "Shade", label: "Natural Linen", hex: "#e3d9c6", sku: "HN-IN-AUR-021", price: 119 }],
    specs: [
      { label: "Dimensions", value: 'H 21" × Ø 11"' },
      { label: "Material", value: "Ceramic base, linen shade" },
      { label: "Bulb", value: "1 × E26/E27 LED, 6–9 W (sold separately)" },
      { label: "Cord", value: '6 ft braided cord with in-line dimmer' },
      { label: "Weight", value: "5.2 lb (2.4 kg)" },
      { label: "Care", value: "Dust base with dry cloth; avoid wetting ceramic finish" }
    ],
    specsNote: "Example specifications — confirm and edit in the Shopify admin before launch.",
    warranty: { label: "Warranty", value: "2-year limited warranty against manufacturing defects." }
  },

  {
    handle: "halcyon-arc-floor-lamp",
    title: "Halcyon Arc Floor Lamp",
    category: "lamps",
    tags: ["indoor", "lamp", "bestseller-sample"],
    price: 259,
    compareAtPrice: null,
    sku: "HN-IN-HAL-070",
    stockStatus: "in",
    stockQty: null,
    images: [{ src: "assets/img/product-halcyon.jpg", alt: "Halcyon arc floor lamp with brushed brass stem, marble base and black dome shade" }],
    description:
      "An arc of calm over the reading chair. The Halcyon leans in gently — a weighted marble base, a slim brass stem, and a focused dome that puts warm light exactly where the evening happens.",
    features: ["Genuine marble weighted base", "Slim brushed brass arc", "Adjustable dome head", "Foot dimmer on cord"],
    variants: [{ option: "Finish", label: "Brass / Black", hex: "#b18f5e", sku: "HN-IN-HAL-070", price: 259 }],
    specs: [
      { label: "Dimensions", value: 'H 78" × reach 40"; base Ø 11"' },
      { label: "Material", value: "Marble base, brass stem, steel shade" },
      { label: "Bulb", value: "1 × E26/E27 LED, 8–10 W (sold separately)" },
      { label: "Voltage", value: "AC 110–240 V" },
      { label: "Weight", value: "19 lb (8.6 kg)" },
      { label: "Assembly", value: "Tool-free assembly in under 10 minutes" },
      { label: "Care", value: "Wipe metal with dry cloth; marble with pH-neutral cleaner" }
    ],
    specsNote: "Example specifications — confirm and edit in the Shopify admin before launch.",
    warranty: { label: "Warranty", value: "2-year limited warranty against manufacturing defects." }
  },

  {
    handle: "cirrus-round-wall-mirror",
    title: "Cirrus Round Wall Mirror",
    category: "mirrors",
    tags: ["indoor", "mirror"],
    price: 139,
    compareAtPrice: null,
    sku: "HN-DEC-CIR-030",
    stockStatus: "in",
    stockQty: null,
    images: [{ src: "assets/img/product-cirrus.svg", alt: "Cirrus round wall mirror with a slim brushed brass frame" }],
    description:
      "A perfect circle in a whisper-thin brass frame. The Cirrus doubles daylight in an entryway and softens everything it reflects.",
    features: ["Slim brushed brass frame", "HD float glass with true reflection", "D-ring hangers, hangs vertical or horizontal"],
    variants: [{ option: "Size", label: 'Ø 30"', hex: "#c9a86a", sku: "HN-DEC-CIR-030", price: 139 }],
    specs: [
      { label: "Dimensions", value: 'Ø 30" × D 1"' },
      { label: "Material", value: "Brass-finish alloy frame, float glass" },
      { label: "Weight", value: "13 lb (5.9 kg)" },
      { label: "Installation", value: "Hangs on two screws (anchors included)" },
      { label: "Care", value: "Glass cleaner on cloth, never sprayed directly" }
    ],
    specsNote: "Example specifications — confirm and edit in the Shopify admin before launch.",
    warranty: { label: "Warranty", value: "Arrival-damage guarantee: we replace mirrors damaged in transit — see Returns & Refunds." }
  },

  {
    handle: "ora-arch-floor-mirror",
    title: "Ora Arch Floor Mirror",
    category: "mirrors",
    tags: ["indoor", "mirror", "new"],
    price: 179,
    compareAtPrice: null,
    sku: "HN-DEC-ORA-065",
    stockStatus: "low",
    stockQty: null,
    images: [{ src: "assets/img/product-ora.svg", alt: "Ora arch floor mirror leaning against a warm plaster wall" }],
    description:
      "A full-length arch that makes small rooms breathe. Lean it, wall-mount it, or dress it in a corner with a trailing plant — the Ora is the easiest room-brightener we make.",
    features: ["Full-length arch profile", "Lean or secure wall-mount", "Shatter-resistant backing film"],
    variants: [{ option: "Frame", label: "Black", hex: "#26282b", sku: "HN-DEC-ORA-065", price: 179 }],
    specs: [
      { label: "Dimensions", value: 'H 65" × W 22"' },
      { label: "Material", value: "Aluminum frame, glass with safety backing" },
      { label: "Weight", value: "24 lb (10.9 kg)" },
      { label: "Installation", value: "Freestanding lean or wall-mount strap (included)" },
      { label: "Care", value: "Glass cleaner on cloth only" }
    ],
    specsNote: "Example specifications — confirm and edit in the Shopify admin before launch.",
    warranty: { label: "Warranty", value: "Arrival-damage guarantee — see Returns & Refunds." }
  },

  {
    handle: "terra-hand-loomed-rug",
    title: "Terra Hand-Loomed Rug",
    category: "rugs",
    tags: ["indoor", "rug"],
    price: 299,
    compareAtPrice: null,
    sku: "HN-DEC-TER-080",
    stockStatus: "in",
    stockQty: null,
    images: [{ src: "assets/img/product-terra.svg", alt: "Terra hand-loomed wool rug in warm neutral tones with subtle texture" }],
    description:
      "Woven by hand in a small workshop, the Terra layers quiet texture underfoot. Its undyed wool palette warms up cool floors and grounds rooms that lean modern.",
    features: ["Hand-loomed undyed wool", "Naturally stain-resistant fibres", "Low pile — fits under most doors", "Rug pad recommended on hard floors"],
    variants: [{ option: "Size", label: '5\' × 8\'', hex: "#d3c6ae", sku: "HN-DEC-TER-080", price: 299 }],
    specs: [
      { label: "Dimensions", value: "5 ft × 8 ft (152 × 244 cm)" },
      { label: "Material", value: "100% wool, cotton warp" },
      { label: "Pile height", value: "≈ 0.4 in (10 mm)" },
      { label: "Care", value: "Vacuum without beater bar; blot spills; professional clean" },
      { label: "Shedding", value: "Minor shedding is normal for new wool rugs" }
    ],
    specsNote: "Example specifications — confirm and edit in the Shopify admin before launch.",
    warranty: { label: "Warranty", value: "Inspect on arrival — 48-hour arrival-check guarantee for transit damage." }
  },

  {
    handle: "nimbus-sculptural-vase",
    title: "Nimbus Sculptural Vase",
    category: "home-accessories",
    tags: ["indoor", "accessory", "new"],
    price: 59,
    compareAtPrice: null,
    sku: "HN-DEC-NIM-011",
    stockStatus: "in",
    stockQty: null,
    images: [{ src: "assets/img/product-nimbus.svg", alt: "Nimbus sculptural ceramic vase with soft matte off-white finish" }],
    description:
      "Cloud-soft curves in a matte ceramic finish. The Nimbus holds dried stems beautifully and stands alone when it holds nothing at all.",
    features: ["Hand-glazed stoneware", "Watertight interior", "Felted base protects surfaces"],
    variants: [{ option: "Size", label: 'H 11"', hex: "#e9e2d6", sku: "HN-DEC-NIM-011", price: 59 }],
    specs: [
      { label: "Dimensions", value: 'H 11" × Ø 6"' },
      { label: "Material", value: "Glazed stoneware" },
      { label: "Weight", value: "3.3 lb (1.5 kg)" },
      { label: "Care", value: "Hand wash; not dishwasher safe" }
    ],
    specsNote: "Example specifications — confirm and edit in the Shopify admin before launch.",
    warranty: { label: "Warranty", value: "Arrival-damage guarantee — see Returns & Refunds." }
  },

  {
    handle: "ember-object-set",
    title: "Ember Object Trio",
    category: "decorative-objects",
    tags: ["indoor", "accessory"],
    price: 45,
    compareAtPrice: null,
    sku: "HN-DEC-EMB-003",
    stockStatus: "in",
    stockQty: null,
    images: [{ src: "assets/img/product-ember.svg", alt: "Ember object trio — three sculptural ceramic forms in warm neutral tones" }],
    description:
      "Three quiet forms — sphere, arch, and wave — that finish a shelf like a full stop finishes a sentence. Sold as a coordinated trio.",
    features: ["Set of three sculptural forms", "Coordinated warm-neutral glazes", "Felted bases"],
    variants: [{ option: "Set", label: "Trio", hex: "#ddd2bd", sku: "HN-DEC-EMB-003", price: 45 }],
    specs: [
      { label: "Dimensions", value: 'H 3"–6" (set of three)' },
      { label: "Material", value: "Glazed ceramic" },
      { label: "Care", value: "Dust with dry cloth" }
    ],
    specsNote: "Example specifications — confirm and edit in the Shopify admin before launch.",
    warranty: { label: "Warranty", value: "Arrival-damage guarantee — see Returns & Refunds." }
  }
];

/* Notes:
   - SVG images (product-*.svg) are elegant branded placeholders for products
     whose photography has not been produced yet; replace file-for-file with
     real photos (same filename) and the whole site updates. */
