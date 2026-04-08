-- Voice Numbers Table (Purchased from Vobiz)
CREATE TABLE IF NOT EXISTS voice_numbers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_number TEXT UNIQUE NOT NULL,
    provider TEXT DEFAULT 'vobiz',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Voice Campaigns Table
CREATE TABLE IF NOT EXISTS voice_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    from_number TEXT REFERENCES voice_numbers(phone_number),
    persona_id TEXT DEFAULT 'default_persona',
    status TEXT DEFAULT 'draft', -- draft, active, paused, completed
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Voice Calls Table (Individual call logs and results)
CREATE TABLE IF NOT EXISTS voice_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES voice_campaigns(id) ON DELETE CASCADE,
    call_id TEXT UNIQUE, -- ID from Personaplex
    to_number TEXT NOT NULL,
    from_number TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, triggered, completed, failed
    transcript TEXT,
    summary TEXT,
    interest_level TEXT, -- High, Medium, Low
    key_points JSONB DEFAULT '[]',
    persona_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);

-- Enable Row Level Security (RLS)
ALTER TABLE voice_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_calls ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own voice numbers" ON voice_numbers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own voice campaigns" ON voice_campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own voice calls" ON voice_calls FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own voice numbers" ON voice_numbers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can insert their own voice campaigns" ON voice_campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can insert their own voice calls" ON voice_calls FOR INSERT WITH CHECK (auth.uid() = user_id);
