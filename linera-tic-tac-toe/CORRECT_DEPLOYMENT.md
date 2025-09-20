# ✅ **CORRECT** Linera Tic Tac Toe Deployment Guide

Based on **official Linera documentation**, here's the accurate deployment process for your game.

## 🔧 **Step 1: Install Linera CLI (Official Method)**

### Prerequisites
```bash
# Install Rust and WebAssembly target
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown

# Install Protocol Buffers compiler (Linux)
curl -LO https://github.com/protocolbuffers/protobuf/releases/download/v21.11/protoc-21.11-linux-x86_64.zip
unzip protoc-21.11-linux-x86_64.zip -d $HOME/.local
export PATH="$HOME/.local/bin:$PATH"

# For macOS: brew install protobuf
```

### Install Linera Tools (Current Version: 0.15.3)
```bash
# Install from crates.io (recommended)
cargo install --locked linera-storage-service@0.15.3
cargo install --locked linera-service@0.15.3

# Verify installation
linera --help
```

## 🎮 **Step 2: Prepare Your Game Project**

```bash
# Download and extract your project
wget https://linera-tic-tac-toe-download.lindy.site/linera-tic-tac-toe.tar.gz
tar -xzf linera-tic-tac-toe.tar.gz
cd linera-tic-tac-toe

# Install dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Build the smart contract
cargo build --target wasm32-unknown-unknown --release
```

## 🌐 **Step 3: Choose Your Deployment Target**

### Option A: Local Development Network

```bash
# Start local Linera network
linera net up

# This automatically sets up:
# - LINERA_WALLET environment variable
# - LINERA_STORAGE environment variable  
# - LINERA_KEYSTORE environment variable
```

### Option B: Testnet Deployment (Recommended)

```bash
# Initialize wallet for testnet
linera wallet init --faucet https://faucet.testnet-conway.linera.net

# Request a new chain with tokens
linera wallet request-chain --faucet https://faucet.testnet-conway.linera.net

# Check your wallet status
linera wallet show
```

## 🚀 **Step 4: Deploy Your Smart Contract (Official Command)**

```bash
# Deploy using the official Linera command
linera publish-and-create \
  target/wasm32-unknown-unknown/release/linera_tic_tac_toe_contract.wasm \
  target/wasm32-unknown-unknown/release/linera_tic_tac_toe_service.wasm \
  --json-argument "{}"

# Save the returned Application ID - you'll need it!
# Example output: Application ID: e476187f7b99bd6bf2b2d7e4b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8
```

**Important**: The exact WASM file names depend on your `Cargo.toml` configuration. Check the `target/wasm32-unknown-unknown/release/` directory for the actual filenames.

## 🖥️ **Step 5: Start Node Service**

```bash
# Start the Linera node service
linera service --port 8080 &

# The service provides GraphQL and REST endpoints for your application
```

## 🔧 **Step 6: Configure and Start Backend**

```bash
cd backend

# Create environment configuration
cat > .env << 'EOL'
PORT=3001
LINERA_RPC_URL=http://localhost:8080
LINERA_APPLICATION_ID=<YOUR_APPLICATION_ID_FROM_STEP_4>
CORS_ORIGIN=http://localhost:3000
EOL

# Start backend server
npm start
```

## 🌐 **Step 7: Start Frontend**

```bash
cd frontend

# Create environment configuration
cat > .env << 'EOL'
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=ws://localhost:3001
REACT_APP_LINERA_APPLICATION_ID=<YOUR_APPLICATION_ID_FROM_STEP_4>
EOL

# Start frontend
npm start
```

## 🎮 **Step 8: Play Your Game!**

Open your browser to: **http://localhost:3000**

## 🔍 **Verification Commands**

```bash
# Check your deployed applications
linera wallet show

# Query your application state
linera query-application <YOUR_APPLICATION_ID>

# View application details
linera describe-application <YOUR_APPLICATION_ID>
```

## ⚠️ **Important Notes**

### 1. **WASM File Names**
Your actual WASM files might be named differently. Check:
```bash
ls target/wasm32-unknown-unknown/release/*.wasm
```

Common patterns:
- `linera_tic_tac_toe_contract.wasm`
- `linera_tic_tac_toe_service.wasm`
- Or based on your `Cargo.toml` `name` field

### 2. **Application ID**
The `publish-and-create` command returns an Application ID like:
```
Application ID: e476187f7b99bd6bf2b2d7e4b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8b8
```
**Save this ID** - you need it for backend/frontend configuration!

### 3. **Environment Variables**
After running `linera net up` or wallet init, these are automatically set:
- `LINERA_WALLET`
- `LINERA_STORAGE` 
- `LINERA_KEYSTORE`

## 🐛 **Troubleshooting**

### Contract Build Issues
```bash
# Check if WASM target is installed
rustup target list --installed | grep wasm32

# Clean and rebuild
cargo clean
cargo build --target wasm32-unknown-unknown --release
```

### Deployment Fails
```bash
# Check wallet has tokens
linera wallet show

# For testnet, request more tokens
linera wallet request-chain --faucet https://faucet.testnet-conway.linera.net
```

### Service Connection Issues
```bash
# Check if service is running
curl http://localhost:8080/health

# Restart service
pkill linera-service
linera service --port 8080 &
```

## 🌟 **Key Differences from Generic Guide**

✅ **Correct**: `linera publish-and-create` (official command)  
❌ **Wrong**: `linera project publish-and-create` (doesn't exist)

✅ **Correct**: Specify both contract and service WASM files  
❌ **Wrong**: Single WASM file deployment

✅ **Correct**: Use official faucet URLs for testnet  
❌ **Wrong**: Generic testnet configurations

✅ **Correct**: `linera service --port 8080` for node service  
❌ **Wrong**: `linera-service` (different binary)

## 🎯 **This is the Official Way!**

This deployment guide follows the **official Linera documentation** from:
- https://linera.dev/developers/getting_started/installation.html
- https://linera.dev/developers/backend/deploy.html

**Your Linera Tic Tac Toe game is ready to deploy using these official commands!** 🚀
