-- ══════════════════════════════════════════════════════════════
-- Expense HUD — Initial Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ══════════════════════════════════════════════════════════════

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ── updated_at trigger ──────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ── categories ──────────────────────────────────────────────
create table public.categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  local_id integer,
  name text not null,
  icon text not null default '',
  color text not null default '#6b7280',
  type text check (type in ('expense', 'income', 'transfer')) not null,
  parent_id uuid references public.categories(id),
  keywords text[] default '{}',
  budget numeric,
  is_default boolean default false,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.categories enable row level security;
create policy "Users own categories" on public.categories for select using (auth.uid() = user_id);
create policy "Users insert categories" on public.categories for insert with check (auth.uid() = user_id);
create policy "Users update categories" on public.categories for update using (auth.uid() = user_id);
create policy "Users delete categories" on public.categories for delete using (auth.uid() = user_id);
create trigger set_updated_at before update on public.categories for each row execute function public.handle_updated_at();

-- ── import_batches ──────────────────────────────────────────
create table public.import_batches (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  local_id integer,
  filename text not null,
  bank_format text not null,
  transaction_count integer not null,
  date_from timestamptz not null,
  date_to timestamptz not null,
  imported_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.import_batches enable row level security;
create policy "Users own import_batches" on public.import_batches for select using (auth.uid() = user_id);
create policy "Users insert import_batches" on public.import_batches for insert with check (auth.uid() = user_id);
create policy "Users update import_batches" on public.import_batches for update using (auth.uid() = user_id);
create policy "Users delete import_batches" on public.import_batches for delete using (auth.uid() = user_id);
create trigger set_updated_at before update on public.import_batches for each row execute function public.handle_updated_at();

-- ── transactions ────────────────────────────────────────────
create table public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  local_id integer,
  date timestamptz not null,
  description text not null,
  amount numeric not null,
  balance numeric,
  category_id uuid references public.categories(id),
  bank_account text not null default '',
  import_batch_id uuid references public.import_batches(id),
  notes text,
  is_recurring boolean default false,
  tags text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.transactions enable row level security;
create policy "Users own transactions" on public.transactions for select using (auth.uid() = user_id);
create policy "Users insert transactions" on public.transactions for insert with check (auth.uid() = user_id);
create policy "Users update transactions" on public.transactions for update using (auth.uid() = user_id);
create policy "Users delete transactions" on public.transactions for delete using (auth.uid() = user_id);
create trigger set_updated_at before update on public.transactions for each row execute function public.handle_updated_at();

-- ── budgets ─────────────────────────────────────────────────
create table public.budgets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  local_id integer,
  category_id uuid references public.categories(id),
  monthly_limit numeric not null,
  effective_from timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.budgets enable row level security;
create policy "Users own budgets" on public.budgets for select using (auth.uid() = user_id);
create policy "Users insert budgets" on public.budgets for insert with check (auth.uid() = user_id);
create policy "Users update budgets" on public.budgets for update using (auth.uid() = user_id);
create policy "Users delete budgets" on public.budgets for delete using (auth.uid() = user_id);
create trigger set_updated_at before update on public.budgets for each row execute function public.handle_updated_at();

-- ── settings ────────────────────────────────────────────────
create table public.settings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  currency text default 'AUD',
  date_format text default 'DD/MM/YYYY',
  default_bank_format text default 'commbank',
  theme text default 'system',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.settings enable row level security;
create policy "Users own settings" on public.settings for select using (auth.uid() = user_id);
create policy "Users insert settings" on public.settings for insert with check (auth.uid() = user_id);
create policy "Users update settings" on public.settings for update using (auth.uid() = user_id);
create policy "Users delete settings" on public.settings for delete using (auth.uid() = user_id);
create trigger set_updated_at before update on public.settings for each row execute function public.handle_updated_at();

-- ── goals ───────────────────────────────────────────────────
create table public.goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  local_id integer,
  type text check (type in ('save', 'spend_limit', 'category_limit', 'income_target')) not null,
  title text not null,
  target_amount numeric not null,
  category_id uuid references public.categories(id),
  deadline timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.goals enable row level security;
create policy "Users own goals" on public.goals for select using (auth.uid() = user_id);
create policy "Users insert goals" on public.goals for insert with check (auth.uid() = user_id);
create policy "Users update goals" on public.goals for update using (auth.uid() = user_id);
create policy "Users delete goals" on public.goals for delete using (auth.uid() = user_id);
create trigger set_updated_at before update on public.goals for each row execute function public.handle_updated_at();

-- ── properties ──────────────────────────────────────────────
create table public.properties (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  local_id integer,
  nickname text not null,
  address text,
  purchase_price numeric not null,
  current_value numeric not null,
  loan_amount numeric not null,
  interest_rate numeric not null,
  loan_type text check (loan_type in ('io', 'p&i')) not null,
  offset_balance numeric default 0,
  weekly_rent numeric default 0,
  vacancy_rate numeric default 0,
  monthly_running_costs numeric default 0,
  purchase_date timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.properties enable row level security;
create policy "Users own properties" on public.properties for select using (auth.uid() = user_id);
create policy "Users insert properties" on public.properties for insert with check (auth.uid() = user_id);
create policy "Users update properties" on public.properties for update using (auth.uid() = user_id);
create policy "Users delete properties" on public.properties for delete using (auth.uid() = user_id);
create trigger set_updated_at before update on public.properties for each row execute function public.handle_updated_at();

-- ── assets ──────────────────────────────────────────────────
create table public.assets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  local_id integer,
  name text not null,
  type text not null,
  value numeric not null,
  notes text,
  property_id uuid references public.properties(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.assets enable row level security;
create policy "Users own assets" on public.assets for select using (auth.uid() = user_id);
create policy "Users insert assets" on public.assets for insert with check (auth.uid() = user_id);
create policy "Users update assets" on public.assets for update using (auth.uid() = user_id);
create policy "Users delete assets" on public.assets for delete using (auth.uid() = user_id);
create trigger set_updated_at before update on public.assets for each row execute function public.handle_updated_at();

-- ── liabilities ─────────────────────────────────────────────
create table public.liabilities (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  local_id integer,
  name text not null,
  type text not null,
  balance numeric not null,
  interest_rate numeric,
  min_payment numeric,
  notes text,
  property_id uuid references public.properties(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.liabilities enable row level security;
create policy "Users own liabilities" on public.liabilities for select using (auth.uid() = user_id);
create policy "Users insert liabilities" on public.liabilities for insert with check (auth.uid() = user_id);
create policy "Users update liabilities" on public.liabilities for update using (auth.uid() = user_id);
create policy "Users delete liabilities" on public.liabilities for delete using (auth.uid() = user_id);
create trigger set_updated_at before update on public.liabilities for each row execute function public.handle_updated_at();

-- ── net_worth_snapshots ─────────────────────────────────────
create table public.net_worth_snapshots (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  local_id integer,
  date timestamptz not null,
  total_assets numeric not null,
  total_liabilities numeric not null,
  net_worth numeric not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, date)
);

alter table public.net_worth_snapshots enable row level security;
create policy "Users own snapshots" on public.net_worth_snapshots for select using (auth.uid() = user_id);
create policy "Users insert snapshots" on public.net_worth_snapshots for insert with check (auth.uid() = user_id);
create policy "Users update snapshots" on public.net_worth_snapshots for update using (auth.uid() = user_id);
create policy "Users delete snapshots" on public.net_worth_snapshots for delete using (auth.uid() = user_id);
create trigger set_updated_at before update on public.net_worth_snapshots for each row execute function public.handle_updated_at();
