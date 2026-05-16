# Embed Routes

Public-contract, stable iframe-embedding surface for InferenceX charts. Partner sites can embed any supported chart by iframing an `/embed/*` URL and rely on it continuing to work long-term.

## Stability guarantee

The embed URL shape is a **public API**. The following rules apply permanently:

- Existing parameter keys **cannot be removed or renamed**. New keys may be added with sensible defaults.
- Existing `y` short-form aliases **cannot be removed or renamed**. New aliases may be added.
- Existing `gpus` hwKey tokens **cannot be removed or renamed**. New tokens may be added when new hardware is added to the benchmark.
- Unknown values always fall back to the documented default — a stale embed URL must never render an error page.
- If a rename becomes unavoidable, the old key/alias must be kept as a permanently-handled alias alongside the new one, and a note added to this file.

## Supported routes

| Route            | Chart                                    |
| ---------------- | ---------------------------------------- |
| `/embed/scatter` | Scatter (E2E throughput / interactivity) |

## `/embed/scatter`

### URL shape

```
/embed/scatter?model=dsr1&isl=8192&osl=1024&precisions=fp4&gpus=b200_sglang,gb300_dynamo-sglang&y=tpPerGpu&chart=e2e
```

### Parameters

| Key          | Type           | Default          | Accepted values                                                         | Fallback on unknown    |
| ------------ | -------------- | ---------------- | ----------------------------------------------------------------------- | ---------------------- |
| `model`      | string         | `dsr1`           | Any DB model key (see table below)                                      | Default model (`dsr1`) |
| `isl`        | integer string | `8192`           | Input sequence length in tokens                                         | Default (`8192`)       |
| `osl`        | integer string | `1024`           | Output sequence length in tokens                                        | Default (`1024`)       |
| `precisions` | string         | `fp4`            | Comma-separated precision keys (e.g. `fp4`, `fp8`, `bf16`)              | Default (`fp4`)        |
| `gpus`       | string         | `` (all visible) | Comma-separated hwKey tokens (see format below)                         | Empty — all GPUs shown |
| `y`          | string         | `tpPerGpu`       | Any short-form alias from the table below, or a full `y_*` internal key | Default (`tpPerGpu`)   |
| `chart`      | string         | `e2e`            | `e2e`, `interactivity`                                                  | `e2e`                  |

### `model` — accepted DB keys

These are the short DB keys accepted as `model=`. They map to the display model names shown in the chart. Unknown keys fall back to the default (`dsr1`).

The authoritative list lives in `DB_MODEL_TO_DISPLAY` in `packages/constants/src/`. Representative examples:

| `model=` value | Display name               |
| -------------- | -------------------------- |
| `dsr1`         | DeepSeek-R1-0528           |
| `dsv4`         | DeepSeek-V4-Pro            |
| `llama70b`     | Llama-3.3-70B-Instruct-FP8 |
| `llama405b`    | Llama-3.1-405B-Instruct    |
| `qwen72b`      | Qwen2.5-72B-Instruct       |

### `y` — accepted short-form aliases

Both the short form (`tpPerGpu`) and the full internal form (`y_tpPerGpu`) are accepted. **Short-form aliases listed here cannot be removed.**

| `y=` value         | Meaning                                               |
| ------------------ | ----------------------------------------------------- |
| `tpPerGpu`         | Total throughput per GPU (tokens/s/GPU) — **default** |
| `inputTputPerGpu`  | Input throughput per GPU                              |
| `outputTputPerGpu` | Output throughput per GPU                             |
| `tpPerMw`          | Total throughput per MW                               |
| `inputTputPerMw`   | Input throughput per MW                               |
| `outputTputPerMw`  | Output throughput per MW                              |
| `costh`            | Cost per hour                                         |
| `costn`            | Cost per 1 M input tokens                             |
| `costr`            | Cost per 1 M output tokens                            |
| `costhOutput`      | Cost per hour (output)                                |
| `costnOutput`      | Cost per 1 M input tokens (output)                    |
| `costrOutput`      | Cost per 1 M output tokens (output)                   |
| `costhi`           | Cost per hour (interactivity)                         |
| `costni`           | Cost per 1 M input tokens (interactivity)             |
| `costri`           | Cost per 1 M output tokens (interactivity)            |
| `jTotal`           | Joules per total token                                |
| `jOutput`          | Joules per output token                               |
| `jInput`           | Joules per input token                                |

### `gpus` — hwKey format

The `gpus` parameter is a comma-separated list of hwKey tokens. Each token encodes the hardware and the inference framework together, separated by an underscore (e.g. `b200_sglang`, `gb300_dynamo-sglang`).

**These tokens are stable.** Any hwKey token that has ever been publicly supported in an embed URL must continue to be accepted. New tokens are added when new hardware or framework combinations are added to the benchmark. Existing tokens cannot be removed; retired hardware tokens simply filter to no visible points (which is the same as the user having toggled that GPU off).

To discover the current set of valid hwKeys, visit `/inference` on the live site, open the legend, and note the identifiers shown — or use **Export → Copy embed** on the chart to copy an iframe snippet that already encodes your current filters.

## Embed mode behavior

- Site header, footer, background decorations, and navigation are hidden on all `/embed/*` routes.
- A "SemiAnalysis InferenceX →" link appears in the chart caption (`Source: …`), deep-linking to the equivalent canonical dashboard URL.
- `robots: noindex, nofollow` is set on all embed routes — they won't appear in search results.
- An `embed_view` PostHog event is fired once on mount, capturing `referrer`, `embed_host`, `embed_chart`, `model`, `sequence`, `gpus`, `y_metric`, and `precisions`. This makes external embed traffic attributable in analytics.

## CSP / framing

Embed routes (`/embed/*`) set `Content-Security-Policy: frame-ancestors *`, allowing iframing from any origin.

All other routes set `frame-ancestors 'self'` and `X-Frame-Options: SAMEORIGIN`, blocking third-party framing.

## Recommended iframe snippet

```html
<iframe
  src="https://inferencex.semianalysis.com/embed/scatter?model=dsr1&isl=8192&osl=1024&precisions=fp4&y=tpPerGpu"
  width="800"
  height="500"
  loading="lazy"
  referrerpolicy="origin"
  allow="clipboard-write"
  style="border:none;border-radius:8px"
>
</iframe>
```

**Important — `referrerpolicy="origin"`:** many partner sites ship `<meta name="referrer" content="no-referrer">`. Without an explicit `referrerpolicy="origin"` on the `<iframe>`, the embed loses all referrer information, which breaks traffic attribution in the `embed_view` event. Use `origin` (not `strict-origin-when-cross-origin`) so the referrer is always sent.

`allow="clipboard-write"` is optional but needed if you want clipboard actions inside the embedded chart to work from the parent page.

You can copy the same ready-made iframe snippet from the dashboard: open the chart's **Export** menu and choose **Copy embed**.

For very short iframes (around 300–400 px tall), prefer `width` ≥ 1024 if you want the legend as a side column; below that width the legend uses a collapsible row at the bottom.
