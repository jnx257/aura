ALTER TABLE "habits" ADD COLUMN "goal_id" uuid;--> statement-breakpoint
ALTER TABLE "habits" ADD CONSTRAINT "habits_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "habits_goal_idx" ON "habits" USING btree ("goal_id");