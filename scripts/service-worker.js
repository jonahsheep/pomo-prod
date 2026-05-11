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

  async startWork() {
    this.timer.phase = CONSTANTS.PHASES.WORK;
    this.timer.isRunning = true;
    this.timer.timeRemaining = this.settings.workDuration * 60;
    this.timer.startedAt = Date.now();
    this.timer.meditationRemaining = 0;
    await this.save();
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
  },

  async pause() {
    this.timer.isRunning = false;
    await this.save();
  },

  async resume() {
    if (this.timer.phase !== CONSTANTS.PHASES.IDLE) {
      this.timer.isRunning = true;
      await this.save();
    }
  },

  async reset() {
    this.timer = getDefaultTimer();
    this.timer.timeRemaining = this.settings.workDuration * 60;
    await this.save();
  },

  tick() {
    if (!this.timer.isRunning) return null;
    this.timer.timeRemaining--;
    if (this.timer.meditationRemaining > 0) {
      this.timer.meditationRemaining--;
    }
    if (this.timer.timeRemaining <= 0) {
      this.timer.timeRemaining = 0;
      return this.handlePhaseComplete();
    }
    return null;
  },

  async handlePhaseComplete() {
    this.timer.isRunning = false;
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
      timeRemaining: this.timer.timeRemaining,
      settings: this.settings,
      meditationRemaining: this.timer.meditationRemaining
    };
  }
};
