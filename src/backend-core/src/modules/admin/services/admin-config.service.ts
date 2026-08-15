import { SystemConfig, ISystemConfig } from '../models/system-config.model';
import { AdminAuditLog } from '../models/audit-log.model';

export class AdminConfigService {
  async getSystemConfigs() {
    let configs = await SystemConfig.find().lean();

    if (!configs || configs.length === 0) {
      await this.seedDefaultConfigs();
      configs = await SystemConfig.find().lean();
    }

    // Group configs by category
    const categories = ['Eligibility Rules', 'Campaign Settings', 'Notification Settings', 'General'];
    const grouped = categories.map((cat) => ({
      category: cat,
      items: configs
        .filter((c) => c.category === cat)
        .map((c) => ({
          id: c._id.toString(),
          key: c.key,
          label: c.label,
          value: c.value,
          description: c.description,
          unit: c.unit,
        })),
    }));

    return { categories: grouped };
  }

  async updateConfig(
    adminUser: { id: string; name: string },
    key: string,
    value: any,
    ipAddress: string
  ) {
    let config = await SystemConfig.findOne({ key });
    if (!config) {
      throw new Error(`Configuration key '${key}' not found.`);
    }

    const previousValue = config.value;
    config.value = value;
    config.updatedBy = adminUser.name;
    await config.save();

    await AdminAuditLog.create({
      actorUserId: adminUser.id,
      actorName: adminUser.name,
      action: 'Update System Configuration',
      actionCategory: 'System Configuration',
      resourceType: 'SystemConfig',
      resourceId: key,
      previousValue: { [key]: previousValue },
      newValue: { [key]: value },
      ipAddress,
      status: 'Success',
    });

    return config;
  }

  private async seedDefaultConfigs() {
    const defaultConfigs = [
      {
        key: 'donationIntervalDays',
        label: 'Minimum Donation Interval',
        value: 84,
        category: 'Eligibility Rules',
        description: 'Required waiting period between consecutive whole blood donations.',
        unit: 'days',
      },
      {
        key: 'minDonorAge',
        label: 'Minimum Donor Age',
        value: 18,
        category: 'Eligibility Rules',
        description: 'Minimum legal age required for blood donation registration.',
        unit: 'years',
      },
      {
        key: 'maxDonorAge',
        label: 'Maximum Donor Age',
        value: 60,
        category: 'Eligibility Rules',
        description: 'Upper age limit for voluntary blood donors.',
        unit: 'years',
      },
      {
        key: 'maxCampaignCapacity',
        label: 'Default Campaign Capacity',
        value: 150,
        category: 'Campaign Settings',
        description: 'Maximum donor slots allowed per campaign event by default.',
        unit: 'donors',
      },
      {
        key: 'sosSearchRadiusKm',
        label: 'SOS Alert Initial Search Radius',
        value: 10,
        category: 'Campaign Settings',
        description: 'Initial geographic radius for dispatching SOS emergency notifications.',
        unit: 'km',
      },
      {
        key: 'sosMaxRadiusKm',
        label: 'SOS Alert Maximum Search Radius',
        value: 50,
        category: 'Campaign Settings',
        description: 'Maximum expanded radius for broadcast emergency alerts.',
        unit: 'km',
      },
      {
        key: 'appointmentReminderHours',
        label: 'Appointment Reminder Trigger',
        value: 24,
        category: 'Notification Settings',
        description: 'Automated notification dispatch time prior to scheduled appointment.',
        unit: 'hours',
      },
      {
        key: 'autoPublishArticles',
        label: 'Auto-publish Scheduled Articles',
        value: true,
        category: 'General',
        description: 'Automatically publish news articles when scheduled timestamp is reached.',
      },
    ];

    await SystemConfig.insertMany(defaultConfigs);
  }
}
