# VStore Mini App

A Telegram Mini App storefront for the existing WooCommerce store, built with
Next.js (App Router) + Tailwind CSS + TypeScript, reading directly from the
`vstore_prod_db` MySQL database.

## Features

- **Product list** — 1,070 published products from WooCommerce, paged 24 at a
  time with infinite scroll.
- **Search** — by product title or SKU, debounced and reflected in the URL.
- **Category filter** — the 20 largest `product_cat` terms as chips.
- **Sort** — newest, popular (total sales), price ascending/descending.
- **Product detail** — image gallery, price, sale/stock badges, categories,
  description.
- **Cart** — add/remove, quantity stepper, running total, persisted to
  `localStorage` so it survives closing the mini app.
- **Telegram integration** — theme colours follow the user's Telegram theme,
  native BackButton and MainButton, haptic feedback, and `sendData` checkout.

## Setup

```bash
npm install
npm run dev        # http://localhost:3100
```

Config lives in `.env.local`:

| Variable | Purpose |
| --- | --- |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | MySQL connection |
| `DB_PREFIX` | WordPress table prefix (`wp_`) |
| `UPLOADS_BASE_URL` | Where product images are served from |
| `MERCHANT_ID` | Payment merchant id, reserved for checkout |
| `NEXT_PUBLIC_STORE_NAME` | Header title |
| `NEXT_PUBLIC_CURRENCY` | Currency for price formatting (`USD`) |

### Product images

Image paths come from the `_wp_attached_file` postmeta and are prefixed with
`NEXT_PUBLIC_UPLOADS_BASE_URL`, which points at the local MAMP vhost
(`vstorecenter-local.com` → `htdocs/vstorecenter-production`).

The local uploads folder is only a partial copy of production: 996 of the 1070
product images are present, and the 74 that are missing are mostly the newest
products — exactly what the default "Newest" sort shows first. So each image is
requested as a cascade (see `src/lib/images.ts`):

1. `…/32-300x300.jpg` on the local host — WooCommerce's resized variant
2. the same variant on `NEXT_PUBLIC_UPLOADS_FALLBACK_URL` (the live site)
3. the full-size original, local then fallback
4. a neutral "No image" tile if every candidate fails

Using the resized variants also cuts a grid image from ~429 KB to ~23 KB, which
matters a lot on mobile. Cards request `300x300`, the product gallery `600x600`,
and cart/thumbnail strips `150x150`.

To make local fully self-contained instead, copy the missing files from
production into `htdocs/vstorecenter-production/wp-content/uploads/` and clear
`NEXT_PUBLIC_UPLOADS_FALLBACK_URL`.

> `NEXT_PUBLIC_*` variables are inlined at build time — restart `npm run dev`
> after changing them.

**"Access to this resource on the server is denied!"** — this is what
vstorecenter.com returns for a *directory* URL such as
`https://vstorecenter.com/wp-content/uploads` or `.../2026/04/`, because
directory listing is disabled. Individual image files serve normally (200); all
74 fallback images were verified. The base URL is only ever a prefix, never
fetched on its own, so this does not affect the app.

A handful of uploads have Khmer filenames (e.g. `2026/04/៣រ.png`). `imageUrl()`
percent-encodes each path segment so those resolve on both hosts.

## Data model

The app reads WooCommerce tables directly — nothing is written back:

- `wp_posts` — products (`post_type='product'`, `post_status='publish'`)
- `wp_wc_product_meta_lookup` — price, stock, SKU, sales count
- `wp_postmeta` — `_thumbnail_id`, `_regular_price`, `_product_image_gallery`
- `wp_terms` / `wp_term_taxonomy` / `wp_term_relationships` — categories

## Routes

| Route | Description |
| --- | --- |
| `/` | Product grid with search, category and sort |
| `/product/[id]` | Product detail |
| `/cart` | Cart and checkout |
| `GET /api/products` | `?q=&category=&sort=&page=&perPage=` → paged JSON |
| `GET /api/products/[id]` | Single product with gallery + categories |

## Connecting it to Telegram

The mini app must be served over HTTPS, so tunnel your dev server:

```bash
npx localtunnel --port 3100     # or: ngrok http 3100
```

Then in [@BotFather](https://t.me/BotFather):

1. `/newbot` (or pick an existing bot).
2. `/newapp` → choose the bot → give it a title, description, 640×360 photo,
   and paste the HTTPS tunnel URL.
3. Optionally `/setmenubutton` so the shop opens from the chat's menu button.

Open the bot in Telegram and tap the menu button to launch the shop.

### Checkout

Tapping Telegram's MainButton on `/cart` calls `WebApp.sendData()` with a JSON
payload:

```json
{ "type": "order", "items": [{ "id": 19690, "qty": 1, "price": 680 }], "total": 680 }
```

Telegram delivers this to your bot as a `web_app_data` message — that is where
you would create the WooCommerce order and start payment with `MERCHANT_ID`.
Note that `sendData` only works when the mini app is opened from a **keyboard
button**, not from the menu button or an inline button; for those entry points
you would POST the order to your own API route instead.
