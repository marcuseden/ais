import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tvurbkuyfwpclgoxlrab.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2dXJia3V5ZndwY2xnb3hscmFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjUzNzYzNSwiZXhwIjoyMDc4MTEzNjM1fQ.ZdBlUoqEMQE9UPMi12-R2qLNHMx_RJat42rsCPOZIu8';

async function addCargoShips() {
  console.log('Adding commercial freight ships to Baltic Sea...');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Commercial freight/cargo vessels in the Baltic Sea
  const cargoShips = [
    {
      mmsi: 230123450,
      name: 'NORDIC FREIGHTER',
      ship_type: 'Cargo',
      last_lat: 59.8586,
      last_lng: 17.6389,
      sog: 11.2,
      cog: 95,
      last_seen: new Date().toISOString(),
    },
    {
      mmsi: 276345678,
      name: 'BALTIC TRADER',
      ship_type: 'Cargo',
      last_lat: 60.4518,
      last_lng: 22.2666,
      sog: 13.5,
      cog: 180,
      last_seen: new Date().toISOString(),
    },
    {
      mmsi: 265789012,
      name: 'SWEDEN CARGO',
      ship_type: 'Cargo',
      last_lat: 56.0465,
      last_lng: 12.6945,
      sog: 14.8,
      cog: 45,
      last_seen: new Date().toISOString(),
    },
    {
      mmsi: 314567890,
      name: 'CONTAINER EXPRESS',
      ship_type: 'Cargo',
      last_lat: 55.6761,
      last_lng: 12.5683,
      sog: 16.3,
      cog: 270,
      last_seen: new Date().toISOString(),
    },
    {
      mmsi: 257234567,
      name: 'ATLANTIC CARGO',
      ship_type: 'Cargo',
      last_lat: 59.1234,
      last_lng: 10.7461,
      sog: 10.9,
      cog: 135,
      last_seen: new Date().toISOString(),
    },
    {
      mmsi: 211456789,
      name: 'GERMANY FREIGHT',
      ship_type: 'Cargo',
      last_lat: 54.3233,
      last_lng: 13.0814,
      sog: 12.7,
      cog: 90,
      last_seen: new Date().toISOString(),
    },
    {
      mmsi: 276998877,
      name: 'HELSINKI TRADER',
      ship_type: 'Cargo',
      last_lat: 60.1699,
      last_lng: 24.9384,
      sog: 11.5,
      cog: 220,
      last_seen: new Date().toISOString(),
    },
    {
      mmsi: 265443322,
      name: 'STOCKHOLM EXPRESS',
      ship_type: 'Cargo',
      last_lat: 59.3293,
      last_lng: 18.0686,
      sog: 15.2,
      cog: 315,
      last_seen: new Date().toISOString(),
    },
    {
      mmsi: 230887766,
      name: 'TALLINN CARGO',
      ship_type: 'Cargo',
      last_lat: 59.4370,
      last_lng: 24.7536,
      sog: 13.8,
      cog: 180,
      last_seen: new Date().toISOString(),
    },
    {
      mmsi: 211776655,
      name: 'BALTIC CONTAINER',
      ship_type: 'Cargo',
      last_lat: 54.0924,
      last_lng: 19.0208,
      sog: 14.5,
      cog: 270,
      last_seen: new Date().toISOString(),
    },
    {
      mmsi: 276665544,
      name: 'TURKU FREIGHT',
      ship_type: 'Cargo',
      last_lat: 60.4517,
      last_lng: 22.2669,
      sog: 12.1,
      cog: 90,
      last_seen: new Date().toISOString(),
    },
    {
      mmsi: 265554433,
      name: 'GOTLAND TRADER',
      ship_type: 'Cargo',
      last_lat: 57.6348,
      last_lng: 18.2948,
      sog: 10.8,
      cog: 45,
      last_seen: new Date().toISOString(),
    },
  ];

  const { data, error } = await supabase
    .from('vessels')
    .upsert(cargoShips);

  if (error) {
    console.error('❌ Error adding cargo ships:', error.message);
  } else {
    console.log('✅ Successfully added commercial freight ships!');
    console.log(`   ${cargoShips.length} cargo vessels now in the Baltic Sea`);
    console.log('\n📦 Cargo ship locations:');
    cargoShips.forEach(v => {
      console.log(`   - ${v.name} at ${v.last_lat.toFixed(2)}, ${v.last_lng.toFixed(2)} (${v.sog} knots)`);
    });
    console.log(`\n🔄 Refresh your browser - you'll now see ${cargoShips.length + 6} total vessels!`);
    console.log('   (12 cargo + 6 passenger/tanker ships)');
  }
}

addCargoShips();

