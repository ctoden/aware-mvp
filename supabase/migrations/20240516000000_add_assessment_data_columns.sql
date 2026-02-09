-- Add assessment data columns to user_assessments table
ALTER TABLE public.user_assessments
ADD COLUMN IF NOT EXISTS assessment_data JSONB,
ADD COLUMN IF NOT EXISTS additional_data JSONB;

-- Comment on columns
COMMENT ON COLUMN public.user_assessments.assessment_data IS 'Structured assessment data in JSONB format';
COMMENT ON COLUMN public.user_assessments.additional_data IS 'Additional assessment data (temporary - will be consolidated with assessment_data in future)';