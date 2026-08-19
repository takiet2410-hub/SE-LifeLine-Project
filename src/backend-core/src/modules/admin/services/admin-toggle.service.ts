import { FeatureToggle, IFeatureToggle } from '../models/feature-toggle.model';
import { AdminAuditLog } from '../models/audit-log.model';

const DEFAULT_FEATURE_STATES: Readonly<Record<string, boolean>> = {
  ai_chatbot: true,
  sos_emergency_alerts: true,
  gamification_badges: true,
  news_content_portal: true,
};

export type FeatureToggleKey = keyof typeof DEFAULT_FEATURE_STATES;

export const getFeatureState = async (key: string): Promise<boolean> => {
  const toggle = await FeatureToggle.findOne({ key }).lean();
  return toggle ? toggle.isEnabled : (DEFAULT_FEATURE_STATES[key] ?? false);
};

export const isFeatureEnabled = async (key: string): Promise<boolean> => {
  try {
    return await getFeatureState(key);
  } catch {
    // Background jobs fail closed. HTTP middleware uses getFeatureState directly
    // so it can distinguish a disabled feature from an unavailable toggle store.
    return false;
  }
};

export class AdminToggleService {
  async getPublicFeatureStates() {
    const toggles = await FeatureToggle.find({ key: { $in: Object.keys(DEFAULT_FEATURE_STATES) } }).lean();
    const storedStates = new Map(toggles.map((toggle) => [toggle.key, toggle.isEnabled]));

    return {
      features: Object.entries(DEFAULT_FEATURE_STATES).reduce<Record<string, boolean>>((states, [key, defaultState]) => {
        states[key] = storedStates.get(key) ?? defaultState;
        return states;
      }, {}),
    };
  }

  async getFeatureToggles() {
    await this.seedDefaultToggles();
    const toggles = await FeatureToggle.find().lean();

    const items = toggles.map((t) => ({
      id: t._id.toString(),
      key: t.key,
      name: t.name,
      description: t.description,
      isEnabled: t.isEnabled,
      dependencies: t.dependencies || [],
      affectedServices: t.affectedServices || [],
      updatedBy: t.updatedBy || 'System',
      updatedAt: t.updatedAt,
    }));

    return { toggles: items };
  }

  async updateFeatureToggle(
    adminUser: { id: string; name: string },
    key: string,
    isEnabled: boolean,
    ipAddress: string
  ) {
    if (typeof isEnabled !== 'boolean') {
      throw new Error('isEnabled must be a boolean.');
    }
    const toggle = await FeatureToggle.findOne({ key });
    if (!toggle) {
      throw new Error(`Feature toggle '${key}' not found.`);
    }

    const previousState = toggle.isEnabled;
    toggle.isEnabled = isEnabled;
    toggle.updatedBy = adminUser.name;
    await toggle.save();

    try {
      await AdminAuditLog.create({
        actorUserId: adminUser.id,
        actorName: adminUser.name,
        action: isEnabled ? 'Enable Feature Toggle' : 'Disable Feature Toggle',
        actionCategory: 'Feature Toggle',
        resourceType: 'FeatureToggle',
        resourceId: key,
        previousValue: { isEnabled: previousState },
        newValue: { isEnabled },
        details: `Feature ${toggle.name} toggled to ${isEnabled ? 'ENABLED' : 'DISABLED'}`,
        ipAddress,
        status: 'Success',
      });
    } catch (error) {
      toggle.isEnabled = previousState;
      await toggle.save();
      throw error;
    }

    return toggle;
  }

  private async seedDefaultToggles() {
    const defaultToggles = [
      {
        key: 'ai_chatbot',
        name: 'AI Chatbot Assistant (CB-UC-01)',
        description: 'RAG-powered conversational medical assistant for donor FAQ & appointment support.',
        isEnabled: true,
        dependencies: ['vector_search_engine'],
        affectedServices: [
          'Automated Health Screening Triage',
          'Smart Donor FAQ Auto-responder',
          'Voice & Text Chatbot Widget',
        ],
      },
      {
        key: 'sos_emergency_alerts',
        name: 'SOS Emergency Broadcast System (HS-UC-01)',
        description: 'Hospital emergency blood request broadcasting and real-time donor notification alerts.',
        isEnabled: true,
        dependencies: ['firebase_push_engine', 'geo_radius_matching'],
        affectedServices: [
          'Hospital Emergency SOS Dispatch',
          'Radius-based Donor Push Alerts',
          'Emergency Blood Matching Engine',
        ],
      },
      {
        key: 'gamification_badges',
        name: 'Gamification & Impact Tracking',
        description: 'Donor levels, achievement badges, and digital certificates for completed donations.',
        isEnabled: true,
        dependencies: [],
        affectedServices: [
          'Donor Achievement Badges',
          'Level Progress Bar',
          'Digital Donor Milestone Cards',
        ],
      },
      {
        key: 'news_content_portal',
        name: 'Content & Educational News Feed',
        description: 'Blood donation news articles, health tips, and educational content publishing.',
        isEnabled: true,
        dependencies: [],
        affectedServices: [
          'Public News Feed Portal',
          'Scheduled Article Publisher Job',
        ],
      },
    ];

    await FeatureToggle.bulkWrite(defaultToggles.map((toggle) => ({
      updateOne: {
        filter: { key: toggle.key },
        update: { $setOnInsert: toggle },
        upsert: true,
      },
    })));
  }
}
