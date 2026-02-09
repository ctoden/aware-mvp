-- Create table for user assessment summaries
CREATE TABLE user_assessments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users (id) NOT NULL,
  assessment_type text NOT NULL,
  name text NOT NULL,
  assessment_full_text text,
  assessment_summary text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);


-- Enable RLS on new tables
ALTER TABLE user_assessments ENABLE ROW LEVEL SECURITY;

-- Policies for user_assessment_summaries
CREATE POLICY "Allow select on own assessments" ON user_assessments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow insert for authenticated users" ON user_assessments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow update on own assessments" ON user_assessments
  FOR UPDATE USING (auth.uid() = user_id);