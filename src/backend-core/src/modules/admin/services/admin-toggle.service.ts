import { FeatureToggle, IFeatureToggle } from '../models/feature-toggle.model';
import { AdminAuditLog } from '../models/audit-log.model';

export class AdminToggleService {
  async getFeatureToggles() {
    let toggles = await FeatureToggle.find().lean();

    if (!toggles || toggles.length === 0) {
      await this.seedDefaultToggles();
      toggles = await FeatureToggle.find().lean();
    }

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
    const toggle = await FeatureToggle.findOne({ key });
    if (!toggle) {
      throw new Error(`Feature toggle '${key}' not found.`);
    }

    const previousState = toggle.isEnabled;
    toggle.isEnabled = isEnabled;
    toggle.updatedBy = adminUser.name;
    await toggle.save();

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

    await FeatureToggle.insertMany(defaultToggles);
  }
}
