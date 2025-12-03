PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_activity_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`action` text NOT NULL,
	`resource` text NOT NULL,
	`resource_id` integer,
	`details` text,
	`ip_address` text,
	`created_at` text DEFAULT (datetime('now','localtime')),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_activity_logs`("id", "user_id", "action", "resource", "resource_id", "details", "ip_address", "created_at") SELECT "id", "user_id", "action", "resource", "resource_id", "details", "ip_address", "created_at" FROM `activity_logs`;--> statement-breakpoint
DROP TABLE `activity_logs`;--> statement-breakpoint
ALTER TABLE `__new_activity_logs` RENAME TO `activity_logs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT (datetime('now','localtime')),
	`updated_at` text DEFAULT (datetime('now','localtime')),
	`created_by` integer,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_categories`("id", "name", "description", "is_active", "created_at", "updated_at", "created_by") SELECT "id", "name", "description", "is_active", "created_at", "updated_at", "created_by" FROM `categories`;--> statement-breakpoint
DROP TABLE `categories`;--> statement-breakpoint
ALTER TABLE `__new_categories` RENAME TO `categories`;--> statement-breakpoint
CREATE UNIQUE INDEX `categories_name_unique` ON `categories` (`name`);--> statement-breakpoint
CREATE TABLE `__new_currency_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`currency_code` text NOT NULL,
	`currency_name` text NOT NULL,
	`symbol` text NOT NULL,
	`exchange_rate` real NOT NULL,
	`is_base_currency` integer DEFAULT false,
	`is_active` integer DEFAULT true,
	`updated_at` text DEFAULT (datetime('now','localtime'))
);
--> statement-breakpoint
INSERT INTO `__new_currency_settings`("id", "currency_code", "currency_name", "symbol", "exchange_rate", "is_base_currency", "is_active", "updated_at") SELECT "id", "currency_code", "currency_name", "symbol", "exchange_rate", "is_base_currency", "is_active", "updated_at" FROM `currency_settings`;--> statement-breakpoint
DROP TABLE `currency_settings`;--> statement-breakpoint
ALTER TABLE `__new_currency_settings` RENAME TO `currency_settings`;--> statement-breakpoint
CREATE UNIQUE INDEX `currency_settings_currency_code_unique` ON `currency_settings` (`currency_code`);--> statement-breakpoint
CREATE TABLE `__new_customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`address` text,
	`city` text,
	`notes` text,
	`total_purchases` real DEFAULT 0,
	`total_debt` real DEFAULT 0,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT (datetime('now','localtime')),
	`updated_at` text DEFAULT (datetime('now','localtime')),
	`created_by` integer,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_customers`("id", "name", "phone", "address", "city", "notes", "total_purchases", "total_debt", "is_active", "created_at", "updated_at", "created_by") SELECT "id", "name", "phone", "address", "city", "notes", "total_purchases", "total_debt", "is_active", "created_at", "updated_at", "created_by" FROM `customers`;--> statement-breakpoint
DROP TABLE `customers`;--> statement-breakpoint
ALTER TABLE `__new_customers` RENAME TO `customers`;--> statement-breakpoint
CREATE TABLE `__new_installments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sale_id` integer,
	`customer_id` integer,
	`installment_number` integer NOT NULL,
	`due_amount` real NOT NULL,
	`paid_amount` real DEFAULT 0,
	`remaining_amount` real NOT NULL,
	`currency` text DEFAULT 'IQD' NOT NULL,
	`due_date` text NOT NULL,
	`paid_date` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (datetime('now','localtime')),
	`updated_at` text DEFAULT (datetime('now','localtime')),
	`created_by` integer,
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_installments`("id", "sale_id", "customer_id", "installment_number", "due_amount", "paid_amount", "remaining_amount", "currency", "due_date", "paid_date", "status", "notes", "created_at", "updated_at", "created_by") SELECT "id", "sale_id", "customer_id", "installment_number", "due_amount", "paid_amount", "remaining_amount", "currency", "due_date", "paid_date", "status", "notes", "created_at", "updated_at", "created_by" FROM `installments`;--> statement-breakpoint
DROP TABLE `installments`;--> statement-breakpoint
ALTER TABLE `__new_installments` RENAME TO `installments`;--> statement-breakpoint
CREATE TABLE `__new_inventory_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer,
	`type` text NOT NULL,
	`quantity` integer NOT NULL,
	`reference` text,
	`notes` text,
	`created_by` integer,
	`created_at` text DEFAULT (datetime('now','localtime')),
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_inventory_transactions`("id", "product_id", "type", "quantity", "reference", "notes", "created_by", "created_at") SELECT "id", "product_id", "type", "quantity", "reference", "notes", "created_by", "created_at" FROM `inventory_transactions`;--> statement-breakpoint
DROP TABLE `inventory_transactions`;--> statement-breakpoint
ALTER TABLE `__new_inventory_transactions` RENAME TO `inventory_transactions`;--> statement-breakpoint
CREATE TABLE `__new_licenses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`license_key` text NOT NULL,
	`issued_to` text,
	`is_active` integer DEFAULT false,
	`issued_at` text DEFAULT (datetime('now','localtime')),
	`expires_at` text NOT NULL,
	`created_by` integer,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_licenses`("id", "license_key", "issued_to", "is_active", "issued_at", "expires_at", "created_by") SELECT "id", "license_key", "issued_to", "is_active", "issued_at", "expires_at", "created_by" FROM `licenses`;--> statement-breakpoint
DROP TABLE `licenses`;--> statement-breakpoint
ALTER TABLE `__new_licenses` RENAME TO `licenses`;--> statement-breakpoint
CREATE UNIQUE INDEX `licenses_license_key_unique` ON `licenses` (`license_key`);--> statement-breakpoint
CREATE TABLE `__new_payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sale_id` integer,
	`customer_id` integer,
	`amount` real NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`exchange_rate` real DEFAULT 1,
	`payment_method` text NOT NULL,
	`payment_date` text DEFAULT (datetime('now','localtime')),
	`notes` text,
	`created_at` text DEFAULT (datetime('now','localtime')),
	`created_by` integer,
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_payments`("id", "sale_id", "customer_id", "amount", "currency", "exchange_rate", "payment_method", "payment_date", "notes", "created_at", "created_by") SELECT "id", "sale_id", "customer_id", "amount", "currency", "exchange_rate", "payment_method", "payment_date", "notes", "created_at", "created_by" FROM `payments`;--> statement-breakpoint
DROP TABLE `payments`;--> statement-breakpoint
ALTER TABLE `__new_payments` RENAME TO `payments`;--> statement-breakpoint
CREATE TABLE `__new_permissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`resource` text NOT NULL,
	`action` text NOT NULL,
	`description` text,
	`created_at` text DEFAULT (datetime('now','localtime')),
	`updated_at` text DEFAULT (datetime('now','localtime')),
	`created_by` integer,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_permissions`("id", "name", "resource", "action", "description", "created_at", "updated_at", "created_by") SELECT "id", "name", "resource", "action", "description", "created_at", "updated_at", "created_by" FROM `permissions`;--> statement-breakpoint
DROP TABLE `permissions`;--> statement-breakpoint
ALTER TABLE `__new_permissions` RENAME TO `permissions`;--> statement-breakpoint
CREATE UNIQUE INDEX `permissions_name_unique` ON `permissions` (`name`);--> statement-breakpoint
CREATE TABLE `__new_products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`sku` text,
	`barcode` text,
	`category_id` integer,
	`description` text,
	`cost_price` real NOT NULL,
	`selling_price` real NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`stock` integer DEFAULT 0,
	`min_stock` integer DEFAULT 0,
	`unit` text DEFAULT 'piece',
	`supplier` text,
	`status` text DEFAULT 'available' NOT NULL,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT (datetime('now','localtime')),
	`updated_at` text DEFAULT (datetime('now','localtime')),
	`created_by` integer,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_products`("id", "name", "sku", "barcode", "category_id", "description", "cost_price", "selling_price", "currency", "stock", "min_stock", "unit", "supplier", "status", "is_active", "created_at", "updated_at", "created_by") SELECT "id", "name", "sku", "barcode", "category_id", "description", "cost_price", "selling_price", "currency", "stock", "min_stock", "unit", "supplier", "status", "is_active", "created_at", "updated_at", "created_by" FROM `products`;--> statement-breakpoint
DROP TABLE `products`;--> statement-breakpoint
ALTER TABLE `__new_products` RENAME TO `products`;--> statement-breakpoint
CREATE UNIQUE INDEX `products_sku_unique` ON `products` (`sku`);--> statement-breakpoint
CREATE TABLE `__new_role_permissions` (
	`role_id` integer NOT NULL,
	`permission_id` integer NOT NULL,
	`created_at` text DEFAULT (datetime('now','localtime')),
	`updated_at` text DEFAULT (datetime('now','localtime')),
	`created_by` integer,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_role_permissions`("role_id", "permission_id", "created_at", "updated_at", "created_by") SELECT "role_id", "permission_id", "created_at", "updated_at", "created_by" FROM `role_permissions`;--> statement-breakpoint
DROP TABLE `role_permissions`;--> statement-breakpoint
ALTER TABLE `__new_role_permissions` RENAME TO `role_permissions`;--> statement-breakpoint
CREATE TABLE `__new_roles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` text DEFAULT (datetime('now','localtime')),
	`updated_at` text DEFAULT (datetime('now','localtime')),
	`created_by` integer,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_roles`("id", "name", "description", "created_at", "updated_at", "created_by") SELECT "id", "name", "description", "created_at", "updated_at", "created_by" FROM `roles`;--> statement-breakpoint
DROP TABLE `roles`;--> statement-breakpoint
ALTER TABLE `__new_roles` RENAME TO `roles`;--> statement-breakpoint
CREATE UNIQUE INDEX `roles_name_unique` ON `roles` (`name`);--> statement-breakpoint
CREATE TABLE `__new_sale_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sale_id` integer NOT NULL,
	`product_id` integer,
	`product_name` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_price` real NOT NULL,
	`discount` real DEFAULT 0,
	`subtotal` real NOT NULL,
	`created_at` text DEFAULT (datetime('now','localtime')),
	FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_sale_items`("id", "sale_id", "product_id", "product_name", "quantity", "unit_price", "discount", "subtotal", "created_at") SELECT "id", "sale_id", "product_id", "product_name", "quantity", "unit_price", "discount", "subtotal", "created_at" FROM `sale_items`;--> statement-breakpoint
DROP TABLE `sale_items`;--> statement-breakpoint
ALTER TABLE `__new_sale_items` RENAME TO `sale_items`;--> statement-breakpoint
CREATE TABLE `__new_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`description` text,
	`updated_at` text DEFAULT (datetime('now','localtime')),
	`updated_by` integer,
	FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_settings`("id", "key", "value", "description", "updated_at", "updated_by") SELECT "id", "key", "value", "description", "updated_at", "updated_by" FROM `settings`;--> statement-breakpoint
DROP TABLE `settings`;--> statement-breakpoint
ALTER TABLE `__new_settings` RENAME TO `settings`;--> statement-breakpoint
CREATE UNIQUE INDEX `settings_key_unique` ON `settings` (`key`);--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`full_name` text NOT NULL,
	`phone` text,
	`role_id` integer,
	`is_active` integer DEFAULT true,
	`last_login_at` text,
	`created_at` text DEFAULT (datetime('now','localtime')),
	`updated_at` text DEFAULT (datetime('now','localtime')),
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "username", "password", "full_name", "phone", "role_id", "is_active", "last_login_at", "created_at", "updated_at") SELECT "id", "username", "password", "full_name", "phone", "role_id", "is_active", "last_login_at", "created_at", "updated_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);