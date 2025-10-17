-- PayBills Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user_address TEXT NOT NULL,
    service_type TEXT NOT NULL,
    token_type TEXT NOT NULL,
    amount DECIMAL(18, 8) NOT NULL,
    service_details JSONB NOT NULL,
    tx_digest TEXT UNIQUE NOT NULL,
    pending_payment_id TEXT,
    clubkonnect_order_id TEXT,
    clubkonnect_request_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    referral_code VARCHAR(50) UNIQUE NOT NULL,
    referred_by VARCHAR(50),
    wallet_addresses TEXT[], -- Array of wallet addresses
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_activities table
CREATE TABLE IF NOT EXISTS user_activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_address TEXT NOT NULL,
    activity_type TEXT NOT NULL,
    activity_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wallet_connections table
CREATE TABLE IF NOT EXISTS wallet_connections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_address TEXT NOT NULL,
    wallet_type TEXT NOT NULL,
    connection_count INTEGER DEFAULT 1,
    last_connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_settings table
CREATE TABLE IF NOT EXISTS admin_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_address ON transactions(user_address);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_tx_digest ON transactions(tx_digest);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);

CREATE INDEX IF NOT EXISTS idx_user_activities_user_address ON user_activities(user_address);
CREATE INDEX IF NOT EXISTS idx_user_activities_activity_type ON user_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at);

CREATE INDEX IF NOT EXISTS idx_wallet_connections_user_address ON wallet_connections(user_address);
CREATE INDEX IF NOT EXISTS idx_wallet_connections_wallet_type ON wallet_connections(wallet_type);

CREATE INDEX IF NOT EXISTS idx_admin_settings_setting_key ON admin_settings(setting_key);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_transactions_updated_at 
    BEFORE UPDATE ON transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_settings_updated_at 
    BEFORE UPDATE ON admin_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin settings
INSERT INTO admin_settings (setting_key, setting_value, description) VALUES
('exchange_rate_api_key', '""', 'CoinGecko API key for exchange rates'),
('clubkonnect_mock_mode', 'true', 'Enable mock mode for ClubKonnect API'),
('treasury_address', '"0x03f4351fc3a187f58245e13e25bf0ab12e70e5e79a82f761cdb15997ba5df39c"', 'Treasury wallet address'),
('referral_bonus_percentage', '5', 'Referral bonus percentage'),
('min_transaction_amount', '0.001', 'Minimum transaction amount in SUI'),
('max_transaction_amount', '1000', 'Maximum transaction amount in SUI')
ON CONFLICT (setting_key) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow users to read their own data
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.jwt() ->> 'email' = email);

-- Allow users to insert their own data
CREATE POLICY "Users can insert their own data" ON users
    FOR INSERT WITH CHECK (true); -- Allow signup

-- Allow users to update their own data
CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.jwt() ->> 'email' = email);

-- Allow users to read their own transactions
CREATE POLICY "Users can view their own transactions" ON transactions
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users WHERE email = auth.jwt() ->> 'email'
        )
    );

-- Allow users to insert their own transactions
CREATE POLICY "Users can insert their own transactions" ON transactions
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM users WHERE email = auth.jwt() ->> 'email'
        )
    );

-- Allow users to update their own transactions
CREATE POLICY "Users can update their own transactions" ON transactions
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM users WHERE email = auth.jwt() ->> 'email'
        )
    );

-- Similar policies for user_activities
CREATE POLICY "Users can view their own activities" ON user_activities
    FOR SELECT USING (auth.jwt() ->> 'sub' = user_address);

CREATE POLICY "Users can insert their own activities" ON user_activities
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_address);

-- Similar policies for wallet_connections
CREATE POLICY "Users can view their own wallet connections" ON wallet_connections
    FOR SELECT USING (auth.jwt() ->> 'sub' = user_address);

CREATE POLICY "Users can insert their own wallet connections" ON wallet_connections
    FOR INSERT WITH CHECK (auth.jwt() ->> 'sub' = user_address);

CREATE POLICY "Users can update their own wallet connections" ON wallet_connections
    FOR UPDATE USING (auth.jwt() ->> 'sub' = user_address);

-- Admin settings are read-only for regular users
CREATE POLICY "Users can view admin settings" ON admin_settings
    FOR SELECT USING (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;