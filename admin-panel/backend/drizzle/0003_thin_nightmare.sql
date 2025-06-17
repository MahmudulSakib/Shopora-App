ALTER TABLE "image" RENAME TO "carousel_image";--> statement-breakpoint
ALTER TABLE "carousel_image" DROP CONSTRAINT "image_id_unique";--> statement-breakpoint
ALTER TABLE "carousel_image" ADD CONSTRAINT "carousel_image_id_unique" UNIQUE("id");