CREATE TABLE "products" (
	"id" uuid PRIMARY KEY NOT NULL,
	"productName" text NOT NULL,
	"price" numeric NOT NULL,
	"details" text NOT NULL,
	"imageUrl" text,
	"videoUrl" text,
	"created" timestamp DEFAULT now(),
	CONSTRAINT "products_id_unique" UNIQUE("id")
);
--> statement-breakpoint
ALTER TABLE "admin" ALTER COLUMN "created_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "admin" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "image" ALTER COLUMN "created_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "image" ALTER COLUMN "created_at" SET DEFAULT now();