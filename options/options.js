async function loadSettings() {
  try {
    const settings = await chrome.runtime.sendMessage({ action: "getSettings" });
    if (settings) { applySettings(settings); return; }
  } catch (e) {}
  const { settings } = await chrome.storage.local.get(CONSTANTS.STORAGE.SETTINGS);
  applySettings(settings || getDefaultSettings());
}

function applySettings(settings) {
  document.getElementById("work-duration").value = settings.workDuration;
  document.getElementById("break-duration").value = settings.breakDuration;
  const breakRadio = document.querySelector(`input[name="break-type"][value="${settings.breakType}"]`);
  if (breakRadio) breakRadio.checked = true;
  document.getElementById("link-url").value = settings.linkUrl || "";
  toggleLinkField(settings.breakType);
  toggleBreakTypeDesc(settings.breakType);
}

function toggleLinkField(breakType) {
  document.getElementById("link-url-field").style.display =
    breakType === CONSTANTS.BREAK_TYPES.LINK ? "block" : "none";
}

function toggleBreakTypeDesc(breakType) {
  const desc = document.getElementById("break-type-desc");
  const texts = {
    [CONSTANTS.BREAK_TYPES.LINK]: "Opens your configured URL during break time. Great for YouTube, music, or reading.",
    [CONSTANTS.BREAK_TYPES.EXERCISE]: "Pause for physical activity. You must confirm completion before the next work session starts.",
    [CONSTANTS.BREAK_TYPES.MEDITATION]: "A quiet countdown timer appears. Focus on your breath until it's time to work again."
  };
  desc.textContent = texts[breakType] || "";
}

document.querySelectorAll('input[name="break-type"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    toggleLinkField(radio.value);
    toggleBreakTypeDesc(radio.value);
  });
});

document.getElementById("btn-save").addEventListener("click", async () => {
  const workDuration = parseInt(document.getElementById("work-duration").value, 10);
  const breakDuration = parseInt(document.getElementById("break-duration").value, 10);
  const breakType = document.querySelector('input[name="break-type"]:checked').value;
  const linkUrl = document.getElementById("link-url").value.trim();

  if (workDuration < CONSTANTS.MIN_WORK || workDuration > CONSTANTS.MAX_WORK) {
    alert(`Work duration must be between ${CONSTANTS.MIN_WORK} and ${CONSTANTS.MAX_WORK} minutes.`);
    return;
  }
  if (breakDuration < CONSTANTS.MIN_BREAK || breakDuration > CONSTANTS.MAX_BREAK) {
    alert(`Break duration must be between ${CONSTANTS.MIN_BREAK} and ${CONSTANTS.MAX_BREAK} minutes.`);
    return;
  }
  if (breakType === CONSTANTS.BREAK_TYPES.LINK && !linkUrl) {
    alert("Please enter a URL for your break link.");
    return;
  }

  const settings = { workDuration, breakDuration, breakType, linkUrl };
  await chrome.storage.local.set({ [CONSTANTS.STORAGE.SETTINGS]: settings });

  chrome.runtime.sendMessage({ action: "updateSettings", settings }).catch(() => {});

  const status = document.getElementById("save-status");
  status.textContent = "Settings saved!";
  setTimeout(() => { status.textContent = ""; }, 2000);
});

loadSettings();
