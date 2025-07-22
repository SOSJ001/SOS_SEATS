# Web3 Authentication Setup Guide for SOS SEATS

## 🚀 Overview

This guide will help you implement Web3 wallet-based authentication for your SOS SEATS application. The system allows users to connect their Solana wallets and automatically creates accounts or logs them in based on whether their wallet exists in the database.

## 📋 Prerequisites

1. **Supabase Project**: Your existing SOS SEATS Supabase project
2. **Solana Wallet**: Phantom, Solflare, or Backpack wallet installed
3. **Environment Variables**: Properly configured Supabase credentials

## 🗄️ Database Setup

### Step 1: Run the SQL Migration

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `web3_auth_migration.sql`
4. Click **Run** to execute the migration

This will create:

- `web3_users` table for storing wallet-based user accounts
- Database functions for authentication
- RLS policies for security
- Indexes for performance

### Step 2: Verify the Setup

Run these queries in the SQL Editor to verify everything is working:

```sql
-- Check if table was created
SELECT * FROM web3_users LIMIT 1;

-- Test the check_wallet_exists function
SELECT * FROM check_wallet_exists('test_wallet_address');

-- Test the create_web3_user function
SELECT * FROM create_web3_user('test_wallet_address', 'testuser', 'Test User');
```

## 🔧 Frontend Integration

### Step 1: Environment Variables

Make sure your `.env.local` file has the correct Supabase credentials:

```bash
VITE_SUPABASE_URL=https://qwoklzpfoblqmnategny.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### Step 2: Updated Components

The following components have been updated:

1. **`src/lib/supabase.js`** - Added Web3 authentication functions
2. **`src/lib/store.js`** - Added Web3 user store
3. **`src/lib/components/SolanaWalletProvider.svelte`** - Enhanced with Web3 auth
4. **`src/lib/components/WalletConnectButton.svelte`** - Integrated Web3 auth flow
5. **`src/lib/components/UsernameSetupModal.svelte`** - New component for username setup

### Step 3: Authentication Flow

The new authentication flow works as follows:

1. **User clicks "Connect Wallet"**
2. **Wallet connects** (Phantom, Solflare, or Backpack)
3. **System checks database** for existing wallet
4. **If wallet exists**: User is logged in automatically
5. **If wallet is new**: Username setup modal appears
6. **User creates account** with username and display name
7. **Account is created** and user is logged in

## 🎯 Usage Examples

### Basic Wallet Connection

```javascript
// The wallet connection is handled automatically
// Users just need to click the "Connect" button
```

### Check Authentication Status

```javascript
import { web3UserStore } from "$lib/store.js";

web3UserStore.subscribe((data) => {
  if (data.isAuthenticated) {
    console.log("User is authenticated:", data.user);
  }
});
```

### Access User Data

```javascript
import { web3UserStore } from "$lib/store.js";

let userData;
web3UserStore.subscribe((data) => {
  userData = data.user;
});

// Access user properties
console.log("User ID:", userData?.id);
console.log("Username:", userData?.username);
console.log("Wallet Address:", userData?.wallet_address);
```

## 🔒 Security Features

### Row Level Security (RLS)

- Users can only access their own data
- Wallet addresses are unique and secure
- All database operations are validated

### Data Validation

- Username format validation (3-20 characters, alphanumeric + underscore)
- Wallet address validation
- Duplicate username prevention

### Error Handling

- Comprehensive error messages
- Graceful fallbacks
- User-friendly error display

## 🧪 Testing

### Test Scenarios

1. **New User Flow**:

   - Connect wallet → Username modal → Account creation → Login

2. **Existing User Flow**:

   - Connect wallet → Automatic login

3. **Error Handling**:
   - Invalid username format
   - Duplicate username
   - Network errors

### Test Commands

```bash
# Start development server
npm run dev

# Test wallet connection
# 1. Open browser
# 2. Install Phantom wallet extension
# 3. Click "Connect Wallet" button
# 4. Follow the authentication flow
```

## 🐛 Troubleshooting

### Common Issues

1. **"Function not found" errors**:

   - Make sure you ran the SQL migration
   - Check Supabase function permissions

2. **Wallet not connecting**:

   - Verify wallet extension is installed
   - Check browser console for errors
   - Ensure wallet is unlocked

3. **Authentication failing**:
   - Check Supabase credentials in `.env.local`
   - Verify RLS policies are correct
   - Check network connectivity

### Debug Mode

Enable debug logging by adding this to your browser console:

```javascript
localStorage.setItem("debug", "web3-auth");
```

## 📊 Database Schema

### web3_users Table

| Column          | Type      | Description           |
| --------------- | --------- | --------------------- |
| id              | UUID      | Primary key           |
| wallet_address  | TEXT      | Unique wallet address |
| username        | TEXT      | Unique username       |
| display_name    | TEXT      | User's display name   |
| avatar_url      | TEXT      | Profile picture URL   |
| created_at      | TIMESTAMP | Account creation time |
| updated_at      | TIMESTAMP | Last update time      |
| last_sign_in_at | TIMESTAMP | Last sign in time     |
| is_active       | BOOLEAN   | Account status        |
| metadata        | JSONB     | Additional user data  |

### Functions

- `check_wallet_exists(wallet_address)` - Check if wallet exists
- `create_web3_user(wallet_address, username, display_name)` - Create new user
- `record_web3_sign_in(wallet_address)` - Record sign in
- `update_web3_user_profile(wallet_address, username, display_name, avatar_url)` - Update profile

## 🚀 Production Deployment

### Environment Setup

1. **Update environment variables** for production
2. **Enable RLS policies** (already done in migration)
3. **Set up proper CORS** in Supabase dashboard
4. **Configure authentication settings**

### Security Checklist

- [ ] RLS policies enabled
- [ ] Environment variables secured
- [ ] CORS properly configured
- [ ] Error handling implemented
- [ ] Input validation active
- [ ] Rate limiting configured

## 📈 Analytics & Monitoring

### Key Metrics to Track

- Wallet connection success rate
- New user registration rate
- Authentication error rates
- User retention after wallet connection

### Monitoring Queries

```sql
-- Daily new users
SELECT DATE(created_at) as date, COUNT(*) as new_users
FROM web3_users
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date;

-- Active users (last 7 days)
SELECT COUNT(*) as active_users
FROM web3_users
WHERE last_sign_in_at >= NOW() - INTERVAL '7 days';
```

## 🤝 Support

If you encounter any issues:

1. Check the browser console for errors
2. Verify Supabase dashboard for function errors
3. Test with different wallets (Phantom, Solflare, Backpack)
4. Check network connectivity and Supabase status

## 🎉 Success!

Your SOS SEATS application now has a complete Web3 authentication system! Users can connect their Solana wallets and seamlessly create accounts or log in to your platform.

The system is:

- ✅ **Secure** - RLS policies and validation
- ✅ **User-friendly** - Simple wallet connection flow
- ✅ **Scalable** - Database functions and indexes
- ✅ **GDPR-compliant** - No email/password required
- ✅ **Web3-native** - Wallet-based authentication
