// sync/engine.ts
import NetInfo from "@react-native-community/netinfo";
import { asc, eq, lte } from "drizzle-orm";
import { db } from "../db/provider";
import { projects, syncQueue, task } from "../db/schema";
import { pullChanges } from "./pull";

const MAX_RETRIES = 5;
const BATCH_SIZE = 20;
const API_BASE = "https://api.yourapp.com";

type SyncResult = {
  pushed: number;
  pulled: number;
  conflicts: number;
  errors: string[];
};

export async function runSync(): Promise<SyncResult> {
  const netState = await NetInfo.fetch();
  if (!netState.isConnected) {
    return { pushed: 0, pulled: 0, conflicts: 0, errors: ["No connection"] };
  }

  const result: SyncResult = { pushed: 0, pulled: 0, conflicts: 0, errors: [] };

  // Phase 1: Push local changes
  try {
    const pushResult = await pushChanges();
    result.pushed = pushResult.pushed;
    result.conflicts = pushResult.conflicts;
  } catch (e) {
    result.errors.push(`Push failed: ${e}`);
  }

  // Phase 2: Pull remote changes
  try {
    const pullResult = await pullChanges();
    result.pulled = pullResult.pulled;
  } catch (e) {
    result.errors.push(`Pull failed: ${e}`);
  }

  return result;
}

async function pushChanges() {
  let pushed = 0;
  let conflicts = 0;

  const pendingOps = await db
    .select()
    .from(syncQueue)
    .where(lte(syncQueue.retryCount, MAX_RETRIES))
    .orderBy(asc(syncQueue.createdAt))
    .limit(BATCH_SIZE);

  for (const op of pendingOps) {
    try {
      const response = await fetch(`${API_BASE}/sync/${op.tableName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: op.operation,
          recordId: op.recordId,
          payload: JSON.parse(op.payload),
          clientVersion: op.createdAt,
        }),
      });

      if (response.ok) {
        // Remove from queue and mark record as synced
        await db.delete(syncQueue).where(eq(syncQueue.id, op.id));
        await markRecordSynced(op.tableName, op.recordId);
        pushed++;
      } else if (response.status === 409) {
        // Conflict — server has a newer version
        conflicts++;
      } else {
        // Transient error — increment retry count
        await db
          .update(syncQueue)
          .set({
            retryCount: op.retryCount + 1,
            lastError: `HTTP ${response.status}`,
          })
          .where(eq(syncQueue.id, op.id));
      }
    } catch (e) {
      await db
        .update(syncQueue)
        .set({
          retryCount: op.retryCount + 1,
          lastError: String(e),
        })
        .where(eq(syncQueue.id, op.id));
    }
  }

  return { pushed, conflicts };
}

async function markRecordSynced(tableName: string, recordId: string) {
  const table = tableName === "tasks" ? task : projects;
  await db
    .update(table)
    .set({ syncStatus: "synced" })
    .where(eq(table.id, recordId));
}
