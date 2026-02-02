const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vhrmxtolrrcrhrxljemp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZocm14dG9scnJjcmhyeGxqZW1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk3NDAwNCwiZXhwIjoyMDg1NTUwMDA0fQ.jnZEhrFl823cgQHubVZv_-qRwvS8aO90Yosp_jxY2cs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSql() {
  const sql = fs.readFileSync('./sql/full_schema_v2.sql', 'utf8');
  
  // Split by semicolons but be careful with function definitions
  const statements = sql
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`Found ${statements.length} SQL statements`);
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    console.log(`\n[${i + 1}/${statements.length}] Executing...`);
    console.log(stmt.substring(0, 100) + '...');
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: stmt + ';' });
      if (error) {
        console.error('Error:', error.message);
      } else {
        console.log('✅ Success');
      }
    } catch (err) {
      console.error('Exception:', err.message);
    }
  }
}

executeSql();
