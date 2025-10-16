# PayBills - Decentralized Bill Payment dApp

A modern, decentralized bill payment application built on Sui blockchain with Circle API integration for stablecoin payments.

## 🚀 Features

### 💳 Multi-Token Support
- **SUI**: Native Sui blockchain payments
- **USDC**: Circle API integration for USD Coin

### 📱 Services Supported
- **Airtime Top-up**: MTN, Airtel, GLO, 9mobile
- **Data Plans**: All major networks with various data bundles
- **Electricity Bills**: Pay for electricity tokens
- **TV Subscriptions**: DStv, GOtv, Startimes

### 🔧 Technical Features
- **Smart Contract Integration**: Escrow-based payment system
- **Real-time Balance**: Live wallet balance updates
- **Transaction History**: Complete payment tracking
- **Admin Dashboard**: Payment management and analytics
- **Database Logging**: SQLite with Prisma ORM
- **Responsive Design**: Mobile-first UI/UX

## 🛠️ Tech Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Sui dApp Kit**: Wallet integration

### Backend
- **Circle API**: Stablecoin payment processing
- **ClubKonnect API**: Bill payment services
- **Prisma ORM**: Database management
- **SQLite**: Local database storage

### Blockchain
- **Sui Network**: Primary blockchain
- **Move Language**: Smart contracts
- **Escrow Pattern**: Secure payment handling

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Sui CLI (for contract deployment)
- Circle API key (for USDC/USDT payments)

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/paybills.git
cd paybills
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create `.env.local` file:
```bash
# Database
DATABASE_URL="file:./prisma/dev.db"

# Sui Network
NEXT_PUBLIC_SUI_NETWORK="testnet"

# ClubKonnect API (Mock Mode)
CLUBKONNECT_MOCK_MODE="true"

# Circle API Configuration
CIRCLE_API_KEY="your_circle_api_key_here"
CIRCLE_ENVIRONMENT="sandbox"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Database Setup
```bash
npx prisma generate
npx prisma db push
```

### 5. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 🔧 Configuration

### Circle API Setup
1. Sign up at [Circle Developer Portal](https://developers.circle.com/)
2. Get your API key
3. Add to `.env.local`:
   ```
   CIRCLE_API_KEY="your_api_key_here"
   CIRCLE_ENVIRONMENT="sandbox"  # or "production"
   ```

### ClubKonnect API Setup
1. Register at [ClubKonnect](https://www.nellobytesystems.com/)
2. Get your UserID and API Key
3. Add to `.env.local`:
   ```
   CLUBKONNECT_USER_ID="your_user_id"
   CLUBKONNECT_API_KEY="your_api_key"
   ```

### Smart Contract Deployment
```bash
# Deploy to testnet
cd contracts
sui client publish --gas-budget 100000000

# Update contract addresses in src/lib/bill-payment-contract.ts
```

## 📱 Usage

### For Users
1. **Connect Wallet**: Use Sui dApp Kit wallet
2. **Select Service**: Choose airtime, data, electricity, or TV
3. **Choose Token**: SUI or USDC
4. **Enter Details**: Phone number, amount, etc.
5. **Pay**: Complete payment via blockchain or Circle API

### For Admins
1. **Access Dashboard**: `/admin-dashboard`
2. **Connect Admin Wallet**: Use designated admin wallet
3. **Manage Payments**: View, confirm, or refund payments
4. **Analytics**: Track transactions and user activity

## 🏗️ Project Structure

```
paybills/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API routes
│   │   ├── admin-dashboard/ # Admin interface
│   │   └── [services]/     # Service pages
│   ├── components/         # React components
│   ├── lib/               # Utilities and services
│   └── middleware.ts      # Request middleware
├── contracts/             # Sui Move contracts
├── prisma/               # Database schema
└── public/              # Static assets
```

## 🔒 Security Features

- **Escrow System**: Funds held securely until service delivery
- **Admin Controls**: Authorized refund and confirmation
- **Transaction Logging**: Complete audit trail
- **Input Validation**: Comprehensive data validation
- **Error Handling**: Graceful failure management

## 🧪 Testing

### Mock Mode
Enable mock mode for testing without real API calls:
```bash
CLUBKONNECT_MOCK_MODE="true"
```

### Testnet Tokens
- Get test SUI from Sui testnet faucet
- Use Circle sandbox for test USDC

## 📊 Database Schema

### Tables
- **transactions**: Payment records
- **user_activities**: User behavior tracking
- **wallet_connections**: Wallet statistics
- **admin_settings**: Configuration settings

## 🚀 Deployment

### Vercel (Recommended)
1. Connect GitHub repository to Vercel
2. Add environment variables
3. Deploy automatically on push

### Manual Deployment
```bash
npm run build
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Sui Foundation](https://sui.io/) for blockchain infrastructure
- [Circle](https://developers.circle.com/) for stablecoin APIs
- [ClubKonnect](https://www.nellobytesystems.com/) for bill payment services
- [Next.js](https://nextjs.org/) for the amazing framework

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/paybills/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/paybills/discussions)
- **Documentation**: [Wiki](https://github.com/yourusername/paybills/wiki)

---

**Built with ❤️ for the decentralized future**