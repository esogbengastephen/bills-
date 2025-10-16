-- SwitcherFi Bill Payment App - Supabase Database Schema
-- This schema supports user management, wallet integration, bill payments, and transaction tracking

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. USERS & AUTHENTICATION
-- =============================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone_number TEXT,
  referral_code TEXT UNIQUE,
  referred_by TEXT REFERENCES profiles(referral_code),
  wallet_address TEXT,
  wallet_type TEXT DEFAULT 'sui', -- 'sui', 'ethereum', etc.
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User wallet balances
CREATE TABLE wallet_balances (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  token_symbol TEXT NOT NULL, -- 'SUI', 'USDC', 'USDT'
  token_name TEXT NOT NULL,
  balance DECIMAL(20,8) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, token_symbol)
);

-- =============================================
-- 2. BILL PAYMENT SERVICES
-- =============================================

-- Service categories
CREATE TABLE service_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE, -- 'airtime', 'data', 'tv', 'electricity'
  display_name TEXT NOT NULL,
  icon TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service providers (MTN, Airtel, DSTV, etc.)
CREATE TABLE service_providers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category_id UUID REFERENCES service_categories(id),
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  vtpass_service_id TEXT, -- VTpass API service ID
  icon TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service plans/packages
CREATE TABLE service_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  provider_id UUID REFERENCES service_providers(id),
  name TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  vtpass_variation_code TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 3. TRANSACTIONS & PAYMENTS
-- =============================================

-- Transaction types
CREATE TYPE transaction_type AS ENUM (
  'airtime_purchase',
  'data_purchase', 
  'tv_subscription',
  'electricity_payment',
  'wallet_deposit',
  'wallet_withdrawal',
  'referral_bonus'
);

CREATE TYPE transaction_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled',
  'refunded'
);

-- Main transactions table
CREATE TABLE transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  transaction_type transaction_type NOT NULL,
  status transaction_status DEFAULT 'pending',
  
  -- Payment details
  amount DECIMAL(10,2) NOT NULL,
  token_symbol TEXT NOT NULL, -- Payment token
  exchange_rate DECIMAL(20,8), -- Token to Naira rate
  
  -- Service details
  service_provider_id UUID REFERENCES service_providers(id),
  service_plan_id UUID REFERENCES service_plans(id),
  recipient_phone TEXT,
  recipient_account TEXT, -- Meter number, smart card, etc.
  
  -- External references
  vtpass_request_id TEXT,
  vtpass_transaction_id TEXT,
  blockchain_tx_hash TEXT,
  
  -- Metadata
  metadata JSONB, -- Additional service-specific data
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Transaction history for audit trail
CREATE TABLE transaction_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  status transaction_status NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 4. REFERRAL SYSTEM
-- =============================================

-- Referral bonuses
CREATE TABLE referral_bonuses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  referrer_id UUID REFERENCES profiles(id),
  referee_id UUID REFERENCES profiles(id),
  bonus_amount DECIMAL(10,2) NOT NULL,
  token_symbol TEXT NOT NULL,
  transaction_id UUID REFERENCES transactions(id),
  status transaction_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 5. ANALYTICS & REPORTING
-- =============================================

-- User activity tracking
CREATE TABLE user_activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  activity_type TEXT NOT NULL, -- 'login', 'transaction', 'referral', etc.
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service usage statistics
CREATE TABLE service_usage_stats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  service_provider_id UUID REFERENCES service_providers(id),
  date DATE NOT NULL,
  transaction_count INTEGER DEFAULT 0,
  total_amount DECIMAL(15,2) DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(service_provider_id, date)
);

-- =============================================
-- 6. SYSTEM CONFIGURATION
-- =============================================

-- Exchange rates
CREATE TABLE exchange_rates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  from_token TEXT NOT NULL,
  to_currency TEXT NOT NULL DEFAULT 'NGN',
  rate DECIMAL(20,8) NOT NULL,
  source TEXT, -- 'binance', 'coinbase', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- App settings
CREATE TABLE app_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 7. INDEXES FOR PERFORMANCE
-- =============================================

-- User-related indexes
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX idx_wallet_balances_user_token ON wallet_balances(user_id, token_symbol);

-- Transaction indexes
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_vtpass_request_id ON transactions(vtpass_request_id);

-- Service indexes
CREATE INDEX idx_service_providers_category ON service_providers(category_id);
CREATE INDEX idx_service_plans_provider ON service_plans(provider_id);

-- Activity indexes
CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_user_activities_created_at ON user_activities(created_at);

-- =============================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Wallet balances policies
CREATE POLICY "Users can view own wallet balances" ON wallet_balances
  FOR SELECT USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User activities policies
CREATE POLICY "Users can view own activities" ON user_activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own activities" ON user_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 9. FUNCTIONS & TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_balances_updated_at BEFORE UPDATE ON wallet_balances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate referral codes
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
BEGIN
  RETURN UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
END;
$$ LANGUAGE plpgsql;

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, referral_code)
  VALUES (
    NEW.id,
    NEW.email,
    generate_referral_code()
  );
  
  -- Initialize wallet balances
  INSERT INTO wallet_balances (user_id, token_symbol, token_name, balance)
  VALUES 
    (NEW.id, 'SUI', 'Sui Token', 0),
    (NEW.id, 'USDC', 'USD Coin', 0),
    (NEW.id, 'USDT', 'Tether USD', 0);
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- 10. INITIAL DATA
-- =============================================

-- Insert service categories
INSERT INTO service_categories (name, display_name, icon) VALUES
  ('airtime', 'Airtime', 'phone_iphone'),
  ('data', 'Data', 'wifi'),
  ('tv', 'TV Subscription', 'tv'),
  ('electricity', 'Electricity', 'lightbulb');

-- Insert service providers
INSERT INTO service_providers (category_id, name, display_name, vtpass_service_id, icon) VALUES
  -- Airtime providers
  ((SELECT id FROM service_categories WHERE name = 'airtime'), 'mtn', 'MTN Airtime', 'mtn', 'phone_iphone'),
  ((SELECT id FROM service_categories WHERE name = 'airtime'), 'airtel', 'Airtel Airtime', 'airtel', 'phone_iphone'),
  ((SELECT id FROM service_categories WHERE name = 'airtime'), 'glo', 'GLO Airtime', 'glo', 'phone_iphone'),
  ((SELECT id FROM service_categories WHERE name = 'airtime'), '9mobile', '9mobile Airtime', '9mobile', 'phone_iphone'),
  
  -- Data providers
  ((SELECT id FROM service_categories WHERE name = 'data'), 'mtn-data', 'MTN Data', 'mtn-data', 'wifi'),
  ((SELECT id FROM service_categories WHERE name = 'data'), 'airtel-data', 'Airtel Data', 'airtel-data', 'wifi'),
  ((SELECT id FROM service_categories WHERE name = 'data'), 'glo-data', 'GLO Data', 'glo-data', 'wifi'),
  ((SELECT id FROM service_categories WHERE name = 'data'), '9mobile-data', '9mobile Data', '9mobile-data', 'wifi'),
  
  -- TV providers
  ((SELECT id FROM service_categories WHERE name = 'tv'), 'dstv', 'DSTV', 'dstv', 'tv'),
  ((SELECT id FROM service_categories WHERE name = 'tv'), 'gotv', 'GOTV', 'gotv', 'tv'),
  ((SELECT id FROM service_categories WHERE name = 'tv'), 'startimes', 'Startimes', 'startimes', 'tv'),
  ((SELECT id FROM service_categories WHERE name = 'tv'), 'showmax', 'Showmax', 'showmax', 'tv'),
  
  -- Electricity providers
  ((SELECT id FROM service_categories WHERE name = 'electricity'), 'ikeja-electric', 'Ikeja Electric', 'ikeja-electric', 'lightbulb'),
  ((SELECT id FROM service_categories WHERE name = 'electricity'), 'eko-electric', 'Eko Electricity', 'eko-electric', 'lightbulb'),
  ((SELECT id FROM service_categories WHERE name = 'electricity'), 'kano-electric', 'Kano Electricity', 'kano-electric', 'lightbulb'),
  ((SELECT id FROM service_categories WHERE name = 'electricity'), 'ph-electric', 'Port Harcourt Electric', 'ph-electric', 'lightbulb'),
  ((SELECT id FROM service_categories WHERE name = 'electricity'), 'jos-electric', 'Jos Electricity', 'jos-electric', 'lightbulb'),
  ((SELECT id FROM service_categories WHERE name = 'electricity'), 'ibadan-electric', 'Ibadan Electricity', 'ibadan-electric', 'lightbulb'),
  ((SELECT id FROM service_categories WHERE name = 'electricity'), 'kaduna-electric', 'Kaduna Electric', 'kaduna-electric', 'lightbulb'),
  ((SELECT id FROM service_categories WHERE name = 'electricity'), 'abuja-electric', 'Abuja Electric', 'abuja-electric', 'lightbulb'),
  ((SELECT id FROM service_categories WHERE name = 'electricity'), 'enugu-electric', 'Enugu Electric', 'enugu-electric', 'lightbulb'),
  ((SELECT id FROM service_categories WHERE name = 'electricity'), 'benin-electric', 'Benin Electric', 'benin-electric', 'lightbulb');

-- Insert app settings
INSERT INTO app_settings (key, value, description) VALUES
  ('referral_bonus_percentage', '5', 'Percentage bonus for successful referrals'),
  ('min_transaction_amount', '50', 'Minimum transaction amount in NGN'),
  ('max_transaction_amount', '100000', 'Maximum transaction amount in NGN'),
  ('vtpass_api_timeout', '30', 'VTpass API timeout in seconds'),
  ('exchange_rate_update_interval', '300', 'Exchange rate update interval in seconds');
