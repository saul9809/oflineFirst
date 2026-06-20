// db/operations.ts
import { eq, sql } from "drizzle-orm";
import * as Crypto from "expo-crypto";
import { db } from "./provider";
import { task } from "./schema";

export async function createTask(
  title: string,
  projectId: string,
  priority: "low" | "medium" | "high" = "medium",
) {
  const id = Crypto.randomUUID();
  const now = new Date();

  await db.insert(task).values({
    id,
    title,
    projectId,
    priority,
    createdAt: now,
    updatedAt: now,
    syncStatus: "pending",
    syncVersion: 0,
  });

  return id;
}

export async function toggleTask(id: string, isCompleted: boolean) {
  await db
    .update(task)
    .set({
      isCompleted,
      updatedAt: new Date(),
      syncStatus: "pending",
      syncVersion: sql`${task.syncVersion} + 1`,
    })
    .where(eq(task.id, id));
}

export async function softDeleteTask(id: string) {
  await db
    .update(task)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date(),
      syncStatus: "pending",
    })
    .where(eq(task.id, id));
}
