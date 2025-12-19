document.addEventListener("DOMContentLoaded", () => {
  const $ = id => document.getElementById(id);

  const input = $("qualityInput");
  const checkBtn = $("checkBtn");
  const output = $("qualityOutput");
  const totalTimeEl = $("totalTime");

  const checkTypeSelect = $("checkTypeSelect");
  const checkTypeSelectMirror = $("checkTypeSelectMirror");

  const recheckBtn = $("recheckBtn");
  const resetBtn = $("resetQualityBtn");

  let startTime = 0;
  let lastEmail = "";

  // 🔄 Sync dropdowns
  if (checkTypeSelect && checkTypeSelectMirror) {
    checkTypeSelect.addEventListener("change", () => {
      checkTypeSelectMirror.value = checkTypeSelect.value;
    });
    checkTypeSelectMirror.addEventListener("change", () => {
      checkTypeSelect.value = checkTypeSelectMirror.value;
    });
  }

  function disableAll() {
    [
      input,
      checkBtn,
      checkTypeSelect,
      checkTypeSelectMirror,
      recheckBtn,
      resetBtn
    ].forEach(el => el && (el.disabled = true));
  }

  function enableAll() {
    [
      input,
      checkBtn,
      checkTypeSelect,
      checkTypeSelectMirror,
      recheckBtn,
      resetBtn
    ].forEach(el => el && (el.disabled = false));
  }

  function getScoreBadge(score) {
    if (score >= 80) return "🟢 Excellent";
    if (score >= 60) return "🟡 Average";
    return "🔴 Needs Improvement";
  }

  async function runCheck(email, type) {
    startTime = Date.now();
    totalTimeEl.innerText = "Total Time: 0s";

    disableAll();
    checkBtn.innerText = "🔄 Checking…";
    output.innerHTML = `<span class="email-spinner"></span> Analyzing email...`;
    output.classList.add("loading");

    try {
      const res = await fetch(
        "https://mail-karo.onrender.com/api/quality-check",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, checkType: type })
        }
      );

      const data = await res.json();

      // 🛡️ FINAL HARD SAFETY
      if (
        !data ||
        typeof data !== "object" ||
        data.score === undefined ||
        !data.severity
      ) {
        throw new Error("Invalid quality report received.");
      }

      const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);
      totalTimeEl.innerText = `Total Time: ${timeTaken}s`;

      output.classList.remove("loading");

      output.innerHTML = `
        <div class="quality-score-badge">
          ${getScoreBadge(data.score)} — ${data.score}/100
        </div>

        <strong>Severity:</strong> ${data.severity}<br><br>

        🧠 <strong>Summary:</strong><br>
        ${data.summary}<br><br>

        📌 <strong>Details:</strong>
        <ul>
          <li>Grammar: ${data.grammar}</li>
          <li>Clarity: ${data.clarity}</li>
          <li>Tone Match: ${data.tone}</li>
          <li>Risk Level: ${data.risk}</li>
        </ul>

        ${
          data.suggestions
            ? `<br>✏️ <strong>Suggestions:</strong><br>${data.suggestions}`
            : ""
        }

        ${
          type === "advanced" && data.improvedEmail
            ? `<br><hr><br>
               ✨ <strong>Improved Email (Advanced Mode):</strong><br><br>
               <pre style="white-space:pre-wrap;">${data.improvedEmail}</pre>`
            : ""
        }
      `;

      checkBtn.innerText = "✅ Checked!";
    } catch (err) {
      output.classList.remove("loading");
      output.innerHTML = `⚠️ ${err.message}`;
      checkBtn.innerText = "❌ Try Again";
    } finally {
      enableAll();
    }
  }

  checkBtn.addEventListener("click", () => {
    const email = input.value.trim();
    if (!email) return alert("Please paste an email to check.");
    lastEmail = email;
    runCheck(email, checkTypeSelect.value);
  });

  recheckBtn.addEventListener("click", () => {
    if (lastEmail) runCheck(lastEmail, checkTypeSelect.value);
  });

  resetBtn.addEventListener("click", () => {
    input.value = "";
    output.innerText =
      "Your AI Email Quality Check Report will appear here...";
    totalTimeEl.innerText = "Total Time: 0s";
    checkBtn.innerText = "🛡️ Check";
  });
});
