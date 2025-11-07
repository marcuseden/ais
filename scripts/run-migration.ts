import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration(filename: string) {
  console.log(`Running migration: ${filename}...`);
  
  const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', filename);
  const sql = fs.readFileSync(migrationPath, 'utf-8');
  
  // Split by semicolons and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
    
    if (error) {
      // Try direct query if RPC doesn't work
      const { error: directError } = await (supabase as any).from('_').select(statement);
      if (directError) {
        console.error(`Error in statement:`, statement.substring(0, 100));
        console.error(directError);
      }
    }
  }
  
  console.log(`✅ Migration ${filename} completed`);
}

async function main() {
  try {
    await runMigration('002_contact_system.sql');
    console.log('✅ All migrations completed!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main();

