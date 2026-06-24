# Socrates

> One thoughtful question every day via SMS.

Socrates is an SMS-based introspective platform that sends daily questions designed to help you understand your motivations, beliefs, decisions, and the hidden reasoning that drives your behavior.

## Vision

We believe the world's most valuable dataset isn't what people do—it's **why** they do it. Most datasets tell us:
- What people buy
- Where they work
- What they click
- Who they follow

Socrates is building the world's largest database of **human motivations, reasoning, tradeoffs, and decision-making** through daily SMS conversations.

## Features

- 📱 **Daily SMS Questions** — One thoughtful question delivered every day
- 🤖 **AI-Powered Follow-ups** — Claude analyzes responses and asks deeper follow-up questions when needed
- 💾 **Response Database** — All conversations stored in Supabase for analysis
- 📊 **Admin Dashboard** — View responses, manage questions, export data as CSV
- ⚡ **Production-Ready** — Deployed on Vercel with real Twilio SMS integration

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **SMS**: Twilio
- **AI**: Anthropic Claude
- **Deployment**: Vercel
- **Authentication**: Simple password-based (admin dashboard)

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Twilio account with SMS capability
- Supabase account
- Anthropic API key

### Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/lagarwal-gif/why-experiment.git
cd why-experiment
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` with:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
ANTHROPIC_API_KEY=your_anthropic_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number
ADMIN_PASSWORD=choose_a_password
CRON_SECRET=choose_a_secret
```

### Database Setup

1. Create a Supabase project
2. Run this SQL in the Supabase SQL editor:

```sql
create table subscribers (
  id uuid primary key default gen_random_uuid(),
  phone_number text unique not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unsubscribed_at timestamptz
);

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

create index idx_subscribers_active on subscribers (is_active);
create index idx_questions_active on questions (is_active);
create index idx_exchanges_subscriber on exchanges (subscriber_id);
create index idx_exchanges_sent_date on exchanges (sent_date);
create index idx_exchanges_status on exchanges (status);
```

3. Seed questions (optional):
```sql
insert into questions (text, is_active) values 
('What are you optimizing for most right now?', true),
('What''s a decision you made recently that you''re still unsure about?', true),
('What do you want but are unwilling to admit?', true),
('What belief do you hold that most people around you disagree with?', true),
('What''s a tradeoff you''re making that nobody sees?', true),
('What is driving most of your decisions at this stage of your life?', true);
```

### Local Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the landing page.

**Admin Dashboard**: [http://localhost:3000/admin](http://localhost:3000/admin)
- Password: the value of `ADMIN_PASSWORD`

## Project Structure

```
app/
  page.tsx                 # Landing page
  admin/
    page.tsx              # Admin login
    dashboard/page.tsx    # Admin dashboard
  api/
    subscribe/            # Signup endpoint
    twilio/webhook/       # SMS receive & AI logic
    cron/daily-send/      # Daily question dispatch
    admin/                # Admin API routes
lib/
  supabase.ts            # Supabase client
  claude.ts              # Claude API client
  followup.ts            # Follow-up question logic
  twilio.ts              # Twilio SMS wrapper
  phone.ts               # Phone number utilities
  admin-auth.ts          # Admin session auth
```

## How It Works

### 1. Signup Flow
- User enters phone number on landing page
- System subscribes them and sends onboarding SMS
- User optionally replies with background info

### 2. Daily Question
- Vercel Cron job runs daily at 17:00 UTC (9am ET)
- System picks a question from the pool using least-recently-used rotation
- Sends SMS to all active subscribers

### 3. AI Follow-up
- User replies to the daily question
- Twilio webhook receives the SMS
- Claude analyzes the response and decides if a follow-up is needed
- If yes: sends the follow-up question; if no: marks the exchange complete
- All data stored in Supabase

### 4. Admin Dashboard
- Login with admin password
- View all responses by phone number, date, or question
- Edit or delete responses
- Export all data as CSV
- Add/edit/deactivate questions

## Deployment to Vercel

1. Push code to GitHub
2. Import repository in Vercel
3. Set environment variables
4. Deploy
5. Update Twilio webhook URL to your Vercel domain

```
https://your-project.vercel.app/api/twilio/webhook
```

## Important Notes

### A2P 10DLC Registration
To send SMS to real phone numbers in the US, you must register with carriers via Twilio's Trust Hub:
- Register a brand (business identity)
- Register a campaign (use case)
- Wait for approval (1-3 days typically)

### Local Testing
During development, SMS sending is mocked (logged to console, not actually sent). When you have real Twilio credentials, set `TWILIO_ACCOUNT_SID` to a valid account ID (starts with `AC`) to enable real sending.

## Roadmap

- [ ] User accounts to save responses across devices
- [ ] Insights dashboard showing response patterns
- [ ] API for third-party integrations
- [ ] Multiple question formats (polls, ratings, scales)
- [ ] Export to PDF with analysis
- [ ] Mobile app (iOS/Android)

## Contributing

This is an MVP built over a weekend. Contributions welcome! Please:
1. Fork the repo
2. Create a feature branch
3. Submit a pull request with context

## License

MIT

## Questions?

Open an issue or reach out to [lakshyagarwal18@gmail.com](mailto:lakshyagarwal18@gmail.com)

---

**Built with ❤️ to understand what drives human decisions.**
