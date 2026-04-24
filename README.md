# SOS SEATS 🎫

**Revolutionizing Event Ticketing with Blockchain Technology**

A modern, decentralized event ticketing platform built with SvelteKit and Solana blockchain, providing secure, transparent, and engaging event management from creation to sale.

## 🌟 Features

### 🔐 **Solana Wallet Integration**

- **Multi-wallet Support**: Connect with Phantom, Solflare, or Backpack wallets
- **Seamless Authentication**: One-click wallet connection with beautiful UI
- **Real-time Status**: Live wallet connection status and address display
- **Mobile Optimized**: Responsive wallet buttons for all devices

### 🎫 **Smart Ticketing System**

- **QR Code Generation**: Secure, animated QR codes for event entry
- **Verification**: Tamper-proof ticket validation
- **Real-time Scanning**: Instant ticket verification at event gates
- **Fraud Prevention**: Advanced security measures to prevent ticket fraud

### 💰 **Blockchain Payments**

- **Solana Integration**: Fast, low-cost transactions
- **Secure Transactions**: Transparent payment processing
- **Wallet Balance**: Real-time balance display and management
- **Transaction History**: Complete payment and transfer logs

### 📱 **Mobile-First Design**

- **Responsive UI**: Optimized for all screen sizes
- **Touch-Friendly**: Intuitive mobile interactions
- **Fast Loading**: Optimized performance for mobile networks

### 🎨 **Modern UI/UX**

- **Dark Theme**: Beautiful glassmorphism design
- **Gradient Accents**: Custom color scheme with cyan, purple, and red gradients
- **Smooth Animations**: Engaging micro-interactions
- **Accessibility**: WCAG compliant design

## 🚀 Tech Stack

### **Frontend**

- **SvelteKit**: Modern full-stack framework
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Flowbite-Svelte**: UI component library

### **Blockchain**

- **Solana**: High-performance blockchain
- **@solana/web3.js**: Solana JavaScript API
- **Custom Wallet Adapters**: Multi-wallet support

### **Backend & Database**

- **Supabase**: Backend-as-a-Service
- **PostgreSQL**: Reliable database
- **Real-time Subscriptions**: Live data updates

### **Deployment**

- **Netlify**: Global CDN deployment
- **Environment Variables**: Secure configuration

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/SOS_SEATS.git
cd SOS_SEATS

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your Supabase and Solana configuration

# Run development server
npm run dev

# Build for production
npm run build
```

## 🔧 Configuration

### **Environment Variables**

```env
# Supabase
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Solana
PUBLIC_SOLANA_NETWORK=devnet
PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com

# Monime API (Orange Money) — server-only; never use PUBLIC_ for these
MONIME_API_KEY=mon_test_xxxxxxxxxxxxxxxxxxxxxxxxx
MONIME_PAYOUT_API_KEY=
MONIME_SPACE_ID=spc-xxxxxxxxxxxxxxxx
MONIME_ENVIRONMENT=test

# If you ever used PUBLIC_MONIME_* in .env, rotate the keys in the Monime dashboard
# and switch to the variables above; old keys may have been bundled in client builds.
```

### **Monime key rotation checklist (one-time ops)**

If `PUBLIC_MONIME_*` was ever committed, merged to `main`, or used in a client bundle, treat those keys as **compromised**.

1. In [Monime Dashboard](https://dashboard.monime.io), revoke or rotate the affected **payment** and **payout** API tokens.
2. Update deployment secrets and local `.env` with new values under **`MONIME_*` only** (no `PUBLIC_` prefix for secrets).
3. Search the repo and history: `git log -p -S PUBLIC_MONIME` (and your host’s secret-scan alerts). Remove any stray `PUBLIC_MONIME_*` from tracked files.
4. Confirm production and preview envs in Netlify/Vercel/etc. do not define `PUBLIC_MONIME_*`.
5. Redeploy so all running instances pick up the new keys.

### **Server security (SvelteKit)**

- **`src/hooks.server.js`**: Attaches `locals.supabase` using `@supabase/ssr` so server routes can use a cookie-aware Supabase client (refresh runs on each request).
- **`src/lib/supabase/server.js`**: Factory `createSupabaseServerClient(cookies)` if you need a client outside `locals` (e.g. tests).
- **Monime**: Keys must live in **`MONIME_*`** (private env). Route handlers live under `src/routes/api/monime/` and read secrets only on the server.
- **Orange Money fulfillment**: After payment, the success UI calls **`POST /api/orders/fulfill-mobile-money`**, which re-verifies the payment code with Monime before creating orders (do not rely on URL params alone to confirm payment).
- **Service layout**: Browser client is `src/lib/supabase/client.js`; extracted modules include `src/lib/services/orders.ts` and `src/lib/services/eventCrud.js`. `src/lib/supabase.js` re-exports for backward compatibility.
- **RLS rollout (storage / `images`)**: See [docs/RLS_ROLLOUT.md](docs/RLS_ROLLOUT.md) for shadow policies, verification gate, and rollback.
- **API contract (`src/routes/api`)**: See [docs/API_CONTRACT.md](docs/API_CONTRACT.md) for the JSON envelope, mobile-oriented notes, and the reference Monime route.
- **Dashboard vs merchant**: **`/dashboard`** shows live-event / check-in counts, recent activity, organizer quick actions, and shortcuts (tickets, wallet, marketplace, settings). **`/dashboard/merchant`** is for **sales** (tickets sold, total revenue, per-event orders/revenue on event cards); door check-in uses **`/dashboard/scanner`** (calls **`POST /api/tickets/verify`**). **`POST /api/payouts`** verifies mobile-money balance before Monime payout (see API contract doc).
- **Ops / SOS Pulse**: Set **`OPS_ADMIN_WALLETS`** (comma-separated wallet addresses from `web3Session.wallet_address`) so those wallets see **SOS Pulse** in the sidebar and can open **`/dashboard/ops/pulse`** (Monime + Solana health). **`OPS_ADMIN_USER_IDS`** remains supported for legacy compatibility. Optional **`MONIME_PRICING_LIMITS_JSON`** overrides minimum ticket prices (see `.env.example`).

### **Wallet Setup**

The platform supports multiple Solana wallets:

- **Phantom**: Most popular Solana wallet
- **Solflare**: Feature-rich wallet
- **Backpack**: Modern wallet with advanced features

### **Orange Money Setup**

For Orange Money mobile payments via Monime:

1. **Create Monime Account**: Sign up at [Monime Dashboard](https://dashboard.monime.io)
2. **Create Space**: Set up a new Space for your business
3. **Generate API Token**: Create a Personal Access Token with payments permissions
4. **Configure Environment**: Set **`MONIME_*`** variables in `.env` (see **Environment Variables** above; never use `PUBLIC_` for Monime keys)
5. **Test Integration**: Use test mode first, then switch to live for production

**Test vs Live Mode:**

- **Test Mode**: Uses `mon_test_` prefixed tokens, simulated payments
- **Live Mode**: Uses `mon_` prefixed tokens, real Orange Money transactions

## 🎯 Usage

### **For Event Organizers**

1. **Create Events**: Set up event details, pricing, and ticket types
2. **Manage Sales**: Monitor ticket sales and revenue in real-time
3. **QR Generation**: Automatic QR code creation for each ticket
4. **Analytics**: Comprehensive event analytics and insights

### **For Attendees**

1. **Browse Events**: Discover and search for events
2. **Purchase Tickets**: Secure payments via Solana or Orange Money
3. **Digital Tickets**: Receive QR codes instantly
4. **Easy Entry**: Quick scan at event gates

### **For Event Staff**

1. **QR Scanner**: Mobile app for ticket validation
2. **Real-time Updates**: Live attendance tracking
3. **Fraud Detection**: Built-in security measures

## 🔒 Security Features

- **QR Code Security**: Encrypted ticket data
- **Wallet Authentication**: Secure wallet connections
- **Fraud Prevention**: Advanced detection algorithms
- **Data Encryption**: End-to-end encryption

## 📱 Mobile Experience

- **Responsive Design**: Optimized for all devices
- **Touch Interactions**: Intuitive mobile controls
- **Fast Loading**: Optimized for mobile networks
- **Native Feel**: App-like experience

## 🎨 Design System

### **Color Palette**

- **Primary**: `#00F5FF` (Cyan)
- **Secondary**: `#9D4EDD` (Purple)
- **Accent**: `#FF6B6B` (Red)
- **Background**: `#18122B` to `#0A0A0A` (Dark gradient)

### **Typography**

- **Font Family**: Roboto Slab, Roboto
- **Responsive**: Scales appropriately on all devices

## 🌐 Live Demo

**Outdated**: [https://sos-seats.vercel.app/](https://sos-seats.vercel.app/)

_Note: The live demo may not reflect the latest features including the new Solana wallet integration._

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### **Development Setup**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Team

- **Jennifer E.K Kargbo**: Lead Writer & Content Creator
- **Amara D. James**: Product Manager & UX Designer
- **Michael S.O.S Johnson**: Lead Developer

## 🔮 Roadmap

- [ ] **NFT Tickets**: Unique digital collectibles
- [ ] **DeFi Integration**: Yield farming for ticket holders
- [ ] **Social Features**: Event discovery and sharing
- [ ] **AI Analytics**: Predictive insights for organizers
- [ ] **Multi-chain Support**: Ethereum and Polygon integration

<!-- ## 📞 Support

- **Email**: support@sosseats.com
- **Discord**: [Join our community](https://discord.gg/sosseats)
- **Twitter**: [@SOS_SEATS](https://twitter.com/SOS_SEATS) -->

---

**Built with ❤️ by the SOS SEATS Team**

_Revolutionizing event ticketing, one blockchain at a time._
