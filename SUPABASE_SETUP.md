# 🚀 SwitcherFi Supabase Integration Guide

## 📋 Overview

This guide will help you set up Supabase for your SwitcherFi bill payment application. Supabase provides authentication, database, and real-time features that will power your app.

## 🛠️ Setup Steps

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `switcherfi-bill-payment`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for the project to be ready (2-3 minutes)

### 2. Get Project Credentials

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://xyz.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

### 3. Configure Environment Variables

1. Copy `env.example` to `.env.local`:
   ```bash
   cp env.example .env.local
   ```

2. Update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 4. Set Up Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the contents of `supabase-schema.sql`
3. Paste and run the SQL script
4. This will create all necessary tables, indexes, and functions

### 5. Configure Authentication

1. Go to **Authentication** → **Settings**
2. Configure the following:

   **Site URL**: `http://localhost:3000` (for development)
   
   **Redirect URLs**: 
   - `http://localhost:3000/auth/callback`
   - `https://yourdomain.com/auth/callback` (for production)

3. **Email Settings**:
   - Enable email confirmations
   - Customize email templates if needed

### 6. Set Up Row Level Security (RLS)

The schema includes RLS policies, but verify they're enabled:

1. Go to **Authentication** → **Policies**
2. Ensure all tables have RLS enabled
3. Check that policies are created correctly

## 🗄️ Database Schema Overview

### Core Tables

- **`profiles`**: User profiles extending Supabase auth
- **`wallet_balances`**: User token balances (SUI, USDC, USDT)
- **`transactions`**: All bill payment transactions
- **`service_categories`**: Service types (airtime, data, tv, electricity)
- **`service_providers`**: Providers (MTN, Airtel, DSTV, etc.)
- **`service_plans`**: Available plans/packages

### Key Features

- **Referral System**: Built-in referral tracking and bonuses
- **Transaction History**: Complete audit trail
- **Real-time Updates**: Live transaction status updates
- **Analytics**: User activity and service usage tracking

## 🔧 API Integration

### Available API Endpoints

- `GET /api/user?userId=xxx` - Get user profile and wallet balances
- `PATCH /api/user` - Update user profile
- `GET /api/transactions?userId=xxx` - Get user transactions
- `POST /api/transactions` - Create new transaction
- `PATCH /api/transactions` - Update transaction status
- `GET /api/services?category=xxx` - Get service providers
- `GET /api/services?providerId=xxx` - Get service plans

### Usage Examples

```typescript
// Get user data
const response = await fetch('/api/user?userId=123')
const { profile, walletBalances } = await response.json()

// Create transaction
const transaction = await fetch('/api/transactions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: '123',
    transactionType: 'airtime_purchase',
    amount: 1000,
    tokenSymbol: 'SUI',
    recipientPhone: '08012345678'
  })
})
```

## 🔐 Security Features

### Row Level Security (RLS)
- Users can only access their own data
- Automatic profile creation on signup
- Secure transaction handling

### Authentication
- Email/password authentication
- Magic link support
- Social login ready (Google, GitHub, etc.)

## 📊 Analytics & Monitoring

### Built-in Analytics
- User activity tracking
- Transaction success rates
- Service usage statistics
- Referral performance metrics

### Monitoring Queries
```sql
-- Daily transaction volume
SELECT DATE(created_at), COUNT(*), SUM(amount)
FROM transactions
WHERE status = 'completed'
GROUP BY DATE(created_at)
ORDER BY DATE(created_at) DESC;

-- Top service providers
SELECT sp.display_name, COUNT(*), SUM(t.amount)
FROM transactions t
JOIN service_providers sp ON t.service_provider_id = sp.id
WHERE t.status = 'completed'
GROUP BY sp.id, sp.display_name
ORDER BY COUNT(*) DESC;
```

## 🚀 Production Deployment

### Environment Variables for Production
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Database Backups
- Enable automatic backups in Supabase dashboard
- Set up point-in-time recovery
- Configure backup retention policy

### Performance Optimization
- Monitor query performance in Supabase dashboard
- Add indexes for frequently queried columns
- Use connection pooling for high traffic

## 🔍 Troubleshooting

### Common Issues

1. **RLS Policy Errors**
   - Check if RLS is enabled on tables
   - Verify user authentication status
   - Review policy conditions

2. **Connection Issues**
   - Verify environment variables
   - Check Supabase project status
   - Review network connectivity

3. **Transaction Failures**
   - Check VTpass API integration
   - Verify service provider configurations
   - Review error logs in Supabase

### Debug Queries
```sql
-- Check user profile
SELECT * FROM profiles WHERE id = 'user-id';

-- Check transaction status
SELECT * FROM transactions WHERE user_id = 'user-id' ORDER BY created_at DESC;

-- Check wallet balances
SELECT * FROM wallet_balances WHERE user_id = 'user-id';
```

## 📚 Next Steps

1. **Test the Integration**: Create test users and transactions
2. **Customize UI**: Update components to use real data
3. **Add Real-time Features**: Implement live transaction updates
4. **Set Up Monitoring**: Configure alerts and dashboards
5. **Deploy to Production**: Follow production deployment guide

## 🆘 Support

- **Supabase Docs**: [docs.supabase.com](https://docs.supabase.com)
- **Community**: [github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions)
- **Discord**: [discord.supabase.com](https://discord.supabase.com)
