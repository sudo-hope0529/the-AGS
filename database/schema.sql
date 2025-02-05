-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Users table
create table public.users (
    id uuid default uuid_generate_v4() primary key,
    email text unique not null,
    full_name text,
    avatar_url text,
    bio text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- User skills and progress
create table public.user_skills (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.users(id) on delete cascade,
    skill_name text not null,
    proficiency_level integer check (proficiency_level between 0 and 10),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, skill_name)
);

-- Courses table
create table public.courses (
    id uuid default uuid_generate_v4() primary key,
    title text not null,
    description text,
    difficulty text check (difficulty in ('beginner', 'intermediate', 'advanced')),
    prerequisites jsonb,
    content jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- User course progress
create table public.user_course_progress (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.users(id) on delete cascade,
    course_id uuid references public.courses(id) on delete cascade,
    progress float check (progress between 0 and 100),
    completed boolean default false,
    completed_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, course_id)
);

-- Projects table
create table public.projects (
    id uuid default uuid_generate_v4() primary key,
    title text not null,
    description text,
    owner_id uuid references public.users(id) on delete cascade,
    content jsonb,
    is_public boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Project collaborators
create table public.project_collaborators (
    id uuid default uuid_generate_v4() primary key,
    project_id uuid references public.projects(id) on delete cascade,
    user_id uuid references public.users(id) on delete cascade,
    role text check (role in ('owner', 'editor', 'viewer')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(project_id, user_id)
);

-- Events table
create table public.events (
    id uuid default uuid_generate_v4() primary key,
    title text not null,
    description text,
    start_time timestamp with time zone not null,
    end_time timestamp with time zone not null,
    type text check (type in ('conference', 'workshop', 'hackathon', 'meetup')),
    location jsonb,
    is_virtual boolean default false,
    max_participants integer,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Event registrations
create table public.event_registrations (
    id uuid default uuid_generate_v4() primary key,
    event_id uuid references public.events(id) on delete cascade,
    user_id uuid references public.users(id) on delete cascade,
    status text check (status in ('registered', 'waitlisted', 'cancelled')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(event_id, user_id)
);

-- Messages table for real-time chat
create table public.messages (
    id uuid default uuid_generate_v4() primary key,
    channel_id text not null,
    user_id uuid references public.users(id) on delete cascade,
    content text not null,
    timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.users enable row level security;
alter table public.user_skills enable row level security;
alter table public.courses enable row level security;
alter table public.user_course_progress enable row level security;
alter table public.projects enable row level security;
alter table public.project_collaborators enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.messages enable row level security;

-- Create policies
create policy "Users can view their own data and public profiles"
    on public.users for select
    using (
        auth.uid() = id
        or exists (
            select 1 from public.projects p
            join public.project_collaborators pc on p.id = pc.project_id
            where p.owner_id = users.id and pc.user_id = auth.uid()
        )
    );

create policy "Users can update their own data"
    on public.users for update
    using (auth.uid() = id);

-- Add more policies for other tables as needed
