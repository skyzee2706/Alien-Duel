CREATE TABLE `challenges` (
	`id` text PRIMARY KEY NOT NULL,
	`creator_address` text NOT NULL,
	`joiner_address` text,
	`game_type` text NOT NULL,
	`bet_amount` real NOT NULL,
	`creator_result` integer NOT NULL,
	`joiner_result` integer,
	`winner_address` text,
	`status` text DEFAULT 'OPEN' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`amount` real NOT NULL,
	`status` text DEFAULT 'COMPLETED' NOT NULL,
	`payout_id` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`alien_id` text NOT NULL,
	`username` text,
	`address` text,
	`balance` real DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_alien_id_unique` ON `users` (`alien_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_address_unique` ON `users` (`address`);