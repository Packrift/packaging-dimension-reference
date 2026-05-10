# Packrift Packaging Dimension Reference

Static GitHub Pages corpus for Packrift-owned packaging dimension, carton-fit,
shipping-method, pack-station, and warehouse-bin reference pages.

This is an owned public resource corpus. It should be counted as crawlable
Packrift URL-scale presence, not as independent third-party referring domains.

## Generate

```bash
node generate-dimension-reference.mjs
```

Default public base URL:

```text
https://packrift.github.io/packaging-dimension-reference
```

## Inventory

- Source data: top 1,000 Packrift AI-sales SKU records
- Page types: 10
- SKU pages: 10,000
- Index/hub pages: 13
- Sitemap URLs: 10,013

## Publish Target

GitHub Pages from `/docs` on `main`, in the public repository:

```text
Packrift/packaging-dimension-reference
```

