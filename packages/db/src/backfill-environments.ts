/**
 * One-shot backfill of `benchmark_environments` from historical `server_logs`.
 *
 * Iterates every existing (workflow_run_id, config_id) pair that has a
 * server log, runs `parseServerLogEnv` over the log text, and writes the
 * result via `upsertBenchmarkEnvironment`. Idempotent — re-running is safe
 * because of the ON CONFLICT clause, and the COALESCE-on-log_parse rule
 * means authoritative `env_json` rows added later (from upstream CI's
 * `env.json`) are never clobbered.
 *
 * Usage:
 *   pnpm admin:db:backfill:envs              # write to DATABASE_WRITE_URL
 *   pnpm admin:db:backfill:envs -- --dry-run # parse + print first 10 per framework, no writes
 *
 * Why per (workflow_run_id, config_id) rather than per benchmark_result_id:
 *   env data is host- and config-level, not per (conc, isl, osl). One log
 *   row is enough to populate every benchmark sharing that key.
 */

import { hasNoSslFlag } from './cli-utils';
import { createAdminSql } from './etl/db-utils';
import { parseServerLogEnv } from './etl/env-parser';
import { upsertBenchmarkEnvironment } from './etl/env-ingest';

const isDryRun = process.argv.includes('--dry-run');
const BATCH_SIZE = 200;

interface BackfillRow {
  workflow_run_id: number;
  config_id: number;
  framework: string;
  image: string | null;
  server_log: string;
}

async function main(): Promise<void> {
  const sql = createAdminSql({
    noSsl: hasNoSslFlag(),
    max: 5,
    idle_timeout: 60,
  });

  console.log('=== backfill-environments ===');
  console.log(`  mode: ${isDryRun ? 'DRY RUN (no writes)' : 'LIVE'}`);

  const [{ count: totalEnvs }] = (await sql`
    select count(*)::int as count from benchmark_environments
  `) as [{ count: number }];
  console.log(`  benchmark_environments rows before: ${totalEnvs}`);

  // One representative server log per (workflow_run_id, config_id). The DB
  // links logs to benchmark_results, so we pick the most recent log row per
  // env key and use that log's text. Limit to 1 row per pair via DISTINCT ON.
  const candidates = (await sql`
    select distinct on (br.workflow_run_id, br.config_id)
      br.workflow_run_id  as workflow_run_id,
      br.config_id        as config_id,
      c.framework         as framework,
      br.image            as image,
      sl.server_log       as server_log
    from benchmark_results br
    join configs c     on c.id = br.config_id
    join server_logs sl on sl.id = br.server_log_id
    where br.server_log_id is not null
    order by br.workflow_run_id, br.config_id, br.id desc
  `) as BackfillRow[];

  console.log(`  Found ${candidates.length} (workflow_run, config) pairs to process`);

  if (isDryRun) {
    // Show parsed output for the first 10 logs per framework.
    const perFw = new Map<string, number>();
    for (const r of candidates) {
      const n = perFw.get(r.framework) ?? 0;
      if (n >= 10) continue;
      perFw.set(r.framework, n + 1);
      const env = parseServerLogEnv(r.server_log, r.framework);
      console.log(
        `  [${r.framework.padEnd(13)} run=${r.workflow_run_id} cfg=${r.config_id}] ` +
          `fw=${env.frameworkVersion ?? '-'}, torch=${env.torchVersion ?? '-'}, py=${env.pythonVersion ?? '-'}`,
      );
    }
    await sql.end();
    return;
  }

  let processed = 0;
  let failures = 0;
  const t0 = Date.now();

  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const batch = candidates.slice(i, i + BATCH_SIZE);
    for (const r of batch) {
      try {
        const parsed = parseServerLogEnv(r.server_log, r.framework);
        await upsertBenchmarkEnvironment(sql, r.workflow_run_id, r.config_id, r.image, parsed);
        processed++;
      } catch (error: any) {
        failures++;
        console.warn(
          `  [WARN] run=${r.workflow_run_id} cfg=${r.config_id}: ${error?.message ?? error}`,
        );
      }
    }
    const pct = Math.round(((i + batch.length) / candidates.length) * 100);
    console.log(
      `  processed ${i + batch.length}/${candidates.length} (${pct}%)  failures=${failures}`,
    );
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  const [{ count: totalEnvsAfter }] = (await sql`
    select count(*)::int as count from benchmark_environments
  `) as [{ count: number }];
  const [{ count: envJsonCount }] = (await sql`
    select count(*)::int as count from benchmark_environments where source = 'env_json'
  `) as [{ count: number }];
  const [{ count: logParseCount }] = (await sql`
    select count(*)::int as count from benchmark_environments where source = 'log_parse'
  `) as [{ count: number }];

  console.log('\n=== Summary ===');
  console.log(`  Pairs processed:  ${processed}`);
  console.log(`  Failures:         ${failures}`);
  console.log(`  Elapsed:          ${elapsed}s`);
  console.log(`\n  benchmark_environments rows after: ${totalEnvsAfter}`);
  console.log(`    source = env_json:  ${envJsonCount}`);
  console.log(`    source = log_parse: ${logParseCount}`);

  await sql.end();
}

main().catch((error) => {
  console.error('backfill-environments failed:', error);
  process.exitCode = 1;
});
