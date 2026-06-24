import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _client;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export type Subscriber = {
  id: string;
  phone_number: string;
  is_active: boolean;
  created_at: string;
  unsubscribed_at: string | null;
};

export type SubscriberProfile = {
  id: string;
  subscriber_id: string;
  onboarding_response: string | null;
  created_at: string;
};

export type Question = {
  id: string;
  text: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
};

export type Exchange = {
  id: string;
  subscriber_id: string;
  question_id: string;
  sent_date: string;
  original_answer: string | null;
  original_answer_at: string | null;
  followup_question: string | null;
  followup_sent_at: string | null;
  followup_answer: string | null;
  followup_answer_at: string | null;
  status: "sent" | "answered" | "followup_sent" | "completed";
  created_at: string;
};

/*
  SQL schema to run in Supabase SQL editor:

  create table subscribers (
    id uuid primary key default gen_random_uuid(),
    phone_number text unique not null,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    unsubscribed_at timestamptz
  );
  create index idx_subscribers_active on subscribers (is_active);

  create table subscriber_profiles (
    id uuid primary key default gen_random_uuid(),
    subscriber_id uuid not null unique references subscribers(id) on delete cascade,
    onboarding_response text,
    created_at timestamptz not null default now()
  );

  create table questions (
    id uuid primary key default gen_random_uuid(),
    text text not null,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    last_used_at timestamptz
  );
  create index idx_questions_active on questions (is_active);

  create table exchanges (
    id uuid primary key default gen_random_uuid(),
    subscriber_id uuid not null references subscribers(id) on delete cascade,
    question_id uuid not null references questions(id) on delete restrict,
    sent_date date not null,
    original_answer text,
    original_answer_at timestamptz,
    followup_question text,
    followup_sent_at timestamptz,
    followup_answer text,
    followup_answer_at timestamptz,
    status text not null default 'sent' check (status in ('sent', 'answered', 'followup_sent', 'completed')),
    created_at timestamptz not null default now(),
    unique (subscriber_id, sent_date)
  );
  create index idx_exchanges_subscriber on exchanges (subscriber_id);
  create index idx_exchanges_sent_date on exchanges (sent_date);
  create index idx_exchanges_status on exchanges (status);
*/
