# Data Model & Interfaces: About Us Page

## Component Properties (Props)

### `StatCardProps`
Used for the "Difference We Make" section.
```typescript
interface StatCardProps {
  id: string;
  valueKey: string;      // e.g., "50,000+"
  labelKey: string;      // e.g., "about.stats.activeDonors"
  icon: React.ReactNode; 
}
```

### `CoreValueCardProps`
Used for the "Our Core Values" section.
```typescript
interface CoreValueCardProps {
  id: string;
  titleKey: string;       // e.g., "about.values.reliability.title"
  descriptionKey: string; // e.g., "about.values.reliability.desc"
  icon: React.ReactNode;
}
```

## Localization Schema (i18n)

**Node path in `landing.json`**: `about`

```json
{
  "about": {
    "mission": {
      "badge": "OUR MISSION",
      "title": "Every Drop Counts",
      "description": "LifeLine is Vietnam's leading digital platform for blood donation...",
      "joinButton": "Join Our Network"
    },
    "stats": {
      "title": "The Difference We Make",
      "activeDonors": "Active Donors",
      "hospitals": "Partner Hospitals",
      "impacted": "Lives Impacted"
    },
    "story": {
      "title": "Our Story",
      "p1": "Founded in 2024, LifeLine began with a simple goal...",
      "p2": "We decided to build a technology-driven solution..."
    },
    "values": {
      "title": "Our Core Values",
      "reliability": { "title": "Reliability", "desc": "Medical-grade standards..." },
      "humanCentered": { "title": "Human-Centered", "desc": "Designing for people..." },
      "innovation": { "title": "Innovation", "desc": "Using AI and data..." }
    }
  }
}
```
