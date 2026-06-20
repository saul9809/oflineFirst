// sync/pull.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { eq } from "drizzle-orm";
import { db } from "../db/provider";
import { task, projects } from "../db/schema";

const API_BASE = "https://api.yourapp.com";

export async function pullChanges() {
  let pulled = 0;
  const lastSync = await AsyncStorage.getItem("lastSyncTimestamp");
  const since = lastSync || new Date(0).toISOString();

  const response = await fetch(
    `${API_BASE}/sync/changes?since=${encodeURIComponent(since)}`,
  );
  const { changes, serverTimestamp } = await response.json();

  for (const change of changes) {
    const table = change.table === "tasks" ? task : projects;
    const existing = await db
      .select()
      .from(table)
      .where(eq(table.id, change.record.id))
      .limit(1);

    if (existing.length === 0) {
      // New record from server
      await db.insert(table).values({
        ...change.record,
        syncStatus: "synced",
      });
      pulled++;
    } else if (existing[0].syncStatus === "synced") {
      // No local modifications — safe to overwrite
      await db
        .update(table)
        .set({ ...change.record, syncStatus: "synced" })
        .where(eq(table.id, change.record.id));
      pulled++;
    } else {
      // Local modifications exist — skip and let push handle it
      // The push phase will detect the conflict via version mismatch
    }
  }

  await AsyncStorage.setItem("lastSyncTimestamp", serverTimestamp);
  return { pulled };
}
