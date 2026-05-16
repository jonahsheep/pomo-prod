let status = null;

const $ = (id) => document.getElementById(id);

function updateDisplay() {
  if (!status) return;

  const { phase, isRunning, timeRemaining, settings, meditationRemaining, duration } = status;

  const badge = $("phase-badge");
  const timerDisplay = $("timer-display");
  const timerSub = $("timer-sub");
  const breakActivity = $("break-activity");
  const exerciseSection = $("exercise-section");
  const meditationSection = $("meditation-section");
  const meditationTimer = $("meditation-timer");
  const btnStart = $("btn-start");
  const btnPause = $("btn-pause");
  const btnReset = $("btn-reset");

  const phaseNames = {
    [CONSTANTS.PHASES.WORK]: "Focus Time",
    [CONSTANTS.PHASES.BREAK]: "Break Time",
    [CONSTANTS.PHASES.IDLE]: "Ready"
  };

  badge.textContent = phaseNames[phase] || "Ready";
  badge.className = phase === CONSTANTS.PHASES.WORK ? "work" : phase === CONSTANTS.PHASES.BREAK ? "break" : "";

  timerDisplay.textContent = formatTime(timeRemaining);
  timerSub.textContent = phase === CONSTANTS.PHASES.WORK
    ? "Stay focused. You've got this."
    : phase === CONSTANTS.PHASES.BREAK
    ? "Take a proper break."
    : "Press Start to begin a focus session.";

  const showBtns = phase !== CONSTANTS.PHASES.IDLE;
  btnStart.style.display = showBtns ? "none" : "inline-block";
  btnPause.style.display = showBtns ? "inline-block" : "none";
  btnReset.style.display = showBtns ? "inline-block" : "none";

  if (phase === CONSTANTS.PHASES.IDLE) {
    btnStart.textContent = "Start Working";
  } else if (!isRunning) {
    btnStart.style.display = "inline-block";
    btnStart.textContent = "Resume";
    btnPause.style.display = "none";
  }

  if (phase === CONSTANTS.PHASES.BREAK) {
    breakActivity.style.display = "block";
    if (settings.breakType === CONSTANTS.BREAK_TYPES.EXERCISE) {
      exerciseSection.style.display = "block";
      meditationSection.style.display = "none";
    } else if (settings.breakType === CONSTANTS.BREAK_TYPES.MEDITATION) {
      exerciseSection.style.display = "none";
      meditationSection.style.display = "block";
      meditationTimer.textContent = formatTime(meditationRemaining);
    } else {
      breakActivity.style.display = "none";
    }
  } else {
    breakActivity.style.display = "none";
  }

  $("work-setting").textContent = `Work: ${settings.workDuration}m`;
  $("break-setting").textContent = `Break: ${settings.breakDuration}m`;

  const breakLabels = {
    [CONSTANTS.BREAK_TYPES.LINK]: "Link",
    [CONSTANTS.BREAK_TYPES.EXERCISE]: "Exercise",
    [CONSTANTS.BREAK_TYPES.MEDITATION]: "Meditation"
  };
  $("break-type-setting").textContent = breakLabels[settings.breakType] || "";
}

async function fetchStatus() {
  try {
    status = await chrome.runtime.sendMessage({ action: "getStatus" });
    updateDisplay();
  } catch (e) {
  }
}

$("btn-start").addEventListener("click", async () => {
  if (status && status.phase !== CONSTANTS.PHASES.IDLE) {
    await chrome.runtime.sendMessage({ action: "resume" });
  } else {
    await chrome.runtime.sendMessage({ action: "start" });
  }
});

$("btn-pause").addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ action: "pause" });
});

$("btn-reset").addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ action: "reset" });
});

$("btn-exercise-done")?.addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ action: "exerciseDone" });
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local") {
    fetchStatus();
  }
});

fetchStatus();
setInterval(fetchStatus, 1000);
