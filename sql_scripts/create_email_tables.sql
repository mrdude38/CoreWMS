-- Email notification preferences table
CREATE TABLE IF NOT EXISTS email_notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  entry_notifications BOOLEAN DEFAULT TRUE,
  load_order_notifications BOOLEAN DEFAULT TRUE,
  report_notifications BOOLEAN DEFAULT TRUE,
  weekly_summary BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_profile_id)
);

-- Email logs table for tracking sent emails
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
  error_message TEXT,
  metadata JSONB,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_template ON email_logs(template);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_notification_preferences_user_profile_id ON email_notification_preferences(user_profile_id);

-- Enable RLS
ALTER TABLE email_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_notification_preferences
-- Users can only view and update their own preferences
CREATE POLICY "Users can view own preferences"
  ON email_notification_preferences FOR SELECT
  USING (user_profile_id = auth.uid());

CREATE POLICY "Users can update own preferences"
  ON email_notification_preferences FOR UPDATE
  USING (user_profile_id = auth.uid());

CREATE POLICY "Users can insert own preferences"
  ON email_notification_preferences FOR INSERT
  WITH CHECK (user_profile_id = auth.uid());

-- Admins can view all preferences
CREATE POLICY "Admins can view all preferences"
  ON email_notification_preferences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for email_logs
-- Only admins and managers can view email logs
CREATE POLICY "Admins and managers can view email logs"
  ON email_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Only system can insert email logs (via service role)
CREATE POLICY "Service role can insert email logs"
  ON email_logs FOR INSERT
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_email_preferences_timestamp
  BEFORE UPDATE ON email_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_email_preferences_updated_at();

-- Create default preferences for existing users
INSERT INTO email_notification_preferences (user_profile_id)
SELECT id FROM user_profiles
WHERE id NOT IN (SELECT user_profile_id FROM email_notification_preferences)
ON CONFLICT (user_profile_id) DO NOTHING;

COMMENT ON TABLE email_notification_preferences IS 'User preferences for email notifications';
COMMENT ON TABLE email_logs IS 'Log of all emails sent by the system';
