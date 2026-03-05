-- ========================================================================================
-- SCRIPT DE SEGURANÇA (RLS) - REEDUCA.IA
-- Este script protege as tabelas contra acessos não autorizados.
-- ========================================================================================

-- 1. Criação/Atualização de função segura para verificar se é admin
-- Usamos SECURITY DEFINER para evitar recursão infinita (erro 42P17) na tabela profiles
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ==========================================
-- TABELA: profiles
-- ==========================================
-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Limpar políticas antigas
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Recriar políticas seguras
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.is_admin());


-- ==========================================
-- TABELA: menus 
-- ==========================================
-- Habilitar RLS
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;

-- Limpar políticas antigas
DROP POLICY IF EXISTS "Users can view own menus" ON public.menus;
DROP POLICY IF EXISTS "Users can insert own menus" ON public.menus;
DROP POLICY IF EXISTS "Users can update own menus" ON public.menus;
DROP POLICY IF EXISTS "Users can delete own menus" ON public.menus;
DROP POLICY IF EXISTS "Admins can view all menus" ON public.menus;
DROP POLICY IF EXISTS "Admins can manage all menus" ON public.menus;

-- Políticas para pacientes
CREATE POLICY "Users can view own menus" ON public.menus FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own menus" ON public.menus FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own menus" ON public.menus FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own menus" ON public.menus FOR DELETE USING (auth.uid() = user_id);

-- Políticas para Admins
CREATE POLICY "Admins can view all menus" ON public.menus FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can manage all menus" ON public.menus FOR ALL USING (public.is_admin());


-- ==========================================
-- TABELA: chats
-- ==========================================
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can insert own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can update own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can delete own chats" ON public.chats;
DROP POLICY IF EXISTS "Admins can view all chats" ON public.chats;
DROP POLICY IF EXISTS "Admins can manage all chats" ON public.chats;

CREATE POLICY "Users can view own chats" ON public.chats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chats" ON public.chats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chats" ON public.chats FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own chats" ON public.chats FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all chats" ON public.chats FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can manage all chats" ON public.chats FOR ALL USING (public.is_admin());


-- ==========================================
-- TABELA: messages
-- Esta tabela é relacionada com 'chats' (chat_id). 
-- Em vez de user_id, validamos se o usuário é dono do chat correspondente.
-- ==========================================
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can manage all messages" ON public.messages;

-- Pacientes acessam mensagens onde eles são os donos do chat
CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT 
USING (auth.uid() IN (SELECT user_id FROM public.chats WHERE id = messages.chat_id));

CREATE POLICY "Users can insert own messages" ON public.messages FOR INSERT 
WITH CHECK (auth.uid() IN (SELECT user_id FROM public.chats WHERE id = chat_id));

CREATE POLICY "Users can update own messages" ON public.messages FOR UPDATE 
USING (auth.uid() IN (SELECT user_id FROM public.chats WHERE id = chat_id));

CREATE POLICY "Users can delete own messages" ON public.messages FOR DELETE 
USING (auth.uid() IN (SELECT user_id FROM public.chats WHERE id = chat_id));

-- Admins acessam todas as mensagens
CREATE POLICY "Admins can view all messages" ON public.messages FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can manage all messages" ON public.messages FOR ALL USING (public.is_admin());
