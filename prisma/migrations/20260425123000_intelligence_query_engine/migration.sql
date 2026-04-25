ALTER TABLE "profiles"
ADD COLUMN "country_name" TEXT;

UPDATE "profiles"
SET "country_name" = "country_id"
WHERE "country_name" IS NULL;

ALTER TABLE "profiles"
ALTER COLUMN "country_name" SET NOT NULL;

ALTER TABLE "profiles"
DROP COLUMN "normalized_name",
DROP COLUMN "sample_size";

ALTER TABLE "profiles"
ALTER COLUMN "country_id" TYPE VARCHAR(2);

CREATE UNIQUE INDEX "profiles_name_key" ON "profiles"("name");

CREATE INDEX "profiles_gender_idx" ON "profiles"("gender");
CREATE INDEX "profiles_age_group_idx" ON "profiles"("age_group");
CREATE INDEX "profiles_country_id_idx" ON "profiles"("country_id");
CREATE INDEX "profiles_age_idx" ON "profiles"("age");
CREATE INDEX "profiles_gender_probability_idx" ON "profiles"("gender_probability");
CREATE INDEX "profiles_country_probability_idx" ON "profiles"("country_probability");
CREATE INDEX "profiles_created_at_idx" ON "profiles"("created_at");
