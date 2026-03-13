
-- Create signaling table for WebRTC SDP/ICE exchange
CREATE TABLE public.signaling (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id text NOT NULL,
  sender_id uuid NOT NULL,
  type text NOT NULL, -- 'offer', 'answer', 'ice-candidate'
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast room lookups
CREATE INDEX idx_signaling_room_id ON public.signaling(room_id);
CREATE INDEX idx_signaling_created_at ON public.signaling(created_at);

-- Enable RLS
ALTER TABLE public.signaling ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert signals
CREATE POLICY "Authenticated users can insert signals"
  ON public.signaling FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Authenticated users can read signals in their room
CREATE POLICY "Authenticated users can read signals"
  ON public.signaling FOR SELECT TO authenticated
  USING (true);

-- Allow cleanup of old signals
CREATE POLICY "Users can delete their own signals"
  ON public.signaling FOR DELETE TO authenticated
  USING (auth.uid() = sender_id);

-- Enable realtime for signaling
ALTER PUBLICATION supabase_realtime ADD TABLE public.signaling;
