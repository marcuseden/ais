import { globalVesselLookup } from './src/lib/globalVesselLookup';

async function test() {
  console.log('Testing global vessel lookup...\n');
  
  // Test with a real vessel MMSI from our demo data
  const testMMSI = 265517000; // STENA GERMANICA
  
  console.log(`🔍 Looking up MMSI: ${testMMSI}`);
  console.log('This will try multiple sources: VesselFinder, MarineTraffic, FleetMon\n');
  
  const result = await globalVesselLookup(testMMSI);
  
  if (result) {
    console.log('✅ Vessel found!');
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('❌ No data found');
  }
}

test();

