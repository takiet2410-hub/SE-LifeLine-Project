# Data Model: Health Tips Page

## 1. Entities

### 1.1. TipCard
Represents a category of health tips for donors.
* **id** (`string`): Unique identifier for the category.
* **titleKey** (`string`): i18next translation key for the card title (e.g., `healthTips.categories.nutrition.title`).
* **descriptionKey** (`string`): i18next translation key for the short description.
* **iconName** (`string`): Identifier for the Lucide-react icon to display.
* **imageFallbackUrl** (`string`): URL for the fallback image if the primary icon/image fails.

### 1.2. FAQItem
Represents a frequently asked question regarding blood donation health.
* **id** (`string`): Unique identifier for the FAQ.
* **questionKey** (`string`): i18next translation key for the question text.
* **answerKey** (`string`): i18next translation key for the answer text.

## 2. Validation Rules
* None. Data is statically defined and read-only.

## 3. State Transitions
* **FAQ Accordion**: 
  * `isExpanded = false` (default): Answer is hidden.
  * `isExpanded = true`: Answer is visible, container flexes to fit content.
