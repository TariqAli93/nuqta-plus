PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_sales` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`invoice_number` text NOT NULL,
	`customer_id` integer,
	`subtotal` real NOT NULL,
	`discount` real DEFAULT 0,
	`tax` real DEFAULT 0,
	`total` real NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`exchange_rate` real DEFAULT 1,
	`interest_rate` real DEFAULT 0,
	`interest_amount` real DEFAULT 0,
	`payment_type` text NOT NULL,
	`paid_amount` real DEFAULT 0,
	`remaining_amount` real DEFAULT 0,
	`status` text DEFAULT 'pending' NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (datetime('now','localtime')),
	`updated_at` text DEFAULT (datetime('now','localtime')),
	`created_by` integer,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_sales`("id", "invoice_number", "customer_id", "subtotal", "discount", "tax", "total", "currency", "exchange_rate", "interest_rate", "interest_amount", "payment_type", "paid_amount", "remaining_amount", "status", "notes", "created_at", "updated_at", "created_by") SELECT "id", "invoice_number", "customer_id", "subtotal", "discount", "tax", "total", "currency", "exchange_rate", "interest_rate", "interest_amount", "payment_type", "paid_amount", "remaining_amount", "status", "notes", "created_at", "updated_at", "created_by" FROM `sales`;--> statement-breakpoint
DROP TABLE `sales`;--> statement-breakpoint
ALTER TABLE `__new_sales` RENAME TO `sales`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `sales_invoice_number_unique` ON `sales` (`invoice_number`);