#!/bin/bash
# Setup script for Freddy Research Agent

set -e

echo "🔬 Setting up Freddy Research Agent..."
echo ""

# Check Python version
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "✓ Python version: $python_version"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "📥 Installing dependencies..."
pip install -r requirements.txt

# Install Playwright browsers
echo "🎭 Installing Playwright browsers..."
playwright install chromium

# Copy env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  IMPORTANT: Edit .env and add your API keys!"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env and add your API keys:"
echo "   - GEMINI_API_KEY (required): https://aistudio.google.com/app/apikey"
echo "   - MOONSHOT_API_KEY (recommended): https://platform.moonshot.cn/"
echo ""
echo "2. Run your first research:"
echo "   python src/agent.py 'Latest AI safety regulations'"
echo ""
echo "3. Read the docs:"
echo "   - README.md for usage"
echo "   - PRD.md for full specification"
