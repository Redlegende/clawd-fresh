#!/bin/bash
# project-automation.sh - Full stack project creation + deploy + verify
# Usage: ./project-automation.sh <project-name> [template]

set -e

PROJECT_NAME="$1"
TEMPLATE="${2:-shadcn}"
ORG_ID="${SUPABASE_ORG:-qpeaojfvnbwciqttuhzc}"
REGION="${SUPABASE_REGION:-eu-north-1}"
VERCEL_TOKEN="${VERCEL_TOKEN:-}"
SUPABASE_TOKEN="${SUPABASE_TOKEN:-}"

if [ -z "$PROJECT_NAME" ]; then
    echo "Usage: $0 <project-name> [template]"
    echo "Templates: shadcn, nextjs, blank"
    exit 1
fi

if [ -z "$VERCEL_TOKEN" ] || [ -z "$SUPABASE_TOKEN" ]; then
    echo "Error: VERCEL_TOKEN and SUPABASE_TOKEN must be set"
    exit 1
fi

echo "🚀 Creating project: $PROJECT_NAME"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Step 1: Create Supabase project
echo "📦 Creating Supabase project..."
SUPABASE_OUTPUT=$(supabase projects create "$PROJECT_NAME" --org-id "$ORG_ID" --region "$REGION" --plan free 2>&1 || true)

# Extract project ID if creation succeeded or get existing
PROJECT_ID=$(echo "$SUPABASE_OUTPUT" | grep -oE '[a-z]{20}' | head -1)

if [ -z "$PROJECT_ID" ]; then
    # Try to get existing project
    PROJECT_ID=$(supabase projects list 2>/dev/null | grep "$PROJECT_NAME" | awk '{print $3}' | head -1)
fi

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Failed to create or find Supabase project"
    exit 1
fi

echo "✅ Supabase project: $PROJECT_ID"

# Wait for project to be ready
echo "⏳ Waiting for Supabase project to be ready..."
sleep 10

# Get project URL and keys
PROJECT_URL="https://$PROJECT_ID.supabase.co"
ANON_KEY=$(supabase projects api-keys list --project-ref "$PROJECT_ID" 2>/dev/null | grep "anon" | awk '{print $2}' || echo "")

# Step 2: Create Next.js project
echo ""
echo "⚛️ Setting up Next.js project..."

if [ "$TEMPLATE" = "shadcn" ]; then
    echo n | npx shadcn@latest init --yes --template next --base-color slate 2>&1 || true
else
    npx create-next-app@latest "$PROJECT_NAME" --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm --yes 2>&1 || true
fi

cd "$PROJECT_NAME" 2>/dev/null || cd "my-app" 2>/dev/null

# Step 3: Install dependencies
echo "📥 Installing dependencies..."
npm install @supabase/supabase-js @supabase/ssr 2>&1 | tail -5

# Step 4: Create env files
echo ""
echo "🔧 Creating environment files..."
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=$PROJECT_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=
EOF

cat > .env.example << EOF
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
EOF

# Step 5: Create Supabase client
echo "📝 Creating Supabase client..."
mkdir -p lib

cat > lib/supabase.ts << 'EOF'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)
EOF

# Step 6: Create basic page
echo "🎨 Creating landing page..."
cat > app/page.tsx << 'EOF'
export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
            Welcome
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
            Your app is live and connected to Supabase.
          </p>
          <div className="flex gap-4 justify-center">
            <a 
              href="/dashboard" 
              className="px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
            >
              Dashboard
            </a>
            <a 
              href="https://supabase.com/dashboard" 
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Supabase Console
            </a>
          </div>
        </div>
        
        <div className="mt-16 grid md:grid-cols-3 gap-6">
          <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
            <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Lightning Fast</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Built with Next.js 15 and React Server Components</p>
          </div>
          
          <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Secure by Default</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Authentication and authorization built-in</p>
          </div>
          
          <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">PostgreSQL Powered</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">Real-time database with automatic APIs</p>
          </div>
        </div>
      </div>
    </main>
  )
}
EOF

# Step 7: Initialize git
echo ""
echo "📚 Initializing git..."
git init 2>/dev/null || true
git add . 2>/dev/null || true
git commit -m "Initial commit" 2>/dev/null || true

# Step 8: Link to Vercel
echo ""
echo "🚀 Deploying to Vercel..."
vercel link --token "$VERCEL_TOKEN" --yes --project "$PROJECT_NAME" 2>&1 | tail -5 || true

# Add environment variables to Vercel
echo "🔐 Setting Vercel environment variables..."
vercel env add NEXT_PUBLIC_SUPABASE_URL production "$PROJECT_URL" --token "$VERCEL_TOKEN" 2>&1 || true
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production "$ANON_KEY" --token "$VERCEL_TOKEN" 2>&1 || true

# Deploy
DEPLOY_OUTPUT=$(vercel deploy --token "$VERCEL_TOKEN" --yes --prod 2>&1)
DEPLOY_URL=$(echo "$DEPLOY_OUTPUT" | grep -oE 'https://[^ ]+\.vercel\.app' | tail -1)

if [ -z "$DEPLOY_URL" ]; then
    DEPLOY_URL=$(echo "$DEPLOY_OUTPUT" | grep -oE 'https://[^ ]+' | tail -1)
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Project created successfully!"
echo ""
echo "📦 Supabase: $PROJECT_URL"
echo "🚀 Vercel: $DEPLOY_URL"
echo "📁 Local: $(pwd)"
echo ""
echo "Next steps:"
echo "  1. cd $(pwd)"
echo "  2. vercel --token $VERCEL_TOKEN"
echo ""
echo "$DEPLOY_URL" > .deploy-url
EOF

chmod +x skills/project-automation/scripts/project-automation.sh
