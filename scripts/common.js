const CONSTANTS = {
  DEFAULT_WORK: 25,
  DEFAULT_BREAK: 5,
  PHASES: { WORK: "work", BREAK: "break", IDLE: "idle" },
  BREAK_TYPES: { LINK: "link", EXERCISE: "exercise", MEDITATION: "meditation" },
  ALARM: "focus-break-timer",
  MIN_WORK: 1,
  MAX_WORK: 180,
  MIN_BREAK: 1,
  MAX_BREAK: 60,
  STORAGE: { SETTINGS: "settings", TIMER: "timer", LINK_BREAK: "linkBreak" },
  NOTIFICATIONS: { BREAK: "break-time", WORK: "work-time", DONE: "exercise-done" }
};

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function getDefaultSettings() {
  return {
    workDuration: CONSTANTS.DEFAULT_WORK,
    breakDuration: CONSTANTS.DEFAULT_BREAK,
    breakType: CONSTANTS.BREAK_TYPES.LINK,
    linkUrl: ""
  };
}

function getDefaultTimer() {
  return {
    phase: CONSTANTS.PHASES.IDLE,
    isRunning: false,
    timeRemaining: CONSTANTS.DEFAULT_WORK * 60,
    startedAt: null,
    meditationRemaining: 0
  };
}

function getDefaultLinkBreak() {
  return { tabId: null, url: "" };
}
