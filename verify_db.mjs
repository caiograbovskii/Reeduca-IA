import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qhonarynuxdwqvjzukgl.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFob25hcnludXhkd3F2anp1a2dsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODg5MDM5MiwiZXhwIjoyMDg0NDY2MzkyfQ.DsT-tg78lGUq0iroJvqZfB9n9h2Z5wmAStATnWgA1J4';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verify() {
    console.log("=== INICIANDO VERIFICAÇÃO DO SUPABASE ===");

    // 1. Pegar todos os usuários da tabela AUTH
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
        console.error("Erro ao buscar auth users:", authError);
        return;
    }
    
    // 2. Pegar todos da tabela PROFILES
    const { data: profiles, error: profError } = await supabase.from('profiles').select('*');
    if (profError) {
        console.error("Erro ao buscar public profiles:", profError);
        return;
    }

    console.log(`\nEncontrados ${authUsers.users.length} usuários em auth.users`);
    console.log(`Encontrados ${profiles.length} perfis em public.profiles`);

    let orphaned = 0;
    
    for (const authUser of authUsers.users) {
        const profile = profiles.find(p => p.id === authUser.id);
        if (!profile) {
            console.log(`[ALERTA] Apagando Usuário Órfão! ID: ${authUser.id} | Email: ${authUser.email}`);
            const { error: delError } = await supabase.auth.admin.deleteUser(authUser.id);
            if (delError) {
                console.error("Erro ao deletar:", delError);
            } else {
                console.log("-> Deletado com sucesso.");
                orphaned++;
            }
        }
    }

    console.log(`\n=== RESULTADO ===`);
    console.log(`Contas Órfãs Deletadas: ${orphaned}`);
    
    if (orphaned > 0) {
        console.log("Recomendação: O cliente tentou se cadastrar com o mesmo CPF em um email diferente, causando falha no trigger ou exclusão parcial.");
    } else {
        console.log("O banco de dados está consistente.");
    }
}

verify();
