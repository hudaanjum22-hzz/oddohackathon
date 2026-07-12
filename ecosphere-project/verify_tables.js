import { supabase } from './lib/supabaseClient.js';

const tables = [
  'departments',
  'categories',
  'emission_factors',
  'product_esg_profiles',
  'environmental_goals',
  'esg_policies',
  'badges',
  'rewards',
  'carbon_transactions',
  'csr_activities',
  'employee_participations',
  'challenges',
  'challenge_participations',
  'policy_acknowledgements',
  'audits',
  'compliance_issues',
  'department_scores'
];

async function verifyTables() {
  console.log("🔍 Checking table status on remote Supabase instance...");
  let successCount = 0;
  
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(1);
      
      if (error) {
        console.error(`❌ Table "${table}" verification failed: ${error.message} (${error.code})`);
      } else {
        console.log(`\x1b[32m✓ Table "${table}" verified successfully.\x1b[0m`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ Error querying table "${table}":`, err.message);
    }
  }
  
  console.log(`\n📊 Verification Complete: ${successCount} / ${tables.length} tables verified.`);
  if (successCount === tables.length) {
    console.log("\x1b[32m🎉 All 17 tables exist and are reachable!\x1b[0m");
  } else {
    console.warn("⚠️ Some tables are missing or returned errors. Please apply migrations.");
  }
}

verifyTables();
