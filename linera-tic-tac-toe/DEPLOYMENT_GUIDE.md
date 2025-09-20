# 🚀 Linera Tic Tac Toe - Deployment Guide

This guide will help you set up the Linera CLI and deploy your Tic Tac Toe game on the Linera blockchain.

## 📋 Prerequisites

Before deploying, ensure you have:

- **Rust 1.70+** with `wasm32-unknown-unknown` target
- **Node.js 18+** and npm
- **Git** for cloning repositories
- **Protoc** (Protocol Buffers compiler)

## 🔧 Step 1: Install Linera CLI Tools

### Option A: Install from Crates.io (Recommended)

```bash
# Install Linera service binaries
cargo install --locked linera-storage-service@0.15.0
cargo install --locked linera-service@0.15.0

# Verify installation
linera-service --help
```

### Option B: Install from Source (For Development)

```bash
# Clone the Linera protocol repository
git clone https://github.com/linera-io/linera-protocol.git
cd linera-protocol
git checkout -t origin/testnet_conway

# Build and install
cargo install --locked --path linera-storage-service
cargo install --locked --path linera-service

# For debugging (optional)
export PATH="$PWD/target/debug:$PATH"
```

## 🛠️ Step 2: Set Up Your Environment

### Install Required Rust Targets

```bash
# Add WebAssembly target
rustup target add wasm32-unknown-unknown

# Install Protoc (Ubuntu/Debian)
sudo apt-get install protobuf-compiler

# Install Protoc (macOS)
brew install protobuf

# Install Protoc (Windows)
# Download from: https://github.com/protocolbuffers/protobuf/releases
```

### Verify Your Setup

```bash
# Check Rust version
rustc --version

# Check WebAssembly target
rustup target list --installed | grep wasm32

# Check Protoc
protoc --version
```

## 📦 Step 3: Prepare Your Project

### Extract and Set Up the Project

```bash
# Extract your downloaded project
tar -xzf linera-tic-tac-toe.tar.gz
cd linera-tic-tac-toe

# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..

# Build the smart contract
cargo build --target wasm32-unknown-unknown --release
```

## 🌐 Step 4: Start Linera Network

### Option A: Local Development Network

```bash
# Start local Linera service (in a separate terminal)
linera-service --port 8080 &

# Initialize a new wallet (if needed)
linera wallet init --with-new-chain

# Check wallet status
linera wallet show
```

### Option B: Connect to Testnet

```bash
# Connect to Linera testnet
linera-service --port 8080 --testnet &

# Import testnet configuration
linera wallet init --testnet
```

## 🚀 Step 5: Deploy Your Smart Contract

### Build and Deploy

```bash
# Build the contract for deployment
cargo build --target wasm32-unknown-unknown --release

# Create a new application on Linera
linera project publish-and-create

# Note the application ID returned - you'll need this!
```

### Alternative Deployment Commands

```bash
# If the above doesn't work, try:
linera publish-bytecode target/wasm32-unknown-unknown/release/linera_tic_tac_toe.wasm
linera create-application <BYTECODE_ID>

# Or use the service directly:
linera-service publish-and-create-application \
  --contract target/wasm32-unknown-unknown/release/linera_tic_tac_toe.wasm \
  --service target/wasm32-unknown-unknown/release/linera_tic_tac_toe.wasm
```

## 🖥️ Step 6: Start Backend Server

### Configure Backend

```bash
cd backend

# Create .env file
cat > .env << 'EOL'
PORT=3001
LINERA_RPC_URL=http://localhost:8080
LINERA_APPLICATION_ID=<YOUR_APPLICATION_ID>
CORS_ORIGIN=http://localhost:3000
EOL

# Start the backend server
npm start
```

The backend will:
- Connect to your Linera node
- Provide REST API endpoints
- Handle WebSocket connections for real-time updates

## 🌐 Step 7: Start Frontend Application

### Configure Frontend

```bash
cd frontend

# Create .env file
cat > .env << 'EOL'
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=ws://localhost:3001
REACT_APP_LINERA_APPLICATION_ID=<YOUR_APPLICATION_ID>
EOL

# Start the frontend
npm start
```

## 🎮 Step 8: Test Your Game

1. **Open your browser** to `http://localhost:3000`
2. **Create a new game** or join an existing one
3. **Play Tic Tac Toe** with real-time blockchain updates!

## 🔍 Troubleshooting

### Common Issues and Solutions

#### 1. Linera Service Won't Start
```bash
# Check if port is already in use
lsof -i :8080

# Kill existing processes
pkill -f linera-service

# Restart with different port
linera-service --port 8081
```

#### 2. Contract Deployment Fails
```bash
# Check wallet balance
linera wallet show

# Ensure contract builds correctly
cargo check --target wasm32-unknown-unknown

# Try with verbose output
cargo build --target wasm32-unknown-unknown --release --verbose
```

#### 3. Backend Can't Connect to Linera
```bash
# Verify Linera service is running
curl http://localhost:8080/health

# Check application ID is correct
linera wallet show | grep -A 5 "Applications"

# Update backend .env with correct APPLICATION_ID
```

#### 4. Frontend Connection Issues
```bash
# Check backend is running
curl http://localhost:3001/api/health

# Verify WebSocket connection
curl -i -N -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     -H "Sec-WebSocket-Key: test" \
     -H "Sec-WebSocket-Version: 13" \
     http://localhost:3001/socket.io/
```

## 📊 Monitoring Your Deployment

### Check Application Status
```bash
# View your applications
linera wallet show

# Query application state
linera query-application <APPLICATION_ID>

# View recent blocks
linera query-validators
```

### Backend Logs
```bash
# View backend logs
tail -f backend/server.log

# Debug mode
DEBUG=tic-tac-toe:* npm start
```

### Frontend Development Tools
- Open browser DevTools (F12)
- Check Console for errors
- Monitor Network tab for API calls
- Use React DevTools extension

## 🌍 Production Deployment

### Deploy to Linera Mainnet

```bash
# Connect to mainnet
linera-service --port 8080 --mainnet

# Deploy with production wallet
linera wallet init --mainnet
linera project publish-and-create --with-wallet production
```

### Production Environment Variables

**Backend (.env.production)**
```env
PORT=3001
LINERA_RPC_URL=https://mainnet.linera.io
LINERA_APPLICATION_ID=<MAINNET_APPLICATION_ID>
CORS_ORIGIN=https://your-domain.com
NODE_ENV=production
```

**Frontend (.env.production)**
```env
REACT_APP_API_URL=https://api.your-domain.com
REACT_APP_WS_URL=wss://api.your-domain.com
REACT_APP_LINERA_APPLICATION_ID=<MAINNET_APPLICATION_ID>
```

## 🔐 Security Considerations

1. **Private Keys**: Never commit wallet files to version control
2. **Environment Variables**: Use secure environment variable management
3. **CORS**: Configure proper CORS origins for production
4. **Rate Limiting**: Implement rate limiting in production backend
5. **SSL/TLS**: Use HTTPS/WSS in production

## 📈 Performance Optimization

### Smart Contract
- Optimize Rust code for WebAssembly
- Minimize state storage operations
- Use efficient data structures

### Backend
- Implement connection pooling
- Add caching for frequently accessed data
- Use PM2 for process management in production

### Frontend
- Enable React production build optimizations
- Implement code splitting
- Use service workers for caching

## 🎯 Next Steps

After successful deployment:

1. **Test thoroughly** with multiple players
2. **Monitor performance** and error rates
3. **Gather user feedback** for improvements
4. **Scale infrastructure** as needed
5. **Add new features** like tournaments or AI opponents

## 📞 Support Resources

- **Linera Documentation**: https://linera.dev
- **Linera GitHub**: https://github.com/linera-io/linera-protocol
- **Linera Forum**: https://forum.linera.io
- **Discord**: Join the Linera community Discord

---

**🎉 Congratulations! Your Linera Tic Tac Toe game is now deployed and ready for players!**

*Experience the future of decentralized gaming with Linera's microchain architecture.*
