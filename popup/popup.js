let status = null;
let tickTimer = null;

const $ = (id) => document.getElementById(id);

function updateDisplay() {
  const phaseLabel = $("phase-label");
  const timerDisplay = $("timer-display");
  const badge = $("break-type-badge");
  const breakActivity = $("break-activity");
  const exercisePrompt = $("exercise-prompt");
  const meditationSection = $("meditation-timer");
  const meditationDisplay = $("meditation-display");
  const controls = $("controls");
  const btnStart = $("btn-start");
  const btnPause = $("btn-pause");
  const btnReset = $("btn-reset");

  if (!status) {
    phaseLabel.textContent = "Ready";
    timerDisplay.textContent = "25:00";
    return;
  }

  const { phase, isRunning, timeRemaining, settings, meditationRemaining } = status;

  const phaseNames = {
    [CONSTANTS.PHASES.WORK]: "Focus",
    [CONSTANTS.PHASES.BREAK]: "Break",
    [CONSTANTS.PHASES.IDLE]: "Ready"
  };
  phaseLabel.textContent = phaseNames[phase] || "Ready";

  timerDisplay.textContent = formatTime(timeRemaining);

  const breakLabels = {
    [CONSTANTS.BREAK_TYPES.LINK]: "Link Break",
    [CONSTANTS.BREAK_TYPES.EXERCISE]: "Exercise Break",
    [CONSTANTS.BREAK_TYPES.MEDITATION]: "Meditation Break"
  };
  badge.textContent = phase === CONSTANTS.PHASES.BREAK
    ? (breakLabels[settings.breakType] || "Break")
    : "";

  if (phase === CONSTANTS.PHASES.BREAK && settings.breakType === CONSTANTS.BREAK_TYPES.EXERCISE) {
    breakActivity.style.display = "block";
    exercisePrompt.style.display = "block";
    meditationSection.style.display = "none";
  } else if (phase === CONSTANTS.PHASES.BREAK && settings.breakType === CONSTANTS.BREAK_TYPES.MEDITATION) {
    breakActivity.style.display = "block";
    exercisePrompt.style.display = "none";
    meditationSection.style.display = "block";
    meditationDisplay.textContent = formatTime(meditationRemaining);
  } else {
    breakActivity.style.display = "none";
  }

  if (phase === CONSTANTS.PHASES.IDLE) {
    btnStart.style.display = "inline-block";
    btnStart.textContent = "Start";
    btnPause.style.display = "none";
    btnReset.style.display = "none";
  } else if (isRunning) {
    btnStart.style.display = "none";
    btnPause.style.display = "inline-block";
    btnPause.textContent = "Pause";
    btnReset.style.display = "inline-block";
  } else {
    btnStart.style.display = "inline-block";
    btnStart.textContent = "Resume";
    btnPause.style.display = "none";
    btnReset.style.display = "inline-block";
  }
}

async function fetchStatus() {
  try {
    status = await chrome.runtime.sendMessage({ action: "getStatus" });
    updateDisplay();
  } catch (e) {
  }
}

function startPolling() {
  if (tickTimer) clearInterval(tickTimer);
  tickTimer = setInterval(fetchStatus, 1000);
}

$("btn-start").addEventListener("click", async () => {
  if (status && status.phase !== CONSTANTS.PHASES.IDLE) {
    await chrome.runtime.sendMessage({ action: "resume" });
  } else {
    await chrome.runtime.sendMessage({ action: "start" });
  }
  await fetchStatus();
});

$("btn-pause").addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ action: "pause" });
  await fetchStatus();
});

$("btn-reset").addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ action: "reset" });
  await fetchStatus();
});

$("btn-exercise-done").addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ action: "exerciseDone" });
  await fetchStatus();
});

$("open-full-timer").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: chrome.runtime.getURL("timer/timer.html") });
});

fetchStatus();
startPolling();
