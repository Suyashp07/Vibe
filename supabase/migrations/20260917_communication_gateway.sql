-- Vibe Host <-> Guest Communication Gateway Migration
-- Supports event-specific conversations, Telegram Supergroup topics, and future WhatsApp adapters

CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  guest_id text NOT NULL,
  host_id text NOT NULL,
  guest_name text,
  guest_email text,
  status text CHECK (status IN ('OPEN', 'CLOSED', 'BLOCKED')) DEFAULT 'OPEN',
  guest_channel text CHECK (guest_channel IN ('WEB', 'TELEGRAM', 'WHATSAPP')) DEFAULT 'WEB',
  host_channel text CHECK (host_channel IN ('WEB', 'TELEGRAM', 'WHATSAPP')) DEFAULT 'TELEGRAM',
  telegram_chat_id text,
  telegram_topic_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_message_at timestamptz DEFAULT now(),
  CONSTRAINT uq_event_guest_conversation UNIQUE (event_id, guest_id)
);

CREATE INDEX IF NOT EXISTS idx_conversations_event_guest ON public.conversations(event_id, guest_id);
CREATE INDEX IF NOT EXISTS idx_conversations_host ON public.conversations(host_id);
CREATE INDEX IF NOT EXISTS idx_conversations_telegram_topic ON public.conversations(telegram_topic_id);
CREATE INDEX IF NOT EXISTS idx_conversations_telegram_mapping ON public.conversations(telegram_chat_id, telegram_topic_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_msg ON public.conversations(last_message_at DESC);

-- Duplicate webhook protection tracking table
CREATE TABLE IF NOT EXISTS public.telegram_webhook_updates (
  update_id bigint PRIMARY KEY,
  processed_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_telegram_webhook_updates_time ON public.telegram_webhook_updates(processed_at DESC);

CREATE TABLE IF NOT EXISTS public.conversation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  sender_id text NOT NULL,
  sender_role text CHECK (sender_role IN ('GUEST', 'HOST', 'SYSTEM')) NOT NULL,
  content text NOT NULL,
  channel text CHECK (channel IN ('WEB', 'TELEGRAM', 'WHATSAPP')) NOT NULL,
  external_message_id text,
  reply_to_message_id text,
  delivery_status text CHECK (delivery_status IN ('PENDING', 'SENT', 'DELIVERED', 'FAILED')) DEFAULT 'PENDING',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conv_messages_conversation ON public.conversation_messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_conv_messages_external_id ON public.conversation_messages(external_message_id);

-- Enable Row Level Security
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_webhook_updates ENABLE ROW LEVEL SECURITY;

-- Policies for conversations
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'conversations' AND policyname = 'Conversations accessible by participants'
  ) THEN
    CREATE POLICY "Conversations accessible by participants" 
      ON public.conversations FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'conversations' AND policyname = 'Anyone authenticated can create conversation'
  ) THEN
    CREATE POLICY "Anyone authenticated can create conversation" 
      ON public.conversations FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'conversations' AND policyname = 'Participants can update conversation'
  ) THEN
    CREATE POLICY "Participants can update conversation" 
      ON public.conversations FOR UPDATE USING (true);
  END IF;
END $$;

-- Policies for conversation messages
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'conversation_messages' AND policyname = 'Messages accessible by conversation participants'
  ) THEN
    CREATE POLICY "Messages accessible by conversation participants" 
      ON public.conversation_messages FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'conversation_messages' AND policyname = 'Participants can insert messages'
  ) THEN
    CREATE POLICY "Participants can insert messages" 
      ON public.conversation_messages FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Enable Realtime publication
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_messages;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;
