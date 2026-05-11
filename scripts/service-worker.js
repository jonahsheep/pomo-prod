const TimerState = {
  timer: null,
  settings: null,

  async init() {
    const { settings, timer } = await chrome.storage.local.get([
      CONSTANTS.STORAGE.SETTINGS,
      CONSTANTS.STORAGE.TIMER
    ]);
    this.settings = settings || getDefaultSettings();
    this.timer = timer || getDefaultTimer();
  },

  async save() {
    await chrome.storage.local.set({
      [CONSTANTS.STORAGE.TIMER]: this.timer,
      [CONSTANTS.STORAGE.SETTINGS]: this.settings
    });
  },

  async updateSettings(partial) {
    Object.assign(this.settings, partial);
    await this.save();
  },

  async reloadSettings() {
    const { settings } = await chrome.storage.local.get(CONSTANTS.STORAGE.SETTINGS);
    if (settings) this.settings = settings;
  },

  async startWork() {
    this.timer.phase = CONSTANTS.PHASES.WORK;
    this.timer.isRunning = true;
    this.timer.timeRemaining = this.settings.workDuration * 60;
    this.timer.startedAt = Date.now();
    this.timer.meditationRemaining = 0;
    await this.save();
    this.startAlarm();
  },

  async startBreak() {
    this.timer.phase = CONSTANTS.PHASES.BREAK;
    this.timer.isRunning = true;
    this.timer.timeRemaining = this.settings.breakDuration * 60;
    this.timer.startedAt = Date.now();
    if (this.settings.breakType === CONSTANTS.BREAK_TYPES.MEDITATION) {
      this.timer.meditationRemaining = this.settings.breakDuration * 60;
    }
    await this.save();
    this.startAlarm();
  },

  async pause() {
    this.timer.isRunning = false;
    this.timer.timeRemaining = this.calculateRemaining();
    await this.save();
    this.stopAlarm();
  },

  async resume() {
    if (this.timer.phase !== CONSTANTS.PHASES.IDLE) {
      this.timer.isRunning = true;
      this.timer.startedAt = Date.now();
      await this.save();
      this.startAlarm();
    }
  },

  async reset() {
    this.timer = getDefaultTimer();
    this.timer.timeRemaining = this.settings.workDuration * 60;
    await this.save();
    this.stopAlarm();
  },

  calculateRemaining() {
    if (!this.timer.startedAt || !this.timer.isRunning) return this.timer.timeRemaining;
    const elapsed = Math.floor((Date.now() - this.timer.startedAt) / 1000);
    return Math.max(0, this.timer.timeRemaining - elapsed);
  },

  calculateMeditationRemaining() {
    if (this.timer.meditationRemaining <= 0) return 0;
    if (!this.timer.startedAt || !this.timer.isRunning) return this.timer.meditationRemaining;
    const elapsed = Math.floor((Date.now() - this.timer.startedAt) / 1000);
    const total = this.settings.breakDuration * 60;
    return Math.max(0, total - elapsed);
  },

  startAlarm() {
    chrome.alarms.create(CONSTANTS.ALARM, { periodInMinutes: 1 });
  },

  stopAlarm() {
    chrome.alarms.clear(CONSTANTS.ALARM);
  },

  getDurationForPhase() {
    if (this.timer.phase === CONSTANTS.PHASES.WORK) return this.settings.workDuration * 60;
    if (this.timer.phase === CONSTANTS.PHASES.BREAK) return this.settings.breakDuration * 60;
    return 0;
  },

  async onAlarm() {
    if (!this.timer.isRunning) return;
    const remaining = this.calculateRemaining();
    this.timer.timeRemaining = remaining;
    this.timer.meditationRemaining = this.calculateMeditationRemaining();
    if (remaining <= 0) {
      this.timer.timeRemaining = 0;
      this.stopAlarm();
      await this.handlePhaseComplete();
    }
    await this.save();
  },

  async handlePhaseComplete() {
    this.timer.isRunning = false;
    this.timer.startedAt = null;
    await this.save();
    if (this.timer.phase === CONSTANTS.PHASES.WORK) {
      await this.onWorkComplete();
      return CONSTANTS.PHASES.WORK;
    } else if (this.timer.phase === CONSTANTS.PHASES.BREAK) {
      await this.onBreakComplete();
      return CONSTANTS.PHASES.BREAK;
    }
    return null;
  },

  async onWorkComplete() {
    await this.startBreak();
  },

  async onBreakComplete() {
    await this.startWork();
  },

  getStatus() {
    return {
      phase: this.timer.phase,
      isRunning: this.timer.isRunning,
      timeRemaining: this.calculateRemaining(),
      settings: this.settings,
      meditationRemaining: this.calculateMeditationRemaining(),
      duration: this.getDurationForPhase()
    };
  }
};

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local") {
    if (changes[CONSTANTS.STORAGE.SETTINGS]) {
      TimerState.settings = changes[CONSTANTS.STORAGE.SETTINGS].newValue;
    }
    if (changes[CONSTANTS.STORAGE.TIMER]) {
      TimerState.timer = changes[CONSTANTS.STORAGE.TIMER].newValue;
    }
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === CONSTANTS.ALARM) {
    TimerState.onAlarm();
  }
});
