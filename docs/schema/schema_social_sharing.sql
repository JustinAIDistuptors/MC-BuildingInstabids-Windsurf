-- InstaBids Social Sharing & Referrals Domain Schema
-- This schema defines the database structure for the social sharing and referral system
-- within the InstaBids platform, enabling users to share projects, refer other users,
-- and earn rewards through social interactions.

-- -----------------------------------------------------
-- Table: social_share_settings
-- Description: Platform-level configuration for social sharing features
-- -----------------------------------------------------
CREATE TABLE social_share_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name VARCHAR(100) NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  share_title_template TEXT NOT NULL,
  share_description_template TEXT NOT NULL,
  share_image_url TEXT,
  platforms_config JSONB NOT NULL, -- Configuration for different social platforms (Facebook, Twitter, etc.)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

COMMENT ON TABLE social_share_settings IS 'Configuration settings for social sharing features';

-- -----------------------------------------------------
-- Table: referral_programs
-- Description: Configuration for various referral programs
-- -----------------------------------------------------
CREATE TABLE referral_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  max_referrals_per_user INTEGER,
  referrer_reward_type VARCHAR(50) NOT NULL, -- 'credit', 'percentage_discount', 'fixed_discount', 'free_service'
  referrer_reward_amount DECIMAL(10,2),
  referrer_reward_details JSONB,
  referee_reward_type VARCHAR(50), -- 'credit', 'percentage_discount', 'fixed_discount', 'free_service'
  referee_reward_amount DECIMAL(10,2),
  referee_reward_details JSONB,
  expiry_days INTEGER, -- How many days referral links are valid
  terms_and_conditions TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

COMMENT ON TABLE referral_programs IS 'Configuration for active referral programs with reward structures';

-- -----------------------------------------------------
-- Table: referral_codes
-- Description: Unique referral codes generated for users
-- -----------------------------------------------------
CREATE TABLE referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES referral_programs(id),
  code VARCHAR(20) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  usage_count INTEGER NOT NULL DEFAULT 0,
  max_uses INTEGER, -- NULL means unlimited
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT unique_user_program UNIQUE (user_id, program_id)
);

CREATE INDEX idx_referral_codes_code ON referral_codes(code);
CREATE INDEX idx_referral_codes_user ON referral_codes(user_id);

COMMENT ON TABLE referral_codes IS 'Unique referral codes generated for users to share';

-- -----------------------------------------------------
-- Table: referrals
-- Description: Tracks successful referrals between users
-- -----------------------------------------------------
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES referral_programs(id),
  referrer_id UUID NOT NULL REFERENCES users(id),
  referee_id UUID NOT NULL REFERENCES users(id),
  referral_code_id UUID NOT NULL REFERENCES referral_codes(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'rewarded', 'cancelled'
  referrer_reward_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'cancelled'
  referee_reward_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'cancelled'
  qualifying_event VARCHAR(50), -- e.g., 'account_creation', 'first_project', 'first_payment'
  qualifying_event_date TIMESTAMP WITH TIME ZONE,
  referrer_reward_amount DECIMAL(10,2),
  referee_reward_amount DECIMAL(10,2),
  referrer_reward_details JSONB,
  referee_reward_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT referrer_not_referee CHECK (referrer_id != referee_id)
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_referee ON referrals(referee_id);
CREATE INDEX idx_referrals_program ON referrals(program_id);
CREATE INDEX idx_referrals_status ON referrals(status);

COMMENT ON TABLE referrals IS 'Records of successful referrals between users';

-- -----------------------------------------------------
-- Table: social_shares
-- Description: Tracks social sharing activities
-- -----------------------------------------------------
CREATE TABLE social_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL, -- 'project', 'profile', 'bid', 'dream_project', etc.
  entity_id UUID NOT NULL, -- ID of the shared entity
  platform VARCHAR(50) NOT NULL, -- 'facebook', 'twitter', 'linkedin', 'email', etc.
  share_url TEXT NOT NULL, -- The generated URL for sharing
  custom_message TEXT, -- Optional user-added message
  share_data JSONB, -- Platform-specific sharing data
  utm_parameters JSONB, -- Tracking parameters
  click_count INTEGER NOT NULL DEFAULT 0,
  conversion_count INTEGER NOT NULL DEFAULT 0, -- How many clicks led to signups/actions
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_social_shares_user ON social_shares(user_id);
CREATE INDEX idx_social_shares_entity ON social_shares(entity_type, entity_id);
CREATE INDEX idx_social_shares_platform ON social_shares(platform);

COMMENT ON TABLE social_shares IS 'Records of content shared to social platforms by users';

-- -----------------------------------------------------
-- Table: share_clicks
-- Description: Tracks clicks on shared content
-- -----------------------------------------------------
CREATE TABLE share_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id UUID NOT NULL REFERENCES social_shares(id) ON DELETE CASCADE,
  ip_address VARCHAR(50),
  user_agent TEXT,
  referrer_url TEXT,
  is_unique BOOLEAN NOT NULL, -- Determined based on IP/user-agent/cookies
  converted BOOLEAN NOT NULL DEFAULT false, -- Whether this click led to a conversion
  conversion_type VARCHAR(50), -- 'signup', 'project_view', 'bid', etc.
  conversion_entity_id UUID, -- ID of the entity resulting from conversion
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  utm_term VARCHAR(100),
  utm_content VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_share_clicks_share ON share_clicks(share_id);
CREATE INDEX idx_share_clicks_converted ON share_clicks(converted);

COMMENT ON TABLE share_clicks IS 'Detailed tracking of clicks on shared content';

-- -----------------------------------------------------
-- Table: project_sharing_options
-- Description: Configuration for how projects can be shared
-- -----------------------------------------------------
CREATE TABLE project_sharing_options (
  project_id UUID PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  sharing_enabled BOOLEAN NOT NULL DEFAULT true,
  public_view_enabled BOOLEAN NOT NULL DEFAULT false,
  social_platforms JSONB NOT NULL DEFAULT '{"facebook": true, "twitter": true, "linkedin": true, "email": true}',
  custom_title TEXT,
  custom_description TEXT,
  custom_image_url TEXT,
  show_budget BOOLEAN NOT NULL DEFAULT false,
  show_timeline BOOLEAN NOT NULL DEFAULT true,
  show_contractor_info BOOLEAN NOT NULL DEFAULT false,
  require_approval BOOLEAN NOT NULL DEFAULT false,
  last_updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

COMMENT ON TABLE project_sharing_options IS 'Per-project configuration for sharing';

-- -----------------------------------------------------
-- Table: referral_rewards
-- Description: Tracks rewards issued through the referral program
-- -----------------------------------------------------
CREATE TABLE referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID NOT NULL REFERENCES referrals(id),
  user_id UUID NOT NULL REFERENCES users(id), -- Either referrer or referee
  user_role VARCHAR(10) NOT NULL, -- 'referrer' or 'referee'
  reward_type VARCHAR(50) NOT NULL, -- 'credit', 'discount', 'free_service'
  amount DECIMAL(10,2),
  status VARCHAR(20) NOT NULL DEFAULT 'issued', -- 'issued', 'redeemed', 'expired', 'cancelled'
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  redeemed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  redemption_context JSONB, -- Information about how/where the reward was used
  transaction_id UUID, -- Reference to payment transaction if applicable
  notes TEXT
);

CREATE INDEX idx_referral_rewards_referral ON referral_rewards(referral_id);
CREATE INDEX idx_referral_rewards_user ON referral_rewards(user_id);
CREATE INDEX idx_referral_rewards_status ON referral_rewards(status);

COMMENT ON TABLE referral_rewards IS 'Detailed record of referral rewards issued to users';

-- -----------------------------------------------------
-- Table: testimonials
-- Description: User testimonials that can be displayed and shared
-- -----------------------------------------------------
CREATE TABLE testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  project_id UUID REFERENCES projects(id),
  content TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_public BOOLEAN NOT NULL DEFAULT true,
  moderation_notes TEXT,
  moderated_by UUID REFERENCES users(id),
  moderated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_testimonials_user ON testimonials(user_id);
CREATE INDEX idx_testimonials_project ON testimonials(project_id);
CREATE INDEX idx_testimonials_status ON testimonials(status);
CREATE INDEX idx_testimonials_featured ON testimonials(is_featured) WHERE is_featured = true;

COMMENT ON TABLE testimonials IS 'User testimonials that can be shared on the platform and social media';

-- -----------------------------------------------------
-- Table: social_integration_credentials
-- Description: Stores encrypted OAuth credentials for social media platform integrations
-- -----------------------------------------------------
CREATE TABLE social_integration_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL, -- 'facebook', 'twitter', 'linkedin', etc.
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  scope TEXT,
  platform_user_id VARCHAR(100),
  platform_username VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_user_platform UNIQUE (user_id, platform)
);

CREATE INDEX idx_social_credentials_user ON social_integration_credentials(user_id);
CREATE INDEX idx_social_credentials_platform ON social_integration_credentials(platform);

COMMENT ON TABLE social_integration_credentials IS 'Encrypted social media authorization credentials';

-- -----------------------------------------------------
-- Table: referral_leaderboard
-- Description: Aggregates and ranks referral performance
-- Updated via trigger or scheduled job
-- -----------------------------------------------------
CREATE TABLE referral_leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_referrals INTEGER NOT NULL DEFAULT 0,
  successful_referrals INTEGER NOT NULL DEFAULT 0,
  total_rewards_earned DECIMAL(10,2) NOT NULL DEFAULT 0,
  rank INTEGER,
  month INTEGER, -- 1-12
  year INTEGER,
  last_referral_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_user_month_year UNIQUE (user_id, month, year)
);

CREATE INDEX idx_referral_leaderboard_rank ON referral_leaderboard(year, month, rank);
CREATE INDEX idx_referral_leaderboard_user ON referral_leaderboard(user_id);

COMMENT ON TABLE referral_leaderboard IS 'Aggregated referral performance metrics for leaderboards';

-- -----------------------------------------------------
-- Views
-- -----------------------------------------------------

-- View for referral program performance
CREATE OR REPLACE VIEW referral_program_performance AS
SELECT
  rp.id AS program_id,
  rp.name AS program_name,
  COUNT(r.id) AS total_referrals,
  SUM(CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END) AS completed_referrals,
  SUM(CASE WHEN r.status = 'rewarded' THEN 1 ELSE 0 END) AS rewarded_referrals,
  COUNT(DISTINCT r.referrer_id) AS unique_referrers,
  COUNT(DISTINCT r.referee_id) AS unique_referees,
  SUM(r.referrer_reward_amount) AS total_referrer_rewards,
  SUM(r.referee_reward_amount) AS total_referee_rewards,
  SUM(r.referrer_reward_amount) + SUM(r.referee_reward_amount) AS total_reward_cost,
  COALESCE(AVG(EXTRACT(EPOCH FROM (r.qualifying_event_date - r.created_at))/86400), 0) AS avg_days_to_qualification
FROM referral_programs rp
LEFT JOIN referrals r ON rp.id = r.program_id
GROUP BY rp.id, rp.name;

-- View for user social activity
CREATE OR REPLACE VIEW user_social_activity AS
SELECT
  u.id AS user_id,
  u.email,
  u.first_name,
  u.last_name,
  COUNT(ss.id) AS total_shares,
  COUNT(DISTINCT ss.platform) AS platforms_used,
  SUM(ss.click_count) AS total_clicks,
  SUM(ss.conversion_count) AS total_conversions,
  COALESCE(SUM(ss.conversion_count)::DECIMAL / NULLIF(SUM(ss.click_count), 0), 0) AS conversion_rate,
  COUNT(r.id) AS referrals_made,
  SUM(CASE WHEN r.status = 'completed' OR r.status = 'rewarded' THEN 1 ELSE 0 END) AS successful_referrals,
  SUM(r.referrer_reward_amount) AS total_rewards_earned,
  MAX(ss.created_at) AS last_share_date,
  MAX(r.created_at) AS last_referral_date
FROM users u
LEFT JOIN social_shares ss ON u.id = ss.user_id
LEFT JOIN referrals r ON u.id = r.referrer_id
GROUP BY u.id, u.email, u.first_name, u.last_name;

-- -----------------------------------------------------
-- Functions and Triggers
-- -----------------------------------------------------

-- Function to generate a unique referral code
CREATE OR REPLACE FUNCTION generate_unique_referral_code()
RETURNS TRIGGER AS $$
DECLARE
  code_exists BOOLEAN;
  new_code VARCHAR(20);
BEGIN
  LOOP
    -- Generate a code using user initials plus random characters
    SELECT 
      UPPER(SUBSTRING(u.first_name, 1, 1) || 
            SUBSTRING(u.last_name, 1, 1)) || 
      UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6))
    INTO new_code
    FROM users u
    WHERE u.id = NEW.user_id;
    
    -- Check if code exists
    SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = new_code) INTO code_exists;
    
    -- If unique, use it and exit loop
    IF NOT code_exists THEN
      NEW.code := new_code;
      EXIT;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to generate unique referral codes
CREATE TRIGGER trg_generate_referral_code
BEFORE INSERT ON referral_codes
FOR EACH ROW
WHEN (NEW.code IS NULL)
EXECUTE FUNCTION generate_unique_referral_code();

-- Function to update share click counts
CREATE OR REPLACE FUNCTION update_share_click_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE social_shares
  SET click_count = click_count + 1,
      conversion_count = CASE WHEN NEW.converted THEN conversion_count + 1 ELSE conversion_count END
  WHERE id = NEW.share_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update click counts
CREATE TRIGGER trg_update_share_click_count
AFTER INSERT ON share_clicks
FOR EACH ROW
EXECUTE FUNCTION update_share_click_count();

-- Function to update referral usage count
CREATE OR REPLACE FUNCTION update_referral_code_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE referral_codes
  SET usage_count = usage_count + 1
  WHERE id = NEW.referral_code_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to increment referral code usage
CREATE TRIGGER trg_update_referral_code_usage
AFTER INSERT ON referrals
FOR EACH ROW
EXECUTE FUNCTION update_referral_code_usage();

-- Function to update leaderboard
CREATE OR REPLACE FUNCTION update_referral_leaderboard()
RETURNS TRIGGER AS $$
DECLARE
  curr_month INTEGER;
  curr_year INTEGER;
BEGIN
  SELECT EXTRACT(MONTH FROM CURRENT_DATE), EXTRACT(YEAR FROM CURRENT_DATE)
  INTO curr_month, curr_year;
  
  -- Update or insert leaderboard entry
  INSERT INTO referral_leaderboard (
    user_id, 
    total_referrals,
    successful_referrals,
    total_rewards_earned,
    month,
    year,
    last_referral_at,
    updated_at
  )
  SELECT 
    r.referrer_id,
    COUNT(r.id),
    SUM(CASE WHEN r.status IN ('completed', 'rewarded') THEN 1 ELSE 0 END),
    SUM(COALESCE(r.referrer_reward_amount, 0)),
    curr_month,
    curr_year,
    MAX(r.created_at),
    NOW()
  FROM referrals r
  WHERE r.referrer_id = NEW.referrer_id
  GROUP BY r.referrer_id
  ON CONFLICT (user_id, month, year) 
  DO UPDATE SET
    total_referrals = EXCLUDED.total_referrals,
    successful_referrals = EXCLUDED.successful_referrals,
    total_rewards_earned = EXCLUDED.total_rewards_earned,
    last_referral_at = EXCLUDED.last_referral_at,
    updated_at = NOW();
    
  -- Update ranks (simplified version - in production this would likely be a scheduled job)
  UPDATE referral_leaderboard rl
  SET rank = ranked.rank
  FROM (
    SELECT 
      id,
      RANK() OVER (PARTITION BY month, year ORDER BY total_rewards_earned DESC, successful_referrals DESC) as rank
    FROM referral_leaderboard
    WHERE month = curr_month AND year = curr_year
  ) ranked
  WHERE rl.id = ranked.id
  AND (rl.month = curr_month AND rl.year = curr_year);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update leaderboard
CREATE TRIGGER trg_update_referral_leaderboard
AFTER INSERT OR UPDATE ON referrals
FOR EACH ROW
EXECUTE FUNCTION update_referral_leaderboard();
