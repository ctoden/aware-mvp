-- Create enum type for rating levels to ensure data consistency
CREATE TYPE rating_level AS ENUM ('Highest', 'Very High', 'High', 'Medium', 'Low', 'Very Low', 'Lowest');

-- Create the main user top qualities table
CREATE TABLE user_top_qualities (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(50) NOT NULL,
    level rating_level NOT NULL,
    description TEXT NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    color VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create RLS policies for user_top_qualities
ALTER TABLE user_top_qualities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own top qualities" ON user_top_qualities
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own top qualities" ON user_top_qualities
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own top qualities" ON user_top_qualities
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own top qualities" ON user_top_qualities
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_user_top_qualities_updated_at
    BEFORE UPDATE ON user_top_qualities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_user_top_qualities_user_id ON user_top_qualities(user_id);
CREATE INDEX idx_user_top_qualities_title ON user_top_qualities(title);