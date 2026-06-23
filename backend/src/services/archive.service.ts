import { pool } from "../config/database.js";

interface ArchiveStats {
  totalArchived: number;
  totalErrors: number;
  errors: string[];
  durationMs: number;
}

interface ArchiveStatus {
  isRunning: boolean;
  lastRun: string | null;
  lastCount: number;
  totalArchivedAllTime: number;
}

const status: ArchiveStatus = { isRunning: false, lastRun: null, lastCount: 0, totalArchivedAllTime: 0 };

export const archiveService = {
  getStatus(): ArchiveStatus {
    return { ...status };
  },

  async archiveFindingsOlderThan(months: number = 12): Promise<ArchiveStats> {
    if (status.isRunning) return { totalArchived: 0, totalErrors: 0, errors: ["Archive already running"], durationMs: 0 };
    status.isRunning = true;
    const errors: string[] = [];
    const start = Date.now();

    try {
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - months);
      const client = await pool.connect();

      try {
        await client.query("BEGIN");

        const moveResult = await client.query(
          `WITH moved AS (
            DELETE FROM unified_findings
            WHERE created_at < $1
              AND deleted_at IS NULL
              AND status != 'OPEN'
            RETURNING *
          )
          INSERT INTO findings_archive
            SELECT *, now() FROM moved
          RETURNING id`,
          [cutoff.toISOString()]
        );

        const count = moveResult.rowCount || 0;
        status.lastCount = count;
        status.totalArchivedAllTime += count;
        status.lastRun = new Date().toISOString();

        await client.query("COMMIT");
        return { totalArchived: count, totalErrors: errors.length, errors, durationMs: Date.now() - start };
      } catch (err: any) {
        await client.query("ROLLBACK");
        errors.push(err.message);
        return { totalArchived: 0, totalErrors: 1, errors, durationMs: Date.now() - start };
      } finally {
        client.release();
      }
    } catch (err: any) {
      errors.push(err.message);
      return { totalArchived: 0, totalErrors: 1, errors, durationMs: Date.now() - start };
    } finally {
      status.isRunning = false;
    }
  },
};
