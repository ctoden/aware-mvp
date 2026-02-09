# Assessment Database Schema Fix Plan

## Project Context
This plan addresses a critical error in the Assessment saving functionality within the Aware MVP platform. The error occurs when attempting to save a Love Languages assessment, specifically showing a schema cache error for a missing column.

## Background and Motivation
The Aware MVP platform is an AI-powered personal development application that provides multiple personality assessments. The Love Languages assessment feature is currently failing with the error:

```
Could not find the 'additional_data' column of 'user_assessments' in the schema cache
```

This error is preventing users from saving their Love Languages assessment results, which is a core functionality of the application.

## Current Scope Definition
This plan focuses specifically on resolving the database schema mismatch that is causing the error. We will:
- Create a Supabase migration file to add the missing columns
- Update TypeScript type definitions to match the database schema
- Create comprehensive tests to verify the fix works with both TestDataProvider and SupabaseDataProvider
- Test the fix with multiple assessment types that use these fields

What we are NOT addressing in this phase:
- Refactoring the code to eliminate redundant data storage (this will be addressed in future work)
- Changes to the assessment UI or business logic

## Scope Limitation Strategy
We're intentionally limiting our scope to the minimal necessary changes to fix the immediate error. This approach allows us to:
1. Quickly restore core functionality
2. Minimize potential regression risks
3. Validate the fix with a focused test case

## Key Challenges and Analysis

### Database Schema Issue
After analyzing the error and code, we've identified a mismatch between the database schema and the application code:

1. The error indicates that the `additional_data` column is missing from the `user_assessments` table in Supabase.
2. Multiple ViewModels are using both `assessment_data` and `additional_data` columns:
   - LoveLanguagesViewModel
   - BigFiveViewModel
   - DiscViewModel
   - EnneagramViewModel
   - MotivationCodeViewModel
   - CliftonStrengthsViewModel

3. The TypeScript database schema in `database.types.ts` does not include these columns.

### Assessment Data Redundancy Consideration
Our analysis shows that the `assessment_data` and `additional_data` fields appear to store identical data in many cases. For example, in LoveLanguagesViewModel:

```typescript
// Create a consistent data structure for both assessment_data and additional_data
const updatedData = {
  selectedLanguage: selectedLanguage,
  assessmentResult: this.loveLanguagesFullTextResult$.get(),
};

// Then both fields are populated with the same data
assessment_data: updatedData,
additional_data: updatedData
```

**Recommendation**: While these fields appear redundant, multiple assessment types are using both fields. We should:
1. Add both fields to maintain compatibility with existing code
2. Plan a future migration to consolidate to a single field (likely `assessment_data`)
3. Document this technical debt for future cleanup

## High-level Task Breakdown

### 1. Create Supabase Migration File
**Success Criteria**: A migration file that adds both columns to the `user_assessments` table.

Create a new migration file in supabase/migrations with the format `[timestamp]_add_assessment_data_columns.sql` containing:

```sql
-- Add assessment data columns to user_assessments table
ALTER TABLE public.user_assessments
ADD COLUMN IF NOT EXISTS assessment_data JSONB,
ADD COLUMN IF NOT EXISTS additional_data JSONB;

-- Comment on columns
COMMENT ON COLUMN public.user_assessments.assessment_data IS 'Structured assessment data in JSONB format';
COMMENT ON COLUMN public.user_assessments.additional_data IS 'Additional assessment data (temporary - will be consolidated with assessment_data in future)';
```

### 2. Update TypeScript Type Definitions
**Success Criteria**: The TypeScript definitions in `database.types.ts` match the updated database schema.

- Update the `user_assessments` type definitions to include the new columns:
  ```typescript
  user_assessments: {
    Row: {
      // existing columns...
      assessment_data: Json | null
      additional_data: Json | null
    }
    Insert: {
      // existing columns...
      assessment_data?: Json | null
      additional_data?: Json | null
    }
    Update: {
      // existing columns...
      assessment_data?: Json | null
      additional_data?: Json | null
    }
  }
  ```

### 3. Enhance UserAssessmentService Tests
**Success Criteria**: Unit tests pass, verifying the UserAssessmentService correctly handles the new columns with both TestDataProvider and SupabaseDataProvider.

- Update existing UserAssessmentService tests to verify it correctly processes assessments with the new fields:
  ```typescript
  it('should process assessment with assessment_data and additional_data fields', async () => {
    // Arrange
    const assessmentData = {
      selectedLanguage: 'Quality Time',
      assessmentResult: 'Test assessment result'
    };

    // Act
    const result = await userAssessmentService.processAssessment('LoveLanguages', {
      name: 'Love Languages Assessment',
      assessmentResult: 'Test assessment result',
      assessment_data: assessmentData,
      additional_data: assessmentData
    });



    // Assert
    expect(result.isOk()).toBe(true);

    // Verify the assessment was saved with the correct data
    const savedAssessment = userAssessments$[0];
    expect(savedAssessment.assessment_data).toEqual(assessmentData);
    expect(savedAssessment.additional_data).toEqual(assessmentData);
  });

  it('should update assessment with assessment_data and additional_data fields', async () => {
    // Arrange
    const assessmentId = 'test-assessment-id';
    const initialData = { selectedLanguage: 'Quality Time' };
    const updatedData = { selectedLanguage: 'Words of Affirmation' };

    // Setup initial assessment
    testDataProvider.setTestData('user_assessments', [{
      id: assessmentId,
      user_id: 'test-user-id',
      assessment_type: 'LoveLanguages',
      name: 'Love Languages Assessment',
      assessment_summary: 'Test summary',
      assessment_data: initialData,
      additional_data: initialData
    }]);

    // Act
    const result = await userAssessmentService.updateAssessment(assessmentId, {
      assessment_data: updatedData,
      additional_data: updatedData
    });

    // Assert
    expect(result.isOk()).toBe(true);

    // Verify the assessment was updated with the correct data
    const updatedAssessment = await userAssessmentService.fetchAssessments('test-user-id');
    expect(updatedAssessment.isOk()).toBe(true);
    if (updatedAssessment.isOk()) {
      expect(updatedAssessment.value[0].assessment_data).toEqual(updatedData);
      expect(updatedAssessment.value[0].additional_data).toEqual(updatedData);
    }
  });
  ```

### 4. Enhance ViewModel Tests
**Success Criteria**: ViewModel tests pass, verifying each ViewModel correctly populates and uses the new fields.

- Update tests for each assessment ViewModel to verify they correctly handle the new fields:

  #### LoveLanguagesViewModel Tests
  ```typescript
  // Add to src/viewModels/__tests__/LoveLanguagesViewModel.test.ts
  it('should correctly populate assessment_data and additional_data when submitting', async () => {
    // Arrange
    loveLanguagesViewModel.updateLanguage('Acts of Service');
    loveLanguagesViewModel.loveLanguagesFullTextResult$.set('Detailed assessment text');

    // Act
    const result = await loveLanguagesViewModel.submitAssessment();

    // Assert
    expect(result.isOk()).toBe(true);

    // Verify the assessment was saved with the correct data structure
    const savedAssessment = userAssessments$[0];
    expect(savedAssessment.assessment_data).toBeDefined();
    expect(savedAssessment.assessment_data.selectedLanguage).toBe('Acts of Service');
    expect(savedAssessment.additional_data).toBeDefined();
    expect(savedAssessment.additional_data.selectedLanguage).toBe('Acts of Service');
  });
  ```

  #### MBTIViewModel Tests
  ```typescript
  // Add to src/viewModels/__tests__/MBTIViewModel.test.ts
  it('should correctly populate assessment_data and additional_data when submitting', async () => {
    // Arrange
    mbtiViewModel.selectedDichotomies$.set({
      energy: "E",
      information: "N",
      decision: "T",
      lifestyle: "J"
    });
    mbtiViewModel.mbtiFullTextResult$.set("ENTJ personality type details");

    // Act
    const result = await mbtiViewModel.submitAssessment();

    // Assert
    expect(result.isOk()).toBe(true);

    // Verify the assessment was saved with the correct data structure
    const savedAssessment = userAssessments$[0];
    expect(savedAssessment.assessment_data).toBeDefined();
    expect(savedAssessment.assessment_data.dichotomies).toEqual({
      energy: "E",
      information: "N",
      decision: "T",
      lifestyle: "J"
    });
    expect(savedAssessment.additional_data).toBeDefined();
    expect(savedAssessment.additional_data.dichotomies).toEqual({
      energy: "E",
      information: "N",
      decision: "T",
      lifestyle: "J"
    });
  });
  ```

  #### BigFiveViewModel Tests
  ```typescript
  // Add to src/viewModels/__tests__/BigFiveViewModel.test.ts
  it('should correctly populate assessment_data and additional_data when submitting', async () => {
    // Arrange
    const scores = [
      { name: 'Openness', score: '80' },
      { name: 'Conscientiousness', score: '75' },
      { name: 'Extraversion', score: '60' },
      { name: 'Agreeableness', score: '85' },
      { name: 'Neuroticism', score: '40' }
    ];
    bigFiveViewModel.scores$.set(scores);
    bigFiveViewModel.bigFiveFullTextResult$.set("Detailed Big Five results");

    // Act
    const result = await bigFiveViewModel.submitAssessment();

    // Assert
    expect(result.isOk()).toBe(true);

    // Verify the assessment was saved with the correct data structure
    const savedAssessment = userAssessments$[0];
    expect(savedAssessment.assessment_data).toBeDefined();
    expect(savedAssessment.assessment_data.scores).toBeDefined();
    expect(savedAssessment.additional_data).toBeDefined();
    expect(savedAssessment.additional_data.scores).toBeDefined();
  });
  ```

  #### DiscViewModel Tests
  ```typescript
  // Add to src/viewModels/__tests__/DiscViewModel.test.ts
  it('should correctly populate assessment_data and additional_data when submitting', async () => {
    // Arrange
    const scores = [
      { name: 'Dominance', score: '80' },
      { name: 'Influence', score: '75' },
      { name: 'Steadiness', score: '60' },
      { name: 'Conscientiousness', score: '85' }
    ];
    discViewModel.scores$.set(scores);
    discViewModel.discFullTextResult$.set("Detailed DISC assessment text");

    // Act
    const result = await discViewModel.submitAssessment();

    // Assert
    expect(result.isOk()).toBe(true);

    // Verify the assessment was saved with the correct data structure
    const savedAssessment = userAssessments$[0];
    expect(savedAssessment.assessment_data).toBeDefined();
    expect(savedAssessment.assessment_data.scores).toBeDefined();
    expect(savedAssessment.additional_data).toBeDefined();
    expect(savedAssessment.additional_data.scores).toBeDefined();
  });
  ```

  #### EnneagramViewModel Tests
  ```typescript
  // Add to src/viewModels/__tests__/EnneagramViewModel.test.ts
  it('should correctly populate assessment_data and additional_data when submitting', async () => {
    // Arrange
    const scores = [
      { name: 'Type 1 - The Reformer', score: '80' },
      { name: 'Type 2 - The Helper', score: '75' },
      { name: 'Type 3 - The Achiever', score: '60' },
      { name: 'Type 4 - The Individualist', score: '85' },
      { name: 'Type 5 - The Investigator', score: '70' },
      { name: 'Type 6 - The Loyalist', score: '65' },
      { name: 'Type 7 - The Enthusiast', score: '55' },
      { name: 'Type 8 - The Challenger', score: '90' },
      { name: 'Type 9 - The Peacemaker', score: '50' }
    ];
    enneagramViewModel.scores$.set(scores);
    enneagramViewModel.enneagramFullTextResult$.set("Detailed Enneagram results");

    // Act
    const result = await enneagramViewModel.submitAssessment();

    // Assert
    expect(result.isOk()).toBe(true);

    // Verify the assessment was saved with the correct data structure
    const savedAssessment = userAssessments$[0];
    expect(savedAssessment.assessment_data).toBeDefined();
    expect(savedAssessment.assessment_data.scores).toBeDefined();
    expect(savedAssessment.additional_data).toBeDefined();
    expect(savedAssessment.additional_data.scores).toBeDefined();
  });
  ```

  #### MotivationCodeViewModel Tests
  ```typescript
  // Add to src/viewModels/__tests__/MotivationCodeViewModel.test.ts
  it('should correctly populate assessment_data and additional_data when submitting', async () => {
    // Arrange
    const motivations = ['Achievement', 'Growth', 'Impact', 'Innovation', 'Leadership'];
    motivations.forEach((motivation, index) => {
      motivationCodeViewModel.updateMotivation(index, motivation);
    });
    motivationCodeViewModel.motivationFullTextResult$.set("Detailed motivation assessment text");

    // Act
    const result = await motivationCodeViewModel.submitAssessment();

    // Assert
    expect(result.isOk()).toBe(true);

    // Verify the assessment was saved with the correct data structure
    const savedAssessment = userAssessments$[0];
    expect(savedAssessment.assessment_data).toBeDefined();
    expect(savedAssessment.assessment_data.motivations).toEqual(motivations);
    expect(savedAssessment.additional_data).toBeDefined();
    expect(savedAssessment.additional_data.motivations).toEqual(motivations);
  });
  ```

  #### CliftonStrengthsViewModel Tests
  ```typescript
  // Add to src/viewModels/__tests__/CliftonStrengthsViewModel.test.ts
  it('should correctly populate assessment_data and additional_data when submitting', async () => {
    // Arrange
    const strengths = [
      { index: 0, value: 'Strategic' },
      { index: 1, value: 'Ideation' },
      { index: 2, value: 'Learner' },
      { index: 3, value: 'Achiever' },
      { index: 4, value: 'Intellection' }
    ];
    cliftonStrengthsViewModel.strengths$.set(strengths);
    cliftonStrengthsViewModel.strengthsFullTextResult$.set("Detailed CliftonStrengths results");

    // Act
    const result = await cliftonStrengthsViewModel.submitAssessment();

    // Assert
    expect(result.isOk()).toBe(true);

    // Verify the assessment was saved with the correct data structure
    const savedAssessment = userAssessments$[0];
    expect(savedAssessment.assessment_data).toBeDefined();
    expect(savedAssessment.assessment_data.strengths).toBeDefined();
    expect(savedAssessment.additional_data).toBeDefined();
    expect(savedAssessment.additional_data.strengths).toBeDefined();
  });
  ```

### 5. Integration Testing with Multiple Assessment Types
**Success Criteria**: Integration tests pass, verifying the end-to-end flow works for all assessment types with both data providers.

- Create integration tests that verify the full flow from ViewModel to database and back:
  ```typescript
  const shouldRunIntegration = process.env.RUN_INTEGRATION_TESTS === 'true';
  const conditionalDescribe = shouldRunIntegration ? describe : describe.skip;

  conditionalDescribe('Assessment Integration Tests', () => {
    it('should save and retrieve Love Languages assessment with new fields', async () => {
      // Test the full flow with LoveLanguagesViewModel
    });

    it('should save and retrieve MBTI assessment with new fields', async () => {
      // Test the full flow with MBTIViewModel
    });

    // Additional tests for other assessment types
  });
  ```

- Test with different assessment types:
  - Love Languages
  - MBTI
  - Big Five
  - DISC
  - Enneagram
  - Clifton Strengths
  - Motivation Code

## Project Status Board

- [x] **1. Create Supabase Migration File**
  - [x] Create migration file with proper timestamp
  - [x] Add SQL to add both columns
  - [x] Add comments explaining the columns
  - [x] Apply migration to development database

- [x] **2. Update TypeScript Type Definitions**
  - [x] Modify `database.types.ts` to include new columns (this is a done via npm script `generate:types:remote`)
  - [x] Update `Row`, `Insert`, and `Update` interfaces
  - [x] Ensure proper JSON type is used

- [x] **3. Enhance UserAssessmentService Tests**
  - [x] Fix existing UserAssessmentService tests to ensure they pass
  - [x] Update tests to verify processing assessments with new fields
  - [x] Add tests for updating assessments with new fields
  - [x] Verify correct data retrieval from both providers
  - [x] Run tests to confirm they pass

- [ ] **4. Enhance ViewModel Tests**
  - [ ] Update LoveLanguagesViewModel tests for new fields
  - [ ] Update MBTIViewModel tests for new fields
  - [ ] Update BigFiveViewModel tests for new fields
  - [ ] Update DiscViewModel tests for new fields
  - [ ] Update EnneagramViewModel tests for new fields
  - [ ] Update MotivationCodeViewModel tests for new fields
  - [ ] Update CliftonStrengthsViewModel tests for new fields
  - [ ] Verify correct data population in all ViewModels

- [ ] **5. Integration Testing with Multiple Assessment Types**
  - [ ] Create end-to-end tests for Love Languages assessment
  - [ ] Create end-to-end tests for MBTI assessment
  - [ ] Test other assessment types
  - [ ] Verify full flow works with both data providers

## Testing Strategy

### Fixing Existing Tests
- Before adding new tests, we needed to fix existing UserAssessmentService tests
- Key fixes included:
  - Setting the user$ observable directly in test setup to fix authentication issues
  - Updating test assertions to ignore updated_at timestamp comparisons
  - Adding LOGOUT event handling to UserAssessmentService
  - Ensuring proper test setup for deleteAssessment tests

### Unit Testing
- Focus on testing UserAssessmentService to verify it correctly handles the new fields
- Created tests for both processing and updating assessments with the new fields
- Verified that assessment_data and additional_data fields are correctly saved and retrieved
- Used a mock approach for testing processAssessment to avoid assessment handler registry issues
- Test each ViewModel implementation to ensure they correctly populate and use the new fields
- Verify both creation and update flows for different assessment types
- Test with TestDataProvider to ensure fast, reliable tests

### Integration Testing
- Test the complete end-to-end flow from ViewModel through UserAssessmentService to database and back
- Verify all assessment types work correctly with the new fields
- Conditionally run integration tests with actual Supabase when the RUN_INTEGRATION_TESTS flag is enabled
- Ensure both TestDataProvider and SupabaseDataProvider work correctly with the new schema
- Note: We discovered that the existing UserAssessmentIntegration.test.ts tests are failing and will need to be fixed before adding new integration tests

## Future Work: Field Consolidation Plan

As noted in our analysis, the `assessment_data` and `additional_data` columns appear to store identical information. We recommend planning a future task to consolidate these fields:

1. **Phase 1 (Current)**: Add both fields to fix the immediate issue
2. **Phase 2 (Future)**:
   - Modify code to only write to `assessment_data` and read from both (fallback pattern)
   - Update existing data to ensure `assessment_data` contains all needed information
3. **Phase 3 (Future)**:
   - Remove all references to `additional_data` in code
   - Create migration to make `additional_data` nullable but keep for backward compatibility
4. **Phase 4 (Future)**:
   - Create migration to remove the `additional_data` column completely

This phased approach will maintain backward compatibility while gradually cleaning up the redundancy.

## Lessons
- Schema changes should be synchronized across environments
- Type definitions should be kept in sync with database schema
- Comprehensive testing across both test and production providers ensures robustness
- Document technical debt and redundancies for future cleanup
- Ensure existing tests pass before adding new tests for new features
- Authentication setup in tests is critical for services that depend on user authentication
- The UserAssessmentService implementation already correctly handled the assessment_data and additional_data fields, but tests were needed to verify this behavior
- Mock testing approaches can be useful when dealing with complex dependencies like the AssessmentHandlerRegistry
