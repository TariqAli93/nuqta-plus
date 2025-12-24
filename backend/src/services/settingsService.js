import { getDb, saveDatabase } from '../db.js';
import { settings } from '../models/index.js';
import { eq, like } from 'drizzle-orm';
import { NotFoundError, ConflictError } from '../utils/errors.js';

/**
 * Enhanced Settings Service
 * Handles comprehensive application settings management
 */
export class SettingsService {
  /**
   * Get all settings as array of {key, value, description} objects
   */
  async getAll() {
    const db = await getDb();
    const allSettings = await db.select().from(settings);
    return allSettings;
  }

  /**
   * Get a single setting by key
   */
  async getByKey(key) {
    const db = await getDb();
    const [setting] = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
    if (!setting) {
      throw new NotFoundError(`Setting with key '${key}' not found.`);
    }
    return setting;
  }

  /**
   * Get setting value by key (returns null if not found)
   */
  async getValue(key) {
    try {
      const setting = await this.getByKey(key);
      return setting.value;
    } catch {
      return null;
    }
  }

  /**
   * Create a new setting
   */
  async create({ key, value, description }) {
    const db = await getDb();
    const existingSetting = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
    if (existingSetting.length > 0) {
      throw new ConflictError(`Setting with key '${key}' already exists.`);
    }
    const now = new Date().toISOString();
    const [newSetting] = await db.insert(settings).values({
      key,
      value: String(value),
      description,
      updatedAt: now,
      createdAt: now,
    }).returning();
    await saveDatabase();
    return newSetting;
  }

  /**
   * Update an existing setting
   */
  async update(key, { value, description }) {
    const db = await getDb();
    const [existing] = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
    if (!existing) {
      throw new NotFoundError(`Setting with key '${key}' not found.`);
    }
    const updateData = {
      updatedAt: new Date().toISOString(),
    };
    if (value !== undefined) updateData.value = String(value);
    if (description !== undefined) updateData.description = description;

    const [updated] = await db.update(settings)
      .set(updateData)
      .where(eq(settings.key, key))
      .returning();
    await saveDatabase();
    return updated;
  }

  /**
   * Upsert (create or update) a setting
   */
  async upsert({ key, value, description }) {
    const db = await getDb();
    const [existing] = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
    if (existing) {
      return this.update(key, { value, description });
    }
    return this.create({ key, value, description });
  }

  /**
   * Bulk upsert settings from array of {key, value, description?} objects
   */
  async bulkUpsert(settingsArray) {
    const results = [];
    for (const item of settingsArray) {
      const result = await this.upsert(item);
      results.push(result);
    }
    return results;
  }

  /**
   * Delete a setting by key
   */
  async delete(key) {
    const db = await getDb();
    const [existing] = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
    if (!existing) {
      throw new NotFoundError(`Setting with key '${key}' not found.`);
    }
    await db.delete(settings).where(eq(settings.key, key));
    await saveDatabase();
    return { success: true, message: `Setting '${key}' deleted.` };
  }

  /**
   * Get company information (all settings prefixed with 'company.')
   */
  async getCompanyInfo() {
    const db = await getDb();
    const companySettings = await db.select()
      .from(settings)
      .where(like(settings.key, 'company.%'));

    const companyInfo = {};
    companySettings.forEach(({ key, value }) => {
      const field = key.replace('company.', '');
      companyInfo[field] = value;
    });
    
    // Return with default values
    return {
      name: companyInfo.name || '',
      city: companyInfo.city || '',
      area: companyInfo.area || '',
      street: companyInfo.street || '',
      phone: companyInfo.phone || '',
      phone2: companyInfo.phone2 || '',
      logoUrl: companyInfo.logoUrl || '',
      invoiceType: companyInfo.invoiceType || '',
      invoiceTheme: companyInfo.invoiceTheme || 'classic',
    };
  }

  /**
   * Save company information (upserts all company.* keys)
   */
  async saveCompanyInfo(companyData) {
    const updates = [];
    for (const [field, value] of Object.entries(companyData)) {
      if (value !== undefined && value !== null) {
        updates.push({
          key: `company.${field}`,
          value: String(value),
          description: `Company ${field}`,
        });
      }
    }
    await this.bulkUpsert(updates);
    return this.getCompanyInfo();
  }

  /**
   * Get currency settings (defaultCurrency, usdRate, iqdRate)
   */
  async getCurrencySettings() {
    const currencyKeys = ['defaultCurrency', 'usdRate', 'iqdRate'];
    const currencyData = {};
    for (const key of currencyKeys) {
      const value = await this.getValue(key);
      if (value !== null) {
        currencyData[key] = key.includes('Rate') ? parseFloat(value) : value;
      }
    }
    // Defaults
    if (!currencyData.defaultCurrency) currencyData.defaultCurrency = 'IQD';
    if (!currencyData.usdRate) currencyData.usdRate = 1500;
    if (!currencyData.iqdRate) currencyData.iqdRate = 1;
    return currencyData;
  }

  /**
   * Save currency settings
   */
  async saveCurrencySettings({ defaultCurrency, usdRate, iqdRate }) {
    // Removed console.log - use logger in controller if detailed logging needed
    const updates = [];
    if (defaultCurrency) {
      updates.push({ key: 'defaultCurrency', value: String(defaultCurrency), description: 'Default currency' });
    }
    if (usdRate !== undefined) {
      updates.push({ key: 'usdRate', value: String(usdRate), description: 'USD exchange rate' });
    }
    if (iqdRate !== undefined) {
      updates.push({ key: 'iqdRate', value: String(iqdRate), description: 'IQD exchange rate' });
    }
    await this.bulkUpsert(updates);
    return this.getCurrencySettings();
  }
}

export default new SettingsService();
