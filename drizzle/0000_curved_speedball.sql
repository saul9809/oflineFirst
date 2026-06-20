CREATE TABLE `project` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT '#6366f1',
	`create_at` integer NOT NULL,
	`update_at` integer NOT NULL,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`sync_version` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `task` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`is_completed` integer DEFAULT false NOT NULL,
	`project_id` text,
	`priority` text,
	`deleted_at` integer,
	`create_at` integer NOT NULL,
	`update_at` integer NOT NULL,
	`sync_status` text DEFAULT 'pending' NOT NULL,
	`sync_version` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE no action
);
