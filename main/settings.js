const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class SettingsManager {
  constructor(app) {
    this.app = app;
    this.settingsPath = path.join(app.getPath('userData'), 'settings.json');
    this.defaultSettings = {
      exportPath: path.join(os.homedir(), 'Documents', 'MangaExports'),
      sweetSpot: 600,
      delayRows: 1
    };
    this.settings = null;
  }

  async loadSettings() {
    try {
      const data = await fs.readFile(this.settingsPath, 'utf-8');
      this.settings = { ...this.defaultSettings, ...JSON.parse(data) };
    } catch (error) {
      // If file doesn't exist or is invalid, use defaults
      this.settings = { ...this.defaultSettings };
      await this.saveSettings();
    }
    return this.settings;
  }

  async saveSettings() {
    try {
      await fs.mkdir(path.dirname(this.settingsPath), { recursive: true });
      await fs.writeFile(this.settingsPath, JSON.stringify(this.settings, null, 2));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  async getExportPath() {
    if (!this.settings) {
      await this.loadSettings();
    }
    return this.settings.exportPath;
  }

  async setExportPath(newPath) {
    if (!this.settings) {
      await this.loadSettings();
    }
    this.settings.exportPath = newPath;
    await this.saveSettings();
  }

  async ensureExportPath() {
    const exportPath = await this.getExportPath();
    try {
      await fs.mkdir(exportPath, { recursive: true });
    } catch (error) {
      console.error('Error creating export directory:', error);
    }
    return exportPath;
  }

  async getSweetSpot() {
    if (!this.settings) {
      await this.loadSettings();
    }
    return this.settings.sweetSpot || 600;
  }

  async setSweetSpot(value) {
    if (!this.settings) {
      await this.loadSettings();
    }
    this.settings.sweetSpot = value;
    await this.saveSettings();
  }

  async getDelayRows() {
    if (!this.settings) {
      await this.loadSettings();
    }
    return this.settings.delayRows || 1;
  }

  async setDelayRows(value) {
    if (!this.settings) {
      await this.loadSettings();
    }
    this.settings.delayRows = value;
    await this.saveSettings();
  }
}

module.exports = SettingsManager;