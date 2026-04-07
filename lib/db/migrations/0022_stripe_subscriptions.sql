CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "stripe_customer_id" text NOT NULL,
  "stripe_price_id" text NOT NULL,
  "plan" text DEFAULT 'free' NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "current_period_start" timestamp,
  "current_period_end" timestamp,
  "cancel_at_period_end" boolean DEFAULT false,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
