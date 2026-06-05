const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://nzyuwfxghaujzzfjewze.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdWJhYmFzZSIsInJlZiI6Im56eXV3ZnhnaGF1anp6Zmpld3plIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExMjQ2MjQsImV4cCI6MjA4NjQ4NDYyNH0.Uqxa3aIJacLMuacgKG0azsAw5TqUMvo9gX2UaSbD7vE');

async function test() {
  const t1 = await supabase.from('products').select('*').limit(1);
  console.log('PRODUCTS:', t1.data, t1.error);
  
  const t2 = await supabase.from('listings').select('*').limit(1);
  console.log('LISTINGS:', t2.data, t2.error);

  const t3 = await supabase.from('conversations').select('*').limit(1);
  console.log('CONVERSATIONS:', t3.data, t3.error);

  const t4 = await supabase.from('messages').select('*').limit(1);
  console.log('MESSAGES:', t4.data, t4.error);
}
test();
