-- AI Outreach & Automation Domain Schema
-- This schema defines the database structure for the AI-powered contractor outreach and acquisition system

CREATE SCHEMA IF NOT EXISTS ai_outreach;

-- Target audience definitions for outreach campaigns
CREATE TABLE ai_outreach.target_audiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  criteria JSONB NOT NULL, -- JSON defining the targeting criteria
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Outreach campaign definitions
CREATE TABLE ai_outreach.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL CHECK (status IN ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED')),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  target_audience_id UUID NOT NULL REFERENCES ai_outreach.target_audiences(id),
  message_template_id UUID, -- Reference to message template
  goals JSONB, -- Campaign goals (e.g., number of contractors to recruit, conversion rate targets)
  budget DECIMAL(12, 2), -- Optional budget for paid campaigns
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Message templates for outreach communications
CREATE TABLE ai_outreach.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('EMAIL', 'SMS', 'PUSH', 'IN_APP')),
  subject VARCHAR(255), -- For email templates
  content TEXT NOT NULL, -- Template with placeholders
  variables JSONB, -- Available variable definitions
  personalization_config JSONB, -- Configuration for AI personalization
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Message template versions for tracking changes
CREATE TABLE ai_outreach.message_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES ai_outreach.message_templates(id),
  version_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  subject VARCHAR(255),
  variables JSONB,
  personalization_config JSONB,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(template_id, version_number)
);

-- Potential contractor targets identified by the AI system
CREATE TABLE ai_outreach.contractor_prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id VARCHAR(255), -- ID from external system if applicable
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  company_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  specialties TEXT[],
  location_data JSONB, -- Geographic information
  source VARCHAR(100) NOT NULL, -- Where the prospect data was obtained
  source_url TEXT, -- URL of source if applicable
  discovery_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  enrichment_data JSONB, -- Additional data from enrichment processes
  quality_score DECIMAL(5, 2), -- AI-calculated quality score
  status VARCHAR(50) NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'VERIFIED', 'CONTACTED', 'RESPONDED', 'CONVERTED', 'REJECTED', 'INVALID')),
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Outreach messages sent to prospects
CREATE TABLE ai_outreach.outreach_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES ai_outreach.campaigns(id),
  prospect_id UUID NOT NULL REFERENCES ai_outreach.contractor_prospects(id),
  template_id UUID NOT NULL REFERENCES ai_outreach.message_templates(id),
  template_version_id UUID REFERENCES ai_outreach.message_template_versions(id),
  channel VARCHAR(50) NOT NULL CHECK (channel IN ('EMAIL', 'SMS', 'PUSH', 'IN_APP')),
  personalized_content TEXT NOT NULL, -- Actual content sent after personalization
  subject VARCHAR(255), -- For email messages
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_time TIMESTAMP WITH TIME ZONE,
  delivery_status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'SENDING', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED')),
  opened_time TIMESTAMP WITH TIME ZONE, -- For trackable messages
  click_time TIMESTAMP WITH TIME ZONE, -- For messages with links
  response_time TIMESTAMP WITH TIME ZONE, -- When prospect responded if applicable
  metadata JSONB, -- Additional data about the message
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Responses from prospects
CREATE TABLE ai_outreach.prospect_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES ai_outreach.outreach_messages(id),
  prospect_id UUID NOT NULL REFERENCES ai_outreach.contractor_prospects(id),
  response_type VARCHAR(50) NOT NULL CHECK (response_type IN ('EMAIL_REPLY', 'FORM_SUBMISSION', 'CALL', 'SMS_REPLY', 'WEBSITE_VISIT')),
  content TEXT, -- Response content if applicable
  sentiment VARCHAR(20), -- AI-analyzed sentiment
  received_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  analyzed_time TIMESTAMP WITH TIME ZONE,
  analysis_results JSONB, -- AI analysis of the response
  handled_by UUID REFERENCES auth.users(id), -- If handled by a human
  resolution VARCHAR(50) CHECK (resolution IN ('PENDING', 'RESPONDED', 'ESCALATED', 'CLOSED', 'CONVERTED')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Prospect to user conversion tracking
CREATE TABLE ai_outreach.prospect_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID NOT NULL REFERENCES ai_outreach.contractor_prospects(id),
  user_id UUID NOT NULL REFERENCES auth.users(id), -- The created user account
  campaign_id UUID REFERENCES ai_outreach.campaigns(id),
  conversion_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  conversion_source VARCHAR(100) NOT NULL, -- How they converted
  attribution_data JSONB, -- Attribution information
  onboarding_status VARCHAR(50) NOT NULL DEFAULT 'STARTED' CHECK (onboarding_status IN ('STARTED', 'PROFILE_CREATED', 'VERIFICATION_STARTED', 'VERIFICATION_COMPLETED', 'FIRST_BID', 'FIRST_PROJECT')),
  lifetime_value DECIMAL(12, 2), -- Calculated LTV updated over time
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(prospect_id, user_id)
);

-- AI discovery tasks for finding new prospects
CREATE TABLE ai_outreach.discovery_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED')),
  source_type VARCHAR(100) NOT NULL, -- Type of source to scan
  source_parameters JSONB NOT NULL, -- Parameters for the discovery
  filter_criteria JSONB, -- Criteria for filtering results
  max_results INTEGER,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  start_time TIMESTAMP WITH TIME ZONE,
  completion_time TIMESTAMP WITH TIME ZONE,
  results_summary JSONB, -- Summary of discovery results
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Discovered prospect entries from discovery tasks
CREATE TABLE ai_outreach.discovery_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES ai_outreach.discovery_tasks(id),
  prospect_id UUID REFERENCES ai_outreach.contractor_prospects(id),
  raw_data JSONB NOT NULL, -- Original raw data discovered
  match_confidence DECIMAL(5, 2), -- Confidence score of the match
  processing_status VARCHAR(50) NOT NULL DEFAULT 'NEW' CHECK (processing_status IN ('NEW', 'PROCESSED', 'DUPLICATE', 'INVALID', 'MERGED')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AI-generated content for outreach
CREATE TABLE ai_outreach.ai_content_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type VARCHAR(100) NOT NULL, -- Type of content requested
  parameters JSONB NOT NULL, -- Parameters for generation
  prompt TEXT NOT NULL, -- The prompt sent to the AI
  raw_output TEXT, -- The raw output from the AI
  processed_output TEXT, -- The processed/cleaned output
  approved BOOLEAN,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  usage_location VARCHAR(255), -- Where this content was used
  usage_id UUID, -- Reference to entity where content was used
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Campaign performance metrics
CREATE TABLE ai_outreach.campaign_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES ai_outreach.campaigns(id),
  metric_date DATE NOT NULL,
  prospects_contacted INTEGER NOT NULL DEFAULT 0,
  messages_sent INTEGER NOT NULL DEFAULT 0,
  messages_delivered INTEGER NOT NULL DEFAULT 0,
  messages_opened INTEGER NOT NULL DEFAULT 0,
  link_clicks INTEGER NOT NULL DEFAULT 0,
  responses_received INTEGER NOT NULL DEFAULT 0,
  positive_responses INTEGER NOT NULL DEFAULT 0,
  negative_responses INTEGER NOT NULL DEFAULT 0,
  neutral_responses INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  cost DECIMAL(12, 2) DEFAULT 0, -- For paid campaigns
  additional_metrics JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, metric_date)
);

-- AI model configurations
CREATE TABLE ai_outreach.ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  provider VARCHAR(100) NOT NULL, -- AI provider (e.g., OpenAI, Anthropic, etc.)
  model_identifier VARCHAR(255) NOT NULL, -- Specific model ID
  version VARCHAR(100) NOT NULL,
  purpose VARCHAR(100) NOT NULL, -- What this model is used for
  configuration JSONB NOT NULL, -- Configuration parameters
  is_active BOOLEAN NOT NULL DEFAULT true,
  performance_metrics JSONB, -- Tracked performance metrics
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Learning data for AI improvement
CREATE TABLE ai_outreach.learning_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_type VARCHAR(100) NOT NULL, -- Type of learning data
  content JSONB NOT NULL, -- The learning data content
  labels JSONB, -- Any labels or annotations
  source VARCHAR(255) NOT NULL, -- Source of the data
  quality_score DECIMAL(5, 2), -- Quality assessment of the data
  used_count INTEGER NOT NULL DEFAULT 0, -- Number of times used for training
  is_validated BOOLEAN NOT NULL DEFAULT false,
  validated_by UUID REFERENCES auth.users(id),
  validated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Views for analytics and reporting

-- View for campaign performance overview
CREATE OR REPLACE VIEW ai_outreach.campaign_performance_view AS
SELECT 
  c.id AS campaign_id,
  c.name AS campaign_name,
  c.status,
  c.start_date,
  c.end_date,
  ta.name AS target_audience,
  COUNT(DISTINCT cp.id) AS total_prospects,
  COUNT(DISTINCT om.id) AS total_messages,
  COUNT(DISTINCT CASE WHEN om.delivery_status = 'DELIVERED' THEN om.id END) AS delivered_messages,
  COUNT(DISTINCT CASE WHEN om.opened_time IS NOT NULL THEN om.id END) AS opened_messages,
  COUNT(DISTINCT pr.id) AS total_responses,
  COUNT(DISTINCT pc.id) AS conversions,
  CASE 
    WHEN COUNT(DISTINCT om.id) > 0 THEN 
      ROUND((COUNT(DISTINCT CASE WHEN om.opened_time IS NOT NULL THEN om.id END)::DECIMAL / COUNT(DISTINCT om.id)) * 100, 2)
    ELSE 0
  END AS open_rate,
  CASE 
    WHEN COUNT(DISTINCT om.id) > 0 THEN 
      ROUND((COUNT(DISTINCT pr.id)::DECIMAL / COUNT(DISTINCT om.id)) * 100, 2)
    ELSE 0
  END AS response_rate,
  CASE 
    WHEN COUNT(DISTINCT cp.id) > 0 THEN 
      ROUND((COUNT(DISTINCT pc.id)::DECIMAL / COUNT(DISTINCT cp.id)) * 100, 2)
    ELSE 0
  END AS conversion_rate
FROM 
  ai_outreach.campaigns c
LEFT JOIN 
  ai_outreach.target_audiences ta ON c.target_audience_id = ta.id
LEFT JOIN 
  ai_outreach.outreach_messages om ON c.id = om.campaign_id
LEFT JOIN 
  ai_outreach.contractor_prospects cp ON om.prospect_id = cp.id
LEFT JOIN 
  ai_outreach.prospect_responses pr ON om.id = pr.message_id
LEFT JOIN 
  ai_outreach.prospect_conversions pc ON cp.id = pc.prospect_id AND pc.campaign_id = c.id
GROUP BY 
  c.id, c.name, c.status, c.start_date, c.end_date, ta.name;

-- View for message template performance
CREATE OR REPLACE VIEW ai_outreach.template_performance_view AS
SELECT 
  mt.id AS template_id,
  mt.name AS template_name,
  mt.content_type,
  COUNT(DISTINCT om.id) AS total_messages,
  COUNT(DISTINCT CASE WHEN om.delivery_status = 'DELIVERED' THEN om.id END) AS delivered_messages,
  COUNT(DISTINCT CASE WHEN om.opened_time IS NOT NULL THEN om.id END) AS opened_messages,
  COUNT(DISTINCT CASE WHEN om.click_time IS NOT NULL THEN om.id END) AS clicked_messages,
  COUNT(DISTINCT pr.id) AS responses,
  COUNT(DISTINCT pc.id) AS conversions,
  CASE 
    WHEN COUNT(DISTINCT om.id) > 0 THEN 
      ROUND((COUNT(DISTINCT CASE WHEN om.opened_time IS NOT NULL THEN om.id END)::DECIMAL / COUNT(DISTINCT om.id)) * 100, 2)
    ELSE 0
  END AS open_rate,
  CASE 
    WHEN COUNT(DISTINCT CASE WHEN om.opened_time IS NOT NULL THEN om.id END) > 0 THEN 
      ROUND((COUNT(DISTINCT CASE WHEN om.click_time IS NOT NULL THEN om.id END)::DECIMAL / 
             COUNT(DISTINCT CASE WHEN om.opened_time IS NOT NULL THEN om.id END)) * 100, 2)
    ELSE 0
  END AS click_through_rate,
  CASE 
    WHEN COUNT(DISTINCT om.id) > 0 THEN 
      ROUND((COUNT(DISTINCT pc.id)::DECIMAL / COUNT(DISTINCT om.id)) * 100, 2)
    ELSE 0
  END AS conversion_rate
FROM 
  ai_outreach.message_templates mt
LEFT JOIN 
  ai_outreach.outreach_messages om ON mt.id = om.template_id
LEFT JOIN 
  ai_outreach.prospect_responses pr ON om.id = pr.message_id
LEFT JOIN 
  ai_outreach.prospect_conversions pc ON pr.prospect_id = pc.prospect_id
GROUP BY 
  mt.id, mt.name, mt.content_type;

-- Create indexes for performance
CREATE INDEX idx_outreach_messages_campaign_id ON ai_outreach.outreach_messages(campaign_id);
CREATE INDEX idx_outreach_messages_prospect_id ON ai_outreach.outreach_messages(prospect_id);
CREATE INDEX idx_outreach_messages_template_id ON ai_outreach.outreach_messages(template_id);
CREATE INDEX idx_prospect_responses_message_id ON ai_outreach.prospect_responses(message_id);
CREATE INDEX idx_prospect_responses_prospect_id ON ai_outreach.prospect_responses(prospect_id);
CREATE INDEX idx_prospect_conversions_prospect_id ON ai_outreach.prospect_conversions(prospect_id);
CREATE INDEX idx_prospect_conversions_campaign_id ON ai_outreach.prospect_conversions(campaign_id);
CREATE INDEX idx_discovery_results_task_id ON ai_outreach.discovery_results(task_id);
CREATE INDEX idx_campaign_metrics_campaign_id ON ai_outreach.campaign_metrics(campaign_id);
CREATE INDEX idx_contractor_prospects_status ON ai_outreach.contractor_prospects(status);
CREATE INDEX idx_contractor_prospects_specialties ON ai_outreach.contractor_prospects USING GIN(specialties);
CREATE INDEX idx_contractor_prospects_tags ON ai_outreach.contractor_prospects USING GIN(tags);

-- Row-level security policies

-- Target audiences
ALTER TABLE ai_outreach.target_audiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY target_audiences_all_access ON ai_outreach.target_audiences
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM auth.users WHERE auth.users.role IN ('ADMIN', 'MARKETING_MANAGER'))
  );

-- Campaigns
ALTER TABLE ai_outreach.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY campaigns_all_access ON ai_outreach.campaigns
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM auth.users WHERE auth.users.role IN ('ADMIN', 'MARKETING_MANAGER'))
  );

CREATE POLICY campaigns_read_access ON ai_outreach.campaigns
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM auth.users WHERE auth.users.role IN ('MARKETING_ANALYST', 'MARKETING_USER'))
  );

-- Message templates
ALTER TABLE ai_outreach.message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY message_templates_all_access ON ai_outreach.message_templates
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM auth.users WHERE auth.users.role IN ('ADMIN', 'MARKETING_MANAGER', 'CONTENT_MANAGER'))
  );

CREATE POLICY message_templates_read_access ON ai_outreach.message_templates
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM auth.users WHERE auth.users.role IN ('MARKETING_ANALYST', 'MARKETING_USER'))
  );

-- Contractor prospects
ALTER TABLE ai_outreach.contractor_prospects ENABLE ROW LEVEL SECURITY;

CREATE POLICY contractor_prospects_all_access ON ai_outreach.contractor_prospects
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM auth.users WHERE auth.users.role IN ('ADMIN', 'MARKETING_MANAGER', 'SALES_MANAGER'))
  );

CREATE POLICY contractor_prospects_read_update ON ai_outreach.contractor_prospects
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM auth.users WHERE auth.users.role IN ('MARKETING_ANALYST', 'MARKETING_USER', 'SALES_USER'))
  );

-- Repeat similar policies for other tables as needed

-- Functions for AI operations

-- Function to generate personalized message content
CREATE OR REPLACE FUNCTION ai_outreach.generate_personalized_message(
  template_id UUID,
  prospect_id UUID,
  additional_parameters JSONB DEFAULT '{}'::JSONB
) RETURNS TEXT AS $$
DECLARE
  template_content TEXT;
  template_variables JSONB;
  prospect_data JSONB;
  personalization_config JSONB;
  personalized_content TEXT;
BEGIN
  -- Get template content and variables
  SELECT 
    content, 
    variables,
    personalization_config
  INTO 
    template_content, 
    template_variables,
    personalization_config
  FROM 
    ai_outreach.message_templates
  WHERE 
    id = template_id;
    
  -- Get prospect data
  SELECT 
    jsonb_build_object(
      'first_name', first_name,
      'last_name', last_name,
      'company_name', company_name,
      'email', email,
      'specialties', specialties,
      'location', location_data
    )
  INTO 
    prospect_data
  FROM 
    ai_outreach.contractor_prospects
  WHERE 
    id = prospect_id;
    
  -- For now, just do basic variable substitution
  -- In a real implementation, this would call an AI service for advanced personalization
  personalized_content := template_content;
  
  -- Replace basic variables
  IF prospect_data->>'first_name' IS NOT NULL THEN
    personalized_content := REPLACE(personalized_content, '{{first_name}}', prospect_data->>'first_name');
  END IF;
  
  IF prospect_data->>'company_name' IS NOT NULL THEN
    personalized_content := REPLACE(personalized_content, '{{company_name}}', prospect_data->>'company_name');
  END IF;
  
  -- Additional sophisticated personalization would happen here
  
  RETURN personalized_content;
END;
$$ LANGUAGE plpgsql;

-- Function to score prospect quality
CREATE OR REPLACE FUNCTION ai_outreach.score_prospect_quality(
  prospect_id UUID
) RETURNS DECIMAL AS $$
DECLARE
  score DECIMAL(5,2);
  prospect_record ai_outreach.contractor_prospects%ROWTYPE;
BEGIN
  -- Get prospect data
  SELECT * INTO prospect_record
  FROM ai_outreach.contractor_prospects
  WHERE id = prospect_id;
  
  -- Initialize base score
  score := 50.0; -- Start with neutral score
  
  -- Basic scoring logic
  -- In a real implementation, this would use ML models and more sophisticated logic
  
  -- Add points for completeness of data
  IF prospect_record.first_name IS NOT NULL AND prospect_record.first_name != '' THEN
    score := score + 5;
  END IF;
  
  IF prospect_record.last_name IS NOT NULL AND prospect_record.last_name != '' THEN
    score := score + 5;
  END IF;
  
  IF prospect_record.email IS NOT NULL AND prospect_record.email != '' THEN
    score := score + 10;
  END IF;
  
  IF prospect_record.phone IS NOT NULL AND prospect_record.phone != '' THEN
    score := score + 7;
  END IF;
  
  IF prospect_record.company_name IS NOT NULL AND prospect_record.company_name != '' THEN
    score := score + 8;
  END IF;
  
  -- Add points for specialties
  IF array_length(prospect_record.specialties, 1) > 0 THEN
    score := score + (array_length(prospect_record.specialties, 1) * 3);
  END IF;
  
  -- Cap the score at 100
  IF score > 100 THEN
    score := 100;
  END IF;
  
  RETURN score;
END;
$$ LANGUAGE plpgsql;

-- Function to analyze response sentiment
CREATE OR REPLACE FUNCTION ai_outreach.analyze_response_sentiment(
  response_id UUID
) RETURNS VARCHAR AS $$
DECLARE
  response_content TEXT;
  sentiment VARCHAR(20);
BEGIN
  -- Get response content
  SELECT content INTO response_content
  FROM ai_outreach.prospect_responses
  WHERE id = response_id;
  
  -- Simple sentiment analysis logic for demonstration purposes
  -- In a real implementation, this would call an NLP service
  IF response_content IS NULL OR response_content = '' THEN
    sentiment := 'NEUTRAL';
  ELSIF response_content ~* 'yes|interested|great|good|would like|want|ready|sign up|sign me up|interested' THEN
    sentiment := 'POSITIVE';
  ELSIF response_content ~* 'no|not interested|busy|waste|spam|unsubscribe|stop|remove|never' THEN
    sentiment := 'NEGATIVE';
  ELSE
    sentiment := 'NEUTRAL';
  END IF;
  
  -- Update the sentiment in the response record
  UPDATE ai_outreach.prospect_responses
  SET 
    sentiment = sentiment,
    analyzed_time = NOW(),
    analysis_results = jsonb_build_object('sentiment', sentiment)
  WHERE id = response_id;
  
  RETURN sentiment;
END;
$$ LANGUAGE plpgsql;

-- Triggers

-- Trigger to update prospect quality score when enrichment data changes
CREATE OR REPLACE FUNCTION ai_outreach.update_prospect_quality_score() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.quality_score := ai_outreach.score_prospect_quality(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_prospect_score
BEFORE INSERT OR UPDATE OF enrichment_data ON ai_outreach.contractor_prospects
FOR EACH ROW
EXECUTE FUNCTION ai_outreach.update_prospect_quality_score();

-- Trigger to update campaign metrics when a message status changes
CREATE OR REPLACE FUNCTION ai_outreach.update_campaign_metrics() 
RETURNS TRIGGER AS $$
DECLARE
  campaign_id UUID;
  metric_date DATE;
BEGIN
  -- Get the campaign ID
  SELECT om.campaign_id INTO campaign_id
  FROM ai_outreach.outreach_messages om
  WHERE om.id = NEW.id;
  
  -- Set the metric date to the current date
  metric_date := CURRENT_DATE;
  
  -- Update or insert campaign metrics
  INSERT INTO ai_outreach.campaign_metrics (
    campaign_id, 
    metric_date,
    messages_sent,
    messages_delivered,
    messages_opened
  )
  VALUES (
    campaign_id,
    metric_date,
    CASE WHEN NEW.delivery_status IN ('SENT', 'DELIVERED') THEN 1 ELSE 0 END,
    CASE WHEN NEW.delivery_status = 'DELIVERED' THEN 1 ELSE 0 END,
    CASE WHEN NEW.opened_time IS NOT NULL THEN 1 ELSE 0 END
  )
  ON CONFLICT (campaign_id, metric_date)
  DO UPDATE SET
    messages_sent = ai_outreach.campaign_metrics.messages_sent + 
                   CASE WHEN NEW.delivery_status IN ('SENT', 'DELIVERED') AND OLD.delivery_status NOT IN ('SENT', 'DELIVERED') THEN 1
                        WHEN OLD.delivery_status IN ('SENT', 'DELIVERED') AND NEW.delivery_status NOT IN ('SENT', 'DELIVERED') THEN -1
                        ELSE 0 END,
    messages_delivered = ai_outreach.campaign_metrics.messages_delivered + 
                        CASE WHEN NEW.delivery_status = 'DELIVERED' AND OLD.delivery_status != 'DELIVERED' THEN 1
                             WHEN OLD.delivery_status = 'DELIVERED' AND NEW.delivery_status != 'DELIVERED' THEN -1
                             ELSE 0 END,
    messages_opened = ai_outreach.campaign_metrics.messages_opened + 
                     CASE WHEN NEW.opened_time IS NOT NULL AND OLD.opened_time IS NULL THEN 1
                          WHEN OLD.opened_time IS NOT NULL AND NEW.opened_time IS NULL THEN -1
                          ELSE 0 END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_campaign_metrics_trigger
AFTER UPDATE OF delivery_status, opened_time ON ai_outreach.outreach_messages
FOR EACH ROW
EXECUTE FUNCTION ai_outreach.update_campaign_metrics();

-- Comments

COMMENT ON TABLE ai_outreach.target_audiences IS 'Defines target audiences for contractor outreach campaigns';
COMMENT ON TABLE ai_outreach.campaigns IS 'Outreach campaign definitions for contractor acquisition';
COMMENT ON TABLE ai_outreach.message_templates IS 'Templates for outreach communications with variable placeholders';
COMMENT ON TABLE ai_outreach.contractor_prospects IS 'Potential contractors identified by AI for outreach';
COMMENT ON TABLE ai_outreach.outreach_messages IS 'Individual messages sent to contractor prospects';
COMMENT ON TABLE ai_outreach.prospect_responses IS 'Responses received from prospects through various channels';
COMMENT ON TABLE ai_outreach.prospect_conversions IS 'Tracking of prospects that convert to registered users';
COMMENT ON TABLE ai_outreach.discovery_tasks IS 'AI tasks for discovering new contractor prospects';
COMMENT ON TABLE ai_outreach.ai_content_generations IS 'AI-generated content for outreach messages';
COMMENT ON TABLE ai_outreach.campaign_metrics IS 'Performance metrics for outreach campaigns';
COMMENT ON TABLE ai_outreach.ai_models IS 'Configurations for AI models used in the outreach system';
COMMENT ON TABLE ai_outreach.learning_data IS 'Training data for improving AI outreach capabilities';
