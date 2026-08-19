import { SystemConfig, ISystemConfig } from '../models/system-config.model';
import { AdminAuditLog } from '../models/audit-log.model';

const DEFAULT_CONFIG_VALUES: Record<string, unknown> = {
  donationIntervalDays: 84,
  minDonorAge: 18,
  maxDonorAge: 60,
  maxCampaignCapacity: 150,
  sosSearchRadiusKm: 10,
  sosMaxRadiusKm: 50,
  appointmentReminderHours: 24,
  autoPublishArticles: true,
};

export class AdminConfigService {
  async getSystemConfigs() {
    // Upsert missing keys even when the collection is only partially seeded.
    await this.seedDefaultConfigs();
    let configs = await SystemConfig.find().lean();

    // Repair legacy values that predate the current validation rules.
    for (const config of configs) {
      try {
        this.validateValue(config.key, config.value);
      } catch {
        if (!(config.key in DEFAULT_CONFIG_VALUES)) continue;
        const previousValue = config.value;
        const repairedValue = DEFAULT_CONFIG_VALUES[config.key];
        await SystemConfig.updateOne(
          { _id: config._id },
          { $set: { value: repairedValue, updatedBy: 'System Repair' } }
        );
        config.value = repairedValue;
        await AdminAuditLog.create({
          actorUserId: 'System',
          actorName: 'System Repair',
          action: 'Repair Invalid System Configuration',
          actionCategory: 'System Configuration',
          resourceType: 'SystemConfig',
          resourceId: config.key,
          previousValue: { [config.key]: previousValue },
          newValue: { [config.key]: repairedValue },
          details: `Repaired invalid legacy value for ${config.key}`,
          status: 'Success',
        }).catch(() => undefined);
      }
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
    this.validateValue(key, value);
    let config = await SystemConfig.findOne({ key });
    if (!config) {
      throw new Error(`Configuration key '${key}' not found.`);
    }

    if (key === 'minDonorAge' || key === 'maxDonorAge') {
      const counterpartKey = key === 'minDonorAge' ? 'maxDonorAge' : 'minDonorAge';
      const counterpart = await SystemConfig.findOne({ key: counterpartKey }).lean();
      const minAge = key === 'minDonorAge' ? value : counterpart?.value;
      const maxAge = key === 'maxDonorAge' ? value : counterpart?.value;
      if (typeof minAge === 'number' && typeof maxAge === 'number' && minAge > maxAge) {
        throw new Error('Minimum donor age cannot be greater than maximum donor age.');
      }
    }
    if (key === 'sosSearchRadiusKm' || key === 'sosMaxRadiusKm') {
      const counterpartKey = key === 'sosSearchRadiusKm' ? 'sosMaxRadiusKm' : 'sosSearchRadiusKm';
      const counterpart = await SystemConfig.findOne({ key: counterpartKey }).lean();
      const initialRadius = key === 'sosSearchRadiusKm' ? value : counterpart?.value;
      const maxRadius = key === 'sosMaxRadiusKm' ? value : counterpart?.value;
      if (typeof initialRadius === 'number' && typeof maxRadius === 'number' && initialRadius > maxRadius) {
        throw new Error('Initial SOS search radius cannot be greater than maximum SOS radius.');
      }
    }

    const previousValue = config.value;
    config.value = value;
    config.updatedBy = adminUser.name;
    await config.save();

    try {
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
    } catch (error) {
      config.value = previousValue;
      await config.save();
      throw error;
    }

    return config;
  }

  private validateValue(key: string, value: unknown) {
    const numericRules: Record<string, { min: number; max: number; integer?: boolean }> = {
      donationIntervalDays: { min: 1, max: 365, integer: true },
      minDonorAge: { min: 16, max: 65, integer: true },
      maxDonorAge: { min: 18, max: 80, integer: true },
      maxCampaignCapacity: { min: 1, max: 100_000, integer: true },
      sosSearchRadiusKm: { min: 1, max: 500 },
      sosMaxRadiusKm: { min: 1, max: 1_000 },
      appointmentReminderHours: { min: 1, max: 168, integer: true },
    };
    if (key === 'autoPublishArticles') {
      if (typeof value !== 'boolean') throw new Error('autoPublishArticles must be a boolean.');
      return;
    }
    const rule = numericRules[key];
    if (!rule) throw new Error(`Configuration key '${key}' is not editable.`);
    if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      value < rule.min ||
      value > rule.max ||
      (rule.integer && !Number.isInteger(value))
    ) {
      throw new Error(`Invalid value for '${key}'. Expected ${rule.min}–${rule.max}${rule.integer ? ' as an integer' : ''}.`);
    }
  }

  private async seedDefaultConfigs() {
    const defaultConfigs: Array<{
      key: string;
      label: string;
      value: unknown;
      category: ISystemConfig['category'];
      description: string;
      unit?: string;
    }> = [
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

    await SystemConfig.bulkWrite(defaultConfigs.map((config) => ({
      updateOne: {
        filter: { key: config.key },
        update: { $setOnInsert: config },
        upsert: true,
      },
    })));
  }
}
