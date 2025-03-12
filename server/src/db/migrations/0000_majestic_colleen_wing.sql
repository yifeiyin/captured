CREATE TABLE `collections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `collections_name_unique` ON `collections` (`name`);--> statement-breakpoint
CREATE TABLE `passkeys` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`friendlyName` text DEFAULT '' NOT NULL,
	`keyId` text NOT NULL,
	`userName` text NOT NULL,
	`publicKey` text NOT NULL,
	`counter` integer DEFAULT 0 NOT NULL,
	`transports` text DEFAULT '' NOT NULL,
	`deviceType` text DEFAULT '' NOT NULL,
	`backedUp` integer DEFAULT false NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `passkeys_keyId_unique` ON `passkeys` (`keyId`);--> statement-breakpoint
CREATE TABLE `photo_resources` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`photoId` integer NOT NULL,
	`type` text NOT NULL,
	`fileId` text NOT NULL,
	`size` integer NOT NULL,
	`height` integer NOT NULL,
	`width` integer NOT NULL,
	`isOriginal` integer DEFAULT false NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`photoId`) REFERENCES `photos`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `photo_tags` (
	`photoId` integer NOT NULL,
	`tagId` integer NOT NULL,
	PRIMARY KEY(`photoId`, `tagId`),
	FOREIGN KEY (`photoId`) REFERENCES `photos`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tagId`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `photos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`collectionId` integer,
	`width` integer DEFAULT 0 NOT NULL,
	`height` integer DEFAULT 0 NOT NULL,
	`blurhash` text DEFAULT '' NOT NULL,
	`createdAt` integer NOT NULL,
	FOREIGN KEY (`collectionId`) REFERENCES `collections`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_name_unique` ON `tags` (`name`);