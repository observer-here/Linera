#!/bin/bash

echo "🔍 Validating Linera Tic Tac Toe Project Structure..."
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0

check_file() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}✗${NC} $1 (missing)"
    fi
}

check_dir() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}✗${NC} $1/ (missing)"
    fi
}

echo -e "\n${YELLOW}📁 Directory Structure${NC}"
echo "----------------------"
check_dir "src"
check_dir "backend"
check_dir "frontend"
check_dir "frontend/src"
check_dir "frontend/src/components"
check_dir "frontend/public"
check_dir "tests"
check_dir "docs"

echo -e "\n${YELLOW}🦀 Smart Contract Files${NC}"
echo "------------------------"
check_file "Cargo.toml"
check_file "src/lib.rs"
check_file "src/contract.rs"
check_file "src/service.rs"
check_file "src/state.rs"
check_file "tests/contract_tests.rs"

echo -e "\n${YELLOW}🖥️ Backend Files${NC}"
echo "------------------"
check_file "backend/package.json"
check_file "backend/server.js"

echo -e "\n${YELLOW}⚛️ Frontend Files${NC}"
echo "------------------"
check_file "frontend/package.json"
check_file "frontend/public/index.html"
check_file "frontend/src/index.js"
check_file "frontend/src/index.css"
check_file "frontend/src/App.js"
check_file "frontend/src/App.css"
check_file "frontend/src/App.test.js"

echo -e "\n${YELLOW}🎮 React Components${NC}"
echo "--------------------"
check_file "frontend/src/components/GameBoard.js"
check_file "frontend/src/components/GameBoard.css"
check_file "frontend/src/components/GameBoard.test.js"
check_file "frontend/src/components/GameList.js"
check_file "frontend/src/components/GameList.css"
check_file "frontend/src/components/GameList.test.js"
check_file "frontend/src/components/PlayerStats.js"
check_file "frontend/src/components/PlayerStats.css"
check_file "frontend/src/components/PlayerStats.test.js"

echo -e "\n${YELLOW}📚 Documentation${NC}"
echo "------------------"
check_file "README.md"
check_file "docs/SMART CONTRACT.md"

echo -e "\n${YELLOW}📊 Project Statistics${NC}"
echo "----------------------"

# Count lines of code
rust_lines=$(find src tests -name "*.rs" -exec wc -l {} + 2>/dev/null | tail -1 | awk '{print $1}' || echo "0")
js_lines=$(find backend frontend/src -name "*.js" -exec wc -l {} + 2>/dev/null | tail -1 | awk '{print $1}' || echo "0")
css_lines=$(find frontend/src -name "*.css" -exec wc -l {} + 2>/dev/null | tail -1 | awk '{print $1}' || echo "0")
test_files=$(find . -name "*.test.js" -o -name "*_tests.rs" | wc -l)

echo "📝 Lines of Rust code: $rust_lines"
echo "📝 Lines of JavaScript: $js_lines"
echo "🎨 Lines of CSS: $css_lines"
echo "🧪 Test files: $test_files"

# File count by type
echo -e "\n${YELLOW}📁 File Breakdown${NC}"
echo "------------------"
echo "🦀 Rust files: $(find . -name "*.rs" | wc -l)"
echo "📜 JavaScript files: $(find . -name "*.js" | wc -l)"
echo "🎨 CSS files: $(find . -name "*.css" | wc -l)"
echo "📋 JSON files: $(find . -name "*.json" | wc -l)"
echo "📖 Markdown files: $(find . -name "*.md" | wc -l)"
echo "🌐 HTML files: $(find . -name "*.html" | wc -l)"

echo -e "\n${YELLOW}🔧 Configuration Check${NC}"
echo "-----------------------"

# Check package.json dependencies
if [ -f "backend/package.json" ]; then
    backend_deps=$(grep -c '"' backend/package.json 2>/dev/null || echo "0")
    echo "📦 Backend dependencies: $backend_deps"
fi

if [ -f "frontend/package.json" ]; then
    frontend_deps=$(grep -c '"' frontend/package.json 2>/dev/null || echo "0")
    echo "📦 Frontend dependencies: $frontend_deps"
fi

# Check Cargo.toml
if [ -f "Cargo.toml" ]; then
    echo -e "${GREEN}✓${NC} Cargo.toml configured"
else
    echo -e "${RED}✗${NC} Cargo.toml missing"
fi

echo -e "\n${YELLOW}🎯 Feature Completeness${NC}"
echo "-------------------------"

# Check for key features in files
features=(
    "Real-time multiplayer:WebSocket"
    "Game state management:MapView"
    "Player statistics:wins.*losses.*draws"
    "React components:useState.*useEffect"
    "CSS animations:@keyframes"
    "Error handling:try.*catch"
    "Testing:describe.*test"
    "Documentation:README"
)

for feature in "${features[@]}"; do
    name="${feature%%:*}"
    pattern="${feature##*:}"
    
    if grep -r "$pattern" . --include="*.rs" --include="*.js" --include="*.md" >/dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $name"
    else
        echo -e "${YELLOW}?${NC} $name (pattern not found)"
    fi
done

echo -e "\n${YELLOW}🏁 Final Results${NC}"
echo "==================="
echo "Total checks: $TOTAL_CHECKS"
echo "Passed checks: $PASSED_CHECKS"
echo "Success rate: $(( PASSED_CHECKS * 100 / TOTAL_CHECKS ))%"

if [ $PASSED_CHECKS -eq $TOTAL_CHECKS ]; then
    echo -e "\n${GREEN}🎉 PROJECT VALIDATION SUCCESSFUL!${NC}"
    echo -e "${GREEN}All required files are present and the project structure is complete.${NC}"
else
    echo -e "\n${YELLOW}⚠️  PROJECT VALIDATION INCOMPLETE${NC}"
    echo -e "${YELLOW}Some files may be missing. Please check the output above.${NC}"
fi

echo -e "\n${YELLOW}🚀 Next Steps${NC}"
echo "==============="
echo "1. Deploy smart contract: cargo build && linera project publish-and-create"
echo "2. Start backend server: cd backend && npm start"
echo "3. Start frontend: cd frontend && npm start"
echo "4. Run tests: cargo test && cd frontend && npm test"
echo "5. Open browser: http://localhost:3000"

echo -e "\n${GREEN}Project validation complete!${NC}"
