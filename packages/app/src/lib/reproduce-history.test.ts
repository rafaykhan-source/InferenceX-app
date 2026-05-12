import { describe, expect, it } from 'vitest';

import type { InferenceData } from '@/components/inference/types';
import type { BenchmarkRow } from '@/lib/api';
import { rowToAggDataEntry } from '@/lib/benchmark-transform';
import { getHardwareKey } from '@/lib/chart-utils';

import {
  benchmarkRowMatchesReproducePoint,
  buildLaunchCommandForBenchmarkRow,
} from './reproduce-history';

function baseRow(overrides: Partial<BenchmarkRow> = {}): BenchmarkRow {
  return {
    hardware: 'H100',
    framework: 'vllm',
    model: 'llama3',
    precision: 'fp8',
    spec_method: 'none',
    disagg: false,
    is_multinode: false,
    prefill_tp: 1,
    prefill_ep: 0,
    prefill_dp_attention: false,
    prefill_num_workers: 1,
    decode_tp: 4,
    decode_ep: 0,
    decode_dp_attention: false,
    decode_num_workers: 1,
    num_prefill_gpu: 1,
    num_decode_gpu: 1,
    isl: 1024,
    osl: 1024,
    conc: 64,
    image: 'registry.io/img:v1',
    metrics: { tput_per_gpu: 1 },
    date: '2026-01-01',
    run_url: null,
    ...overrides,
  };
}

function basePoint(overrides: Partial<InferenceData> = {}): InferenceData {
  return {
    x: 1,
    y: 1,
    hwKey: 'H100_vllm',
    date: '2026-01-02',
    tp: 4,
    conc: 64,
    precision: 'fp8',
    framework: 'vllm',
    spec_decoding: 'none',
    disagg: false,
    tpPerGpu: { y: 1, roof: false },
    tpPerMw: { y: 1, roof: false },
    costh: { y: 1, roof: false },
    costn: { y: 1, roof: false },
    costr: { y: 1, roof: false },
    costhi: { y: 1, roof: false },
    costni: { y: 1, roof: false },
    costri: { y: 1, roof: false },
    ...overrides,
  };
}

describe('benchmarkRowMatchesReproducePoint', () => {
  it('matches when hardware resolves to the same hwKey and parallelism matches', () => {
    const row = baseRow({ decode_tp: 4, conc: 64 });
    const entry = rowToAggDataEntry(row);
    const hwKey = getHardwareKey(entry);
    const point = basePoint({ hwKey, tp: 4, conc: 64 });
    expect(benchmarkRowMatchesReproducePoint(row, point)).toBe(true);
  });

  it('rejects different concurrency', () => {
    const row = baseRow({ conc: 32 });
    const entry = rowToAggDataEntry(row);
    const hwKey = getHardwareKey(entry);
    const point = basePoint({ hwKey, conc: 64 });
    expect(benchmarkRowMatchesReproducePoint(row, point)).toBe(false);
  });

  it('rejects different decode_tp for non-disagg', () => {
    const row = baseRow({ decode_tp: 8 });
    const entry = rowToAggDataEntry(row);
    const hwKey = getHardwareKey(entry);
    const point = basePoint({ hwKey, tp: 4 });
    expect(benchmarkRowMatchesReproducePoint(row, point)).toBe(false);
  });
});

describe('buildLaunchCommandForBenchmarkRow', () => {
  it('returns a vllm single command for a standard row', () => {
    const row = baseRow();
    const launch = buildLaunchCommandForBenchmarkRow(row, 'meta-llama/Llama-3', {
      isl: 1024,
      osl: 1024,
    });
    expect(launch.kind).toBe('single');
    if (launch.kind === 'single') {
      expect(launch.command).toContain('vllm');
    }
  });
});
