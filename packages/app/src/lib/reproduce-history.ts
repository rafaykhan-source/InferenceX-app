import type { InferenceData } from '@/components/inference/types';
import type { BenchmarkRow } from '@/lib/api';
import { rowToAggDataEntry } from '@/lib/benchmark-transform';
import { getHardwareKey } from '@/lib/chart-utils';
import { buildLaunchCommand, type LaunchCommandResult } from '@/lib/reproduce-command';

function normalizeSpec(s: string | undefined): string {
  return s === undefined || s === '' ? 'none' : s;
}

/** True when this history row is the same benchmark config as the chart point. */
export function benchmarkRowMatchesReproducePoint(
  row: BenchmarkRow,
  point: InferenceData,
): boolean {
  const entry = rowToAggDataEntry(row);
  const hwKey = getHardwareKey(entry);
  if (hwKey !== point.hwKey) return false;
  if (row.framework !== point.framework) return false;
  if (row.precision !== point.precision) return false;
  if (normalizeSpec(row.spec_method) !== normalizeSpec(point.spec_decoding)) return false;
  if (row.conc !== point.conc) return false;
  if (Boolean(row.disagg) !== Boolean(point.disagg)) return false;

  if (row.disagg) {
    if (row.num_prefill_gpu !== point.num_prefill_gpu) return false;
    if (row.num_decode_gpu !== point.num_decode_gpu) return false;
    if (row.prefill_tp !== point.prefill_tp) return false;
    if (row.prefill_ep !== point.prefill_ep) return false;
    if (Boolean(row.prefill_dp_attention) !== Boolean(point.prefill_dp_attention)) return false;
    if (row.prefill_num_workers !== point.prefill_num_workers) return false;
    if (row.decode_tp !== point.decode_tp) return false;
    if (row.decode_ep !== point.decode_ep) return false;
    if (Boolean(row.decode_dp_attention) !== Boolean(point.decode_dp_attention)) return false;
    if (row.decode_num_workers !== point.decode_num_workers) return false;
  } else {
    if (row.decode_tp !== point.tp) return false;
    if (row.decode_ep !== (point.ep ?? 0)) return false;
    if (Boolean(row.decode_dp_attention) !== Boolean(point.dp_attention)) return false;
  }
  return true;
}

export function buildLaunchCommandForInferencePoint(
  point: InferenceData,
  model: string | undefined,
  sequence: { isl: number; osl: number } | undefined,
): LaunchCommandResult {
  return buildLaunchCommand(point.framework ?? '', {
    model,
    precision: point.precision,
    tp: point.tp,
    ep: point.ep,
    dp_attention: point.dp_attention,
    spec_decoding: point.spec_decoding,
    disagg: point.disagg,
    prefill_tp: point.prefill_tp,
    prefill_ep: point.prefill_ep,
    prefill_dp_attention: point.prefill_dp_attention,
    prefill_num_workers: point.prefill_num_workers,
    num_prefill_gpu: point.num_prefill_gpu,
    decode_tp: point.decode_tp,
    decode_ep: point.decode_ep,
    decode_dp_attention: point.decode_dp_attention,
    decode_num_workers: point.decode_num_workers,
    num_decode_gpu: point.num_decode_gpu,
    conc: point.conc,
    isl: sequence?.isl,
    osl: sequence?.osl,
    image: point.image,
  });
}

export function launchResultToPlainText(launch: LaunchCommandResult | null): string {
  if (!launch) return '';
  if (launch.kind === 'single' && launch.command) return launch.command;
  if (launch.kind === 'disagg' && launch.commands) {
    return launch.commands.map((c) => `# ${c.label}\n${c.command}`).join('\n\n');
  }
  return launch.fallbackReason ?? '';
}

/** Build the same launch command shape as the reproduce drawer, from a raw history row. */
export function buildLaunchCommandForBenchmarkRow(
  row: BenchmarkRow,
  model: string | undefined,
  sequence: { isl: number; osl: number } | undefined,
): LaunchCommandResult {
  const entry = rowToAggDataEntry(row);
  return buildLaunchCommand(row.framework, {
    model,
    precision: row.precision,
    tp: entry.tp,
    ep: row.decode_ep,
    dp_attention: row.decode_dp_attention,
    spec_decoding: row.spec_method,
    disagg: row.disagg,
    prefill_tp: row.prefill_tp,
    prefill_ep: row.prefill_ep,
    prefill_dp_attention: row.prefill_dp_attention,
    prefill_num_workers: row.prefill_num_workers,
    num_prefill_gpu: row.num_prefill_gpu,
    decode_tp: row.decode_tp,
    decode_ep: row.decode_ep,
    decode_dp_attention: row.decode_dp_attention,
    decode_num_workers: row.decode_num_workers,
    num_decode_gpu: row.num_decode_gpu,
    conc: row.conc,
    isl: sequence?.isl,
    osl: sequence?.osl,
    image: row.image ?? undefined,
  });
}
