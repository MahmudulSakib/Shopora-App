CREATE TABLE "image" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"imageUrl" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "image_id_unique" UNIQUE("id")
);
