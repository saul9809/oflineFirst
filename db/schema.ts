import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// -- Project table
export const projects = sqliteTable("project", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").default("#6366f1"),
  createdAt: integer("create_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("update_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  syncStatus: text("sync_status", { enum: ["pending", "synced", "conflict"] })
    .notNull()
    .default("pending"),
  syncVersion: integer("sync_version").notNull().default(0),
});

// -- Task table
export const task = sqliteTable("task", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  isCompleted: integer("is_completed", { mode: "boolean" })
    .notNull()
    .default(false),
  projectId: text("project_id").references(() => projects.id),
  priority: text("priority", { enum: ["low", "medium", "high"] }),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
  createdAt: integer("create_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("update_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  syncStatus: text("sync_status", { enum: ["pending", "synced", "conflict"] })
    .notNull()
    .default("pending"),
  syncVersion: integer("sync_version").notNull().default(0),
});
// -- Sync Queue table
export const syncQueue = sqliteTable("sync_queue", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tableName: text("table_name").notNull(),
  recordId: text("record_id").notNull(),
  operation: text("operation", {
    enum: ["create", "update", "delete"],
  }).notNull(),
  payload: text("payload").notNull(), // JSON string
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  retryCount: integer("retry_count").notNull().default(0),
  lastError: text("last_error"),
});
