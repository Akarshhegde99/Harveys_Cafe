import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStock() {
    const { data, error } = await supabase
        .from('menu_items')
        .select('id, name, available_count');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Database Items:');
    data.forEach(item => {
        console.log(`- "${item.name}" (ID: ${item.id}): ${item.available_count}`);
    });
}

checkStock();
