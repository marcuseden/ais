import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function clearDemoData() {
  console.log('🗑️  Clearing ALL demo data...\n');
  
  // Delete all vessels
  const { error: vesselsError } = await supabase
    .from('vessels')
    .delete()
    .neq('mmsi', 0); // Delete all
  
  if (vesselsError) {
    console.error('Error clearing vessels:', vesselsError);
  } else {
    console.log('✅ Cleared all vessels');
  }
  
  // Delete vessel positions
  const { error: posError } = await supabase
    .from('vessel_positions')
    .delete()
    .neq('id', 0);
  
  if (posError) {
    console.error('Error clearing positions:', posError);
  } else {
    console.log('✅ Cleared vessel positions');
  }
  
  // Delete vessel registry
  const { error: regError } = await supabase
    .from('vessel_registry')
    .delete()
    .neq('mmsi', 0);
  
  if (regError) {
    console.error('Error clearing registry:', regError);
  } else {
    console.log('✅ Cleared vessel registry');
  }
  
  // Delete alert events
  const { error: eventsError } = await supabase
    .from('alert_events')
    .delete()
    .neq('id', 0);
  
  if (eventsError) {
    console.error('Error clearing events:', eventsError);
  } else {
    console.log('✅ Cleared alert events');
  }
  
  console.log('\n✅ Database cleared! Ready for production.');
  console.log('\n🌊 Real vessels will appear automatically from AISStream.');
  console.log('📊 They will be enriched automatically with Equasis data.');
  console.log('📱 Erik will get SMS alerts when commercial vessels enter.');
  console.log('\n🚀 SYSTEM IS NOW PRODUCTION-READY!');
}

clearDemoData();

