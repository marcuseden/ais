import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://tvurbkuyfwpclgoxlrab.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2dXJia3V5ZndwY2xnb3hscmFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjUzNzYzNSwiZXhwIjoyMDc4MTEzNjM1fQ.ZdBlUoqEMQE9UPMi12-R2qLNHMx_RJat42rsCPOZIu8';

async function runMigration() {
  console.log('Running migration 002_contact_system.sql...\n');
  
  const sql = fs.readFileSync('supabase/migrations/002_contact_system.sql', 'utf-8');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Execute the SQL
  const { error } = await (supabase as any).rpc('exec', { sql });
  
  if (error) {
    console.error('Migration error:', error);
    console.log('\n⚠️  Please run this SQL manually in Supabase Dashboard → SQL Editor');
  } else {
    console.log('✅ Migration completed successfully!');
    console.log('\nNew tables created:');
    console.log('  - vessel_contacts (owner contact info)');
    console.log('  - sms_notifications (SMS alerts to Erik)');
    console.log('  - contact_log (GDPR compliance tracking)');
    console.log('  - vessel_chats (chat conversations)');
    console.log('  - chat_messages (chat history)');
    console.log('  - vessel_registry (global vessel lookup cache)');
  }
}

runMigration();

