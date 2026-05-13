import fs from "node:fs";
import path from "node:path";

const root = "/Users/farhan/Downloads/packrift-backlinks/execution/dimension-reference-2026-05-10";
const inputPath = "/Users/farhan/Downloads/packrift-ai-commerce-factory/outputs/2026-05-10/mcp_corpus_sales_layer_20260510T204441Z/top-1000-ai-sales-skus.csv";
const outDir = path.join(root, "docs");
const baseUrl = (process.env.BASE_URL || "https://packrift.github.io/packaging-dimension-reference").replace(/\/+$/, "");
const indexNowKey = "3fa9f8d0a47b4b8792f0ec5e96a7b18c";

const pageTypes = [
  {
    folder: "dimension-card",
    label: "Dimension Card",
    title: (r) => `${r.title} Dimension Card`,
    description: (r) => `Dimension reference for Packrift SKU ${r.sku}, including measurement, volume, and Packrift product links.`,
    h1: (r) => `${r.title} dimension card`,
    intro: (r) => `Use this Packrift card when a buyer, pack-station lead, or AI assistant needs the measurement record for SKU ${r.sku}. The canonical Packrift product page remains the source for live price and availability.`,
    sections: (r, m) => [
      ["Measured spec", specBullets(r, m)],
      ["Planning use", ["Store the SKU, title, and dimensions together.", "Confirm dimensions before substituting or slotting.", "Link back to Packrift for the current product record."]],
      ["Best for", ["Shared procurement sheets", "AI retrieval records", "Warehouse item master cleanup"]],
    ],
  },
  {
    folder: "carton-fit-note",
    label: "Carton Fit Note",
    title: (r) => `${r.title} Carton Fit Note`,
    description: (r) => `Carton-fit planning note for Packrift SKU ${r.sku}, with usable-size checks and handling guardrails.`,
    h1: (r) => `${r.title} carton fit note`,
    intro: (r) => `This reference helps teams decide whether Packrift SKU ${r.sku} should be considered for a carton-fit workflow. It does not claim fit for a specific product; it records the checks to run before approval.`,
    sections: (r, m) => [
      ["Fit checks", fitChecks(r, m)],
      ["Before approval", ["Measure the product and protective material together.", "Leave room for inserts, wrap, or void fill.", "Test one real shipment before rolling into a pick path."]],
      ["Do not assume", ["Outside dimensions are the same as usable inside dimensions.", "A close size is equivalent.", "A lower-volume carton is automatically cheaper after labor and damage risk."]],
    ],
  },
  {
    folder: "dim-weight-note",
    label: "DIM Weight Note",
    title: (r) => `${r.title} DIM Weight Note`,
    description: (r) => `Dimensional-weight planning reference for Packrift SKU ${r.sku}, with planning math where dimensions are available.`,
    h1: (r) => `${r.title} dimensional-weight note`,
    intro: (r) => `Use this Packrift note when a shipping or ops team needs a quick dimensional-weight planning record for SKU ${r.sku}. Carrier billing rules can change, so final rating should happen inside the carrier or checkout system.`,
    sections: (r, m) => [
      ["Planning math", dimWeightBullets(r, m)],
      ["Operational checks", ["Confirm whether the dimensions are inside, outside, or listed product dimensions.", "Use the carrier's current divisor and rounding rule.", "Review actual package weight before deciding the billable weight."]],
      ["Good use", ["Early carton-size screening", "Freight or parcel planning", "Buyer education before changing sizes"]],
    ],
  },
  {
    folder: "pallet-layer-note",
    label: "Pallet Layer Note",
    title: (r) => `${r.title} Pallet Layer Note`,
    description: (r) => `Pallet and bulk-storage planning note for Packrift SKU ${r.sku}.`,
    h1: (r) => `${r.title} pallet layer note`,
    intro: (r) => `This Packrift note helps warehouse teams think through bulk storage for SKU ${r.sku}. It is a planning prompt, not a promise of pallet count, stack height, or freight class.`,
    sections: (r, m) => [
      ["Bulk planning", palletBullets(r, m)],
      ["Warehouse checks", ["Keep packaging dry and away from damage zones.", "Separate similar SKUs with clear shelf or pallet labels.", "Record reorder point by location when velocity is known."]],
      ["Escalate when", ["The item changes bundle, case, roll, or pack configuration.", "The team is mixing similar dimensions in the same bay.", "The packaging is being crushed, bowed, or deformed in storage."]],
    ],
  },
  {
    folder: "pack-station-card",
    label: "Pack Station Card",
    title: (r) => `${r.title} Pack Station Card`,
    description: (r) => `Pack-station card for Packrift SKU ${r.sku}, designed for picker and packer reference.`,
    h1: (r) => `${r.title} pack-station card`,
    intro: (r) => `Use this page as a pack-station reference for Packrift SKU ${r.sku}. It keeps the working label, dimension, and Packrift link together so teams can reduce wrong-size picks.`,
    sections: (r, m) => [
      ["Station label", [`SKU: ${r.sku}`, `Item: ${r.title}`, `Dimensions: ${r.dimension_display || "confirm on Packrift"}`, labelMetric(r, m)]],
      ["Packer checks", packerChecks(r.family)],
      ["When to replace the card", ["The SKU changes.", "The item title or pack count changes.", "The warehouse chooses a different approved substitute."]],
    ],
  },
  {
    folder: "shipping-method-check",
    label: "Shipping Method Check",
    title: (r) => `${r.title} Shipping Method Check`,
    description: (r) => `Shipping-method planning checklist for Packrift SKU ${r.sku}.`,
    h1: (r) => `${r.title} shipping-method check`,
    intro: (r) => `This checklist helps teams review whether Packrift SKU ${r.sku} belongs in parcel, LTL, storage, or pack-station planning. It does not replace live carrier rating.`,
    sections: (r, m) => [
      ["Shipping checks", shippingChecks(r, m)],
      ["Use with", ["Carrier-rating tools", "Warehouse slotting notes", "Procurement reorder records"]],
      ["Guardrails", ["Do not infer price or carrier eligibility from this reference page alone.", "Check current Packrift inventory and checkout behavior before purchase.", "Use real product and destination details for final routing."]],
    ],
  },
  {
    folder: "size-comparison-note",
    label: "Size Comparison Note",
    title: (r) => `${r.title} Size Comparison Note`,
    description: (r) => `Size-comparison note for Packrift SKU ${r.sku}, built for comparing close packaging specs.`,
    h1: (r) => `${r.title} size comparison note`,
    intro: (r) => `Use this Packrift reference when comparing SKU ${r.sku} with similar packaging sizes. It documents the dimension fields to compare without claiming any specific substitute is approved.`,
    sections: (r, m) => [
      ["Compare fields", comparisonBullets(r, m)],
      ["Compare against", ["The current approved item", "A nearby size in the same packaging family", "Any supplier-proposed substitute"]],
      ["Reject a comparison when", ["Material, board strength, adhesive, or closure is different.", "Usable dimensions are unclear.", "The pack station has not tested the alternate size."]],
    ],
  },
  {
    folder: "damage-prevention-note",
    label: "Damage Prevention Note",
    title: (r) => `${r.title} Damage Prevention Note`,
    description: (r) => `Damage-prevention planning note for Packrift SKU ${r.sku}, with handling and spec checks.`,
    h1: (r) => `${r.title} damage-prevention note`,
    intro: (r) => `This page helps teams use Packrift SKU ${r.sku} in a damage-prevention review. It focuses on checks and handling notes, not unsupported performance claims.`,
    sections: (r, m) => [
      ["Risk checks", damageChecks(r.family, m)],
      ["Review after", ["Damage complaints", "Carrier claim spikes", "High return rates", "A planned packaging substitution"]],
      ["Document", ["Current SKU and Packrift product URL", "Product packed inside", "Dunnage or closure used", "Observed failure mode"]],
    ],
  },
  {
    folder: "warehouse-bin-label",
    label: "Warehouse Bin Label",
    title: (r) => `${r.title} Warehouse Bin Label`,
    description: (r) => `Warehouse bin-label reference for Packrift SKU ${r.sku}.`,
    h1: (r) => `${r.title} warehouse bin label`,
    intro: (r) => `Use this page to create a simple warehouse bin or shelf label for Packrift SKU ${r.sku}. It is built to reduce confusion between similar packaging sizes and families.`,
    sections: (r, m) => [
      ["Label fields", [`Packrift SKU: ${r.sku}`, `Description: ${r.title}`, `Dimensions: ${r.dimension_display || "confirm on Packrift"}`, `Family: ${familyName(r.family)}`, labelMetric(r, m)]],
      ["Location notes", ["Keep the Packrift SKU visible.", "Show dimensions on the bin label.", "Separate lookalike sizes by divider, bay, or color-coded label."]],
      ["Audit cadence", ["After the first replenishment cycle", "After any wrong-size pick", "After any item-master or supplier-spec update"]],
    ],
  },
  {
    folder: "spec-audit-record",
    label: "Spec Audit Record",
    title: (r) => `${r.title} Spec Audit Record`,
    description: (r) => `Spec-audit record for Packrift SKU ${r.sku}, useful for procurement and warehouse master-data cleanup.`,
    h1: (r) => `${r.title} spec audit record`,
    intro: (r) => `Use this Packrift record when cleaning up packaging master data for SKU ${r.sku}. It gives teams a consistent audit frame before approving, reordering, or replacing a packaging supply.`,
    sections: (r, m) => [
      ["Audit fields", specBullets(r, m)],
      ["Audit questions", ["Does the item master include the Packrift SKU?", "Does the description match the current Packrift product page?", "Are dimensions, pack count, and family recorded consistently?", "Is the approved substitute policy clear?"]],
      ["Outcome options", ["Approved current spec", "Needs product-page verification", "Needs warehouse test", "Needs buyer approval before reorder"]],
    ],
  },
];

function cleanDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (quoted) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (ch !== "\r") {
      cell += ch;
    }
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  const [headers, ...data] = rows;
  return data
    .filter((r) => r.some((value) => value.trim()))
    .map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] || ""])));
}

function dimensions(value) {
  const nums = String(value || "")
    .replace(/[×]/g, "x")
    .match(/\d+(?:\.\d+)?/g)
    ?.map(Number) || [];
  const [length, width, height] = nums;
  const volume = nums.length >= 3 ? length * width * height : null;
  const area = nums.length >= 2 ? length * width : null;
  const longest = nums.length ? Math.max(...nums) : null;
  const girth = nums.length >= 3 ? length + 2 * (width + height) : null;
  return { nums, length, width, height, volume, area, longest, girth };
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140);
}

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function familyName(family) {
  const names = {
    boxes: "corrugated boxes",
    labels: "labels",
    mailers: "mailers",
    bags: "bags",
    tape: "packing tape",
    film: "stretch film",
  };
  return names[String(family || "").toLowerCase()] || String(family || "packaging supplies");
}

function round(value, places = 2) {
  if (!Number.isFinite(value)) return null;
  return Number(value.toFixed(places)).toLocaleString("en-US");
}

function labelMetric(r, m) {
  if (m.volume) return `Approx. cubic volume: ${round(m.volume)} cubic inches`;
  if (m.area) return `Approx. face area: ${round(m.area)} square inches`;
  return `Primary family: ${familyName(r.family)}`;
}

function specBullets(r, m) {
  return [
    `SKU: ${r.sku}`,
    `Family: ${familyName(r.family)}`,
    `Listed dimensions: ${r.dimension_display || "confirm on Packrift"}`,
    labelMetric(r, m),
    `Availability signal in source corpus: ${r.availability || "confirm on Packrift"}`,
  ];
}

function fitChecks(r, m) {
  const f = String(r.family || "").toLowerCase();
  const common = [
    `Listed dimensions: ${r.dimension_display || "confirm on Packrift"}`,
    "Measure the item, protection, and required clearance before assigning this packaging.",
  ];
  if (f === "boxes") {
    return [
      ...common,
      m.volume ? `Planning volume: about ${round(m.volume)} cubic inches before contents or dunnage.` : "Volume should be calculated from confirmed dimensions.",
      m.girth ? `Length plus girth planning value: about ${round(m.girth)} inches.` : "Length plus girth should be calculated from confirmed dimensions.",
      "Check void fill, crush resistance, and closure method before standardizing.",
    ];
  }
  if (f === "labels") {
    return [
      ...common,
      m.area ? `Label face area: about ${round(m.area)} square inches.` : "Label area should be calculated from confirmed dimensions.",
      "Confirm printer, adhesive, face stock, and roll or sheet format.",
    ];
  }
  if (f === "mailers") {
    return [
      ...common,
      "Confirm usable opening and closure type.",
      "Test rigid or fragile items before replacing a box with a mailer.",
    ];
  }
  return [...common, "Confirm material, opening, closure, and usable dimensions."];
}

function dimWeightBullets(r, m) {
  if (!m.volume) {
    return [
      `Listed dimensions: ${r.dimension_display || "confirm on Packrift"}`,
      "Dimensional-weight math needs three confirmed package dimensions.",
      "Use the final carrier divisor and rounding rule before quoting.",
    ];
  }
  return [
    `Listed dimensions: ${r.dimension_display}`,
    `Approx. cubic volume: ${round(m.volume)} cubic inches.`,
    `DIM weight at divisor 139: ${round(Math.ceil(m.volume / 139), 0)} lb before carrier-specific adjustments.`,
    `DIM weight at divisor 166: ${round(Math.ceil(m.volume / 166), 0)} lb before carrier-specific adjustments.`,
    "Final billing depends on actual weight, carrier divisor, destination, service, and current rating rules.",
  ];
}

function palletBullets(r, m) {
  const out = [
    `SKU: ${r.sku}`,
    `Dimensions: ${r.dimension_display || "confirm on Packrift"}`,
    `Family: ${familyName(r.family)}`,
  ];
  if (m.longest) out.push(`Longest listed side: about ${round(m.longest)} inches.`);
  if (m.volume) out.push(`Single-item planning volume: about ${round(m.volume)} cubic inches.`);
  out.push("Use real case, bundle, or carton-pack dimensions before calculating pallet count.");
  return out;
}

function packerChecks(family) {
  const f = String(family || "").toLowerCase();
  if (f === "boxes") {
    return ["Check the item fits with protective material.", "Use the approved tape or closure workflow.", "Do not collapse, crease, or reuse damaged boxes for outbound shipments."];
  }
  if (f === "labels") {
    return ["Confirm label orientation and printer compatibility.", "Keep labels clean, flat, and away from moisture.", "Do not substitute adhesive type without approval."];
  }
  if (f === "mailers") {
    return ["Confirm the item fits through the opening.", "Seal fully along the closure.", "Use extra protection for rigid, sharp, or fragile contents."];
  }
  return ["Confirm item, dimension, pack count, and approved use before packing."];
}

function shippingChecks(r, m) {
  const out = [
    `Packaging family: ${familyName(r.family)}`,
    `Dimensions: ${r.dimension_display || "confirm on Packrift"}`,
  ];
  if (m.volume) out.push(`Volume planning value: ${round(m.volume)} cubic inches.`);
  if (m.girth) out.push(`Length plus girth planning value: ${round(m.girth)} inches.`);
  out.push("Check actual packed weight and destination before selecting parcel or freight.");
  out.push("Confirm current carrier handling limits and surcharges.");
  return out;
}

function comparisonBullets(r, m) {
  const out = [
    `Current Packrift SKU: ${r.sku}`,
    `Current listed dimensions: ${r.dimension_display || "confirm on Packrift"}`,
    `Family: ${familyName(r.family)}`,
  ];
  if (m.volume) out.push(`Current volume benchmark: about ${round(m.volume)} cubic inches.`);
  if (m.area && !m.volume) out.push(`Current area benchmark: about ${round(m.area)} square inches.`);
  out.push("Compare material, strength, closure, pack count, and actual usage before approval.");
  return out;
}

function damageChecks(family, m) {
  const f = String(family || "").toLowerCase();
  if (f === "boxes") {
    return [
      "Check whether the carton is oversized and creating excess product movement.",
      "Confirm board strength, tape pattern, and void-fill method.",
      m.volume ? `Review whether about ${round(m.volume)} cubic inches is appropriate for the protected product.` : "Confirm dimensions before evaluating volume.",
    ];
  }
  if (f === "labels") {
    return ["Check adhesive and surface compatibility.", "Review moisture, temperature, and abrasion exposure.", "Confirm printer compatibility and label storage."];
  }
  if (f === "mailers") {
    return ["Review item rigidity and edge risk.", "Confirm closure seal and usable opening.", "Use added protection for crush-sensitive products."];
  }
  return ["Review fit, material, closure, and handling exposure.", "Compare current spec to the observed failure mode.", "Test before replacing the approved spec."];
}

function list(items) {
  return `<ul>${items.map((item) => `<li>${esc(item)}</li>`).join("\n")}</ul>`;
}

function pageShell({ title, description, canonical, body, nav = true, schema }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${esc(canonical)}">
  <style>
    :root { color-scheme: light; --ink:#18212f; --muted:#526070; --line:#d8e0e8; --bg:#f7fafc; --panel:#ffffff; --accent:#0f766e; --accent2:#9a3412; }
    * { box-sizing: border-box; }
    body { margin:0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color:var(--ink); background:var(--bg); line-height:1.52; }
    a { color:#0b5d56; }
    header { background:#ffffff; border-bottom:1px solid var(--line); }
    .wrap { width:min(1120px, calc(100% - 32px)); margin:0 auto; }
    .top { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:18px 0; }
    .brand { font-weight:760; letter-spacing:0; color:var(--ink); text-decoration:none; }
    nav { display:flex; gap:14px; flex-wrap:wrap; font-size:14px; }
    main { padding:34px 0 56px; }
    .hero { display:grid; grid-template-columns:minmax(0, 1.3fr) minmax(280px, .7fr); gap:24px; align-items:start; margin-bottom:28px; }
    h1 { font-size:clamp(32px, 4vw, 56px); line-height:1.02; letter-spacing:0; margin:0 0 14px; }
    h2 { font-size:24px; line-height:1.2; margin:0 0 10px; }
    h3 { font-size:18px; margin:0 0 8px; }
    p { margin:0 0 14px; color:var(--muted); }
    .panel, .card { background:var(--panel); border:1px solid var(--line); border-radius:8px; }
    .panel { padding:20px; }
    .meta { display:grid; gap:10px; font-size:14px; }
    .meta div { display:flex; justify-content:space-between; gap:14px; border-bottom:1px solid #edf1f5; padding-bottom:8px; }
    .meta div:last-child { border-bottom:0; padding-bottom:0; }
    .grid { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:14px; margin:24px 0; }
    .card { padding:18px; min-height:120px; }
    .section { margin:18px 0; }
    ul { margin:10px 0 0; padding-left:20px; }
    li { margin:5px 0; }
    .links { display:flex; flex-wrap:wrap; gap:10px; margin-top:14px; }
    .button { display:inline-flex; align-items:center; justify-content:center; min-height:40px; padding:0 14px; border-radius:7px; border:1px solid #0f766e; color:#ffffff; background:#0f766e; text-decoration:none; font-weight:650; }
    .button.secondary { background:#ffffff; color:#0f766e; }
    table { border-collapse:collapse; width:100%; background:#fff; border:1px solid var(--line); }
    th, td { text-align:left; padding:10px 12px; border-bottom:1px solid var(--line); vertical-align:top; }
    th { background:#eef6f5; }
    footer { border-top:1px solid var(--line); padding:22px 0; color:var(--muted); font-size:14px; background:#fff; }
    @media (max-width: 820px) { .hero, .grid { grid-template-columns:1fr; } .top { align-items:flex-start; flex-direction:column; } h1 { font-size:34px; } }
  </style>
  ${schema ? `<script type="application/ld+json">${JSON.stringify(schema)}</script>` : ""}
</head>
<body>
  <header>
    <div class="wrap top">
      <a class="brand" href="${baseUrl}/">Packrift packaging dimension reference</a>
      ${nav ? `<nav><a href="${baseUrl}/sku-index.html">SKU index</a><a href="${baseUrl}/page-types.html">Reference types</a><a href="${baseUrl}/sitemap.xml">Sitemap</a><a href="https://packrift.com/pages/tools">Packaging tools</a><a href="https://packrift.com/">Packrift.com</a></nav>` : ""}
    </div>
  </header>
  <main class="wrap">${body}</main>
  <footer><div class="wrap">Packrift owned public reference content for packaging dimensions, fit checks, and warehouse planning. Use the <a href="https://packrift.com/pages/tools">Packrift packaging tools hub</a> for calculators and related libraries, and verify live price, inventory, and checkout terms on Packrift.com.</div></footer>
</body>
</html>
`;
}

function skuSlug(row) {
  return `${slugify(row.sku)}-${slugify(row.title)}`;
}

function writePage(rel, html, urls) {
  const filePath = path.join(outDir, rel);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, html);
  urls.push(`${baseUrl}/${rel.replace(/index\.html$/, "").replace(/\\/g, "/")}`);
}

function schemaFor(row, type, canonical, description) {
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: type.title(row),
    description,
    mainEntityOfPage: canonical,
    publisher: {
      "@type": "Organization",
      name: "Packrift",
      url: "https://packrift.com/",
    },
    about: {
      "@type": "Product",
      name: row.title,
      sku: row.sku,
      url: row.product_url,
    },
  };
}

function skuPage(row, type) {
  const m = dimensions(row.dimension_display);
  const rel = `${type.folder}/${skuSlug(row)}.html`;
  const canonical = `${baseUrl}/${rel}`;
  const description = type.description(row);
  const sections = type.sections(row, m)
    .map(([title, items]) => `<section class="section panel"><h2>${esc(title)}</h2>${list(items)}</section>`)
    .join("\n");
  const body = `
    <div class="hero">
      <section>
        <h1>${esc(type.h1(row))}</h1>
        <p>${esc(type.intro(row))}</p>
        <div class="links">
          <a class="button" href="${esc(row.product_url || "https://packrift.com/")}">View on Packrift</a>
          <a class="button secondary" href="${esc(row.reorder_url || row.product_url || "https://packrift.com/")}">Reorder by SKU</a>
          <a class="button secondary" href="${esc(row.bulk_quote_url || row.product_url || "https://packrift.com/")}">Bulk quote</a>
        </div>
      </section>
      <aside class="panel meta">
        <div><strong>SKU</strong><span>${esc(row.sku)}</span></div>
        <div><strong>Family</strong><span>${esc(familyName(row.family))}</span></div>
        <div><strong>Dimensions</strong><span>${esc(row.dimension_display || "Confirm")}</span></div>
        <div><strong>Reference type</strong><span>${esc(type.label)}</span></div>
      </aside>
    </div>
    ${sections}
    <section class="panel section"><h2>Canonical product source</h2><p>This reference links back to Packrift for the authoritative product page, current availability, and purchase path.</p><p><a href="${esc(row.product_url || "https://packrift.com/")}">${esc(row.product_url || "https://packrift.com/")}</a></p></section>
  `;
  return pageShell({
    title: type.title(row),
    description,
    canonical,
    body,
    schema: schemaFor(row, type, canonical, description),
  });
}

function buildHome(rows, urls) {
  const canonical = `${baseUrl}/`;
  const body = `
    <div class="hero">
      <section>
        <h1>Packrift packaging dimension reference</h1>
        <p>A public Packrift-owned dimension and fit-planning corpus generated from 1,000 Packrift SKU records. It is built for buyers, warehouse teams, and AI agents that need SKU-specific packaging measurements, fit checks, dimensional-weight notes, and pack-station references.</p>
        <div class="links"><a class="button" href="${baseUrl}/sku-index.html">Browse SKUs</a><a class="button secondary" href="${baseUrl}/page-types.html">Browse reference types</a></div>
      </section>
      <aside class="panel meta">
        <div><strong>SKUs</strong><span>${rows.length.toLocaleString("en-US")}</span></div>
        <div><strong>Reference types</strong><span>${pageTypes.length}</span></div>
        <div><strong>SKU pages</strong><span>${(rows.length * pageTypes.length).toLocaleString("en-US")}</span></div>
        <div><strong>Owner</strong><span>Packrift</span></div>
      </aside>
    </div>
    <div class="grid">
      ${pageTypes.slice(0, 6).map((type) => `<article class="card"><h2>${esc(type.label)}</h2><p>${esc(type.description(rows[0]).replace(`Packrift SKU ${rows[0].sku}`, "each Packrift SKU"))}</p><p><a href="${baseUrl}/${type.folder}/">Open hub</a></p></article>`).join("\n")}
    </div>
    <section class="panel"><h2>What this is</h2><p>This is owned public reference content that points users and crawlers back to canonical Packrift product pages. It is not a third-party endorsement, directory listing, or independent referring domain.</p></section>
  `;
  writePage("index.html", pageShell({ title: "Packrift packaging dimension reference", description: "Public Packrift-owned packaging dimension, fit, and shipping-planning reference corpus.", canonical, body }), urls);
}

function buildIndexes(rows, urls) {
  const skuRows = rows
    .map((row) => `<tr><td>${esc(row.sku)}</td><td>${esc(row.title)}</td><td>${esc(row.dimension_display)}</td><td><a href="${baseUrl}/dimension-card/${skuSlug(row)}.html">Dimension card</a></td><td><a href="${esc(row.product_url)}">Packrift</a></td></tr>`)
    .join("\n");
  writePage("sku-index.html", pageShell({
    title: "Packrift dimension SKU index",
    description: "Index of Packrift SKU dimension reference pages.",
    canonical: `${baseUrl}/sku-index.html`,
    body: `<h1>SKU index</h1><p>Browse 1,000 Packrift SKU records used in this dimension reference corpus.</p><table><thead><tr><th>SKU</th><th>Title</th><th>Dimensions</th><th>Reference</th><th>Product</th></tr></thead><tbody>${skuRows}</tbody></table>`,
  }), urls);

  const typeRows = pageTypes
    .map((type) => `<tr><td><a href="${baseUrl}/${type.folder}/">${esc(type.label)}</a></td><td>${esc(type.folder)}</td><td>${esc(type.description(rows[0]).replace(`Packrift SKU ${rows[0].sku}`, "each Packrift SKU"))}</td></tr>`)
    .join("\n");
  writePage("page-types.html", pageShell({
    title: "Packrift dimension reference page types",
    description: "Reference type index for the Packrift packaging dimension corpus.",
    canonical: `${baseUrl}/page-types.html`,
    body: `<h1>Reference types</h1><p>Each type covers a different operational use case so the corpus is useful beyond repeated SKU text.</p><table><thead><tr><th>Type</th><th>Folder</th><th>Use</th></tr></thead><tbody>${typeRows}</tbody></table>`,
  }), urls);

  for (const type of pageTypes) {
    const links = rows.slice(0, 300).map((row) => `<li><a href="${baseUrl}/${type.folder}/${skuSlug(row)}.html">${esc(row.title)}</a> <span>${esc(row.dimension_display)}</span></li>`).join("\n");
    writePage(`${type.folder}/index.html`, pageShell({
      title: `Packrift ${type.label.toLowerCase()} hub`,
      description: `Hub for ${type.label.toLowerCase()} pages in the Packrift packaging dimension reference.`,
      canonical: `${baseUrl}/${type.folder}/`,
      body: `<h1>${esc(type.label)} pages</h1><p>Browse SKU-level ${esc(type.label.toLowerCase())} references. The full set is available in the sitemap.</p><ul>${links}</ul>`,
    }), urls);
  }
}

function writeSupportFiles(urls) {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${esc(url)}</loc></url>`).join("\n")}\n</urlset>\n`;
  fs.writeFileSync(path.join(outDir, "sitemap.xml"), sitemap);
  fs.writeFileSync(path.join(outDir, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml\n`);
  fs.writeFileSync(path.join(outDir, `${indexNowKey}.txt`), indexNowKey);
  fs.writeFileSync(path.join(outDir, "_headers"), `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n`);
  fs.writeFileSync(path.join(outDir, "404.html"), pageShell({
    title: "Packrift dimension reference page not found",
    description: "The requested Packrift dimension reference page was not found.",
    canonical: `${baseUrl}/404.html`,
    nav: true,
    body: `<h1>Page not found</h1><p>Use the SKU index or sitemap to find a Packrift dimension reference page.</p><p><a class="button" href="${baseUrl}/sku-index.html">Open SKU index</a></p>`,
  }));
}

function main() {
  const rows = parseCsv(fs.readFileSync(inputPath, "utf8")).slice(0, 1000);
  cleanDir(outDir);
  const urls = [];
  buildHome(rows, urls);
  buildIndexes(rows, urls);
  for (const type of pageTypes) {
    for (const row of rows) {
      writePage(`${type.folder}/${skuSlug(row)}.html`, skuPage(row, type), urls);
    }
  }
  writeSupportFiles(urls);
  fs.writeFileSync(path.join(root, "submitted-urls-2026-05-10.txt"), `${urls.join("\n")}\n`);
  fs.writeFileSync(path.join(root, "indexnow-payload-2026-05-10.json"), `${JSON.stringify({ host: "packrift.github.io", key: indexNowKey, keyLocation: `${baseUrl}/${indexNowKey}.txt`, urlList: urls }, null, 2)}\n`);
  console.log(JSON.stringify({
    rows: rows.length,
    pageTypes: pageTypes.length,
    sitemapUrls: urls.length,
    htmlFiles: fs.readdirSync(outDir, { recursive: true }).filter((f) => String(f).endsWith(".html")).length,
    baseUrl,
    indexNowKey,
  }, null, 2));
}

main();
