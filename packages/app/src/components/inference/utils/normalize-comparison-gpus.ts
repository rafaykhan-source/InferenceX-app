/** At most two distinct hwKeys for GPU comparison (URL, presets, ordered picks). */
export function normalizeComparisonGpuList(gpus: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const g of gpus) {
    if (!g || seen.has(g)) continue;
    seen.add(g);
    out.push(g);
    if (out.length >= 2) break;
  }
  return out;
}
