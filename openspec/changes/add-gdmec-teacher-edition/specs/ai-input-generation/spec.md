## MODIFIED Requirements

### Requirement: Agent Skill Media Model Selectors

The AI input bar SHALL show additional media model selectors when Agent mode has an explicitly selected Skill that is known to invoke media generation. In the teacher distribution, Skills classified as video or audio output SHALL NOT be offered, so no video or audio model selector SHALL ever be shown.

#### Scenario: Image or PPT Skill selected
- **GIVEN** the user is in Agent mode
- **AND** the selected Skill is classified as image or PPT output
- **WHEN** the input bar renders
- **THEN** it SHALL keep the text model selector for Agent analysis
- **AND** it SHALL show an image model selector for the Skill's media generation

#### Scenario: Video Skill selected
- **GIVEN** the user is in Agent mode
- **AND** a Skill classified as video output exists in the Skill catalog
- **WHEN** the Skill catalog renders
- **THEN** that Skill SHALL NOT be selectable
- **AND** no video model selector SHALL be shown

#### Scenario: Audio Skill selected
- **GIVEN** the user is in Agent mode
- **AND** a Skill classified as audio output exists in the Skill catalog
- **WHEN** the Skill catalog renders
- **THEN** that Skill SHALL NOT be selectable
- **AND** no audio model selector SHALL be shown

#### Scenario: Auto Skill selected
- **GIVEN** the user is in Agent mode
- **AND** the selected Skill is Auto
- **WHEN** the input bar renders
- **THEN** it SHALL NOT show additional media model selectors
