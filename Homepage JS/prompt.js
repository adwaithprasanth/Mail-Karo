document.addEventListener("DOMContentLoaded", () => {
  const generateBtn = document.getElementById("generateBtn");
  const promptInput = document.getElementById("promptInput");
  const outputText = document.getElementById("outputText");

  const copyBtn = document.getElementById("copyBtn");
  const resetBtn = document.getElementById("resetBtn");
  const regenerateBtn = document.getElementById("regenerateBtn");

  const toneSelect = document.getElementById("toneSelect");

  /* ⭐ Template Elements */
  const templateSelect = document.getElementById("templateSelect");
  const saveTemplateBtn = document.getElementById("saveTemplateBtn");
  const savedGroup = document.getElementById("savedTemplatesGroup");

  let lastPrompt = "";
  let lastTone = "";

  generateBtn.innerText = "⚡ Generate";

  /* ⭐ 15 Professional Templates */
  const templates = {
    job: "Write a job application email applying for the position of...",
    complaint: "Write a complaint email regarding the issue of...",
    followup: "Write a follow-up email after the previous discussion about...",
    leave: "Write a leave request email for...",
    apology: "Write an apology email for...",
    meeting: "Write an email requesting a meeting for...",
    offer: "Write an offer acceptance email for the role of...",
    resignation: "Write a resignation email with a 1-month notice period...",
    reminder: "Write a gentle reminder email about...",
    support: "Write a customer support email describing the issue...",
    refund: "Write a refund request email for the product...",
    thanks: "Write a thank-you email appreciating...",
    inquiry: "Write an inquiry email asking about...",
    marketing: "Write a marketing email promoting...",
    feedback: "Write a feedback email regarding..."
  };

  /* ⭐ Load Saved Templates */
  function loadSavedTemplates() {
    savedGroup.innerHTML = "";
    const saved = JSON.parse(localStorage.getItem("mailKaroSavedTemplates") || "[]");

    saved.forEach((t, i) => {
      const option = document.createElement("option");
      option.value = `saved_${i}`;
      option.textContent = `⭐ ${t.name}`;
      option.setAttribute("data-content", t.content);
      savedGroup.appendChild(option);
    });
  }

  loadSavedTemplates();

  /* ⭐ Template Selection → Auto Fill */
  templateSelect.addEventListener("change", () => {
    const selected = templateSelect.value;

    // Saved template
    if (selected.startsWith("saved_")) {
      const opt = templateSelect.options[templateSelect.selectedIndex];
      const content = opt.getAttribute("data-content");
      promptInput.value = content;
    }
    // Built-in template
    else if (templates[selected]) {
      promptInput.value = templates[selected];
    }
    else {
      promptInput.value = "";
    }

    // Auto height adjust
    promptInput.dispatchEvent(new Event("input"));
  });

  /* ⭐ Save Template to LocalStorage */
  saveTemplateBtn.addEventListener("click", () => {
    const text = promptInput.value.trim();
    if (!text) {
      saveTemplateBtn.innerText = "⚠️ Write something first";
      setTimeout(() => (saveTemplateBtn.innerText = "💾 Save Template"), 1500);
      return;
    }

    const name = prompt("Enter a name for this template:");

    if (!name) return;

    const saved = JSON.parse(localStorage.getItem("mailKaroSavedTemplates") || "[]");

    saved.push({ name, content: text });

    localStorage.setItem("mailKaroSavedTemplates", JSON.stringify(saved));

    loadSavedTemplates();

    saveTemplateBtn.innerText = "✓ Saved!";
    setTimeout(() => (saveTemplateBtn.innerText = "💾 Save Template"), 1300);
  });

  /* ⭐ Counter — Prevent Duplicate */
  let counterBoxExisting = document.querySelector(".counter-box");

  if (!counterBoxExisting) {
    const counterBox = document.createElement("div");
    counterBox.className = "counter-box";
    counterBox.innerHTML = `<span id="charCount">0 chars</span> • <span id="wordCount">0 words</span>`;
    promptInput.parentNode.insertAdjacentElement("afterend", counterBox);
  }

  const charCount = document.getElementById("charCount");
  const wordCount = document.getElementById("wordCount");

  /* ⭐ Live Counter Update */
  promptInput.addEventListener("input", () => {
    charCount.textContent = `${promptInput.value.length} chars`;
    wordCount.textContent = `${promptInput.value.trim().split(/\s+/).filter(Boolean).length} words`;

    generateBtn.innerText = "⚡ Generate";
    promptInput.style.height = "auto";
    promptInput.style.height = promptInput.scrollHeight + "px";
  });

  /* ⭐ Disable All Inputs */
  function disableAll() {
    generateBtn.disabled = true;
    regenerateBtn.disabled = true;
    promptInput.disabled = true;
    toneSelect.disabled = true;
    templateSelect.disabled = true;

    generateBtn.style.cursor = "not-allowed";
    regenerateBtn.style.cursor = "not-allowed";
  }

  function enableAll() {
    generateBtn.disabled = false;
    regenerateBtn.disabled = false;
    promptInput.disabled = false;
    toneSelect.disabled = false;
    templateSelect.disabled = false;

    generateBtn.style.cursor = "pointer";
    regenerateBtn.style.cursor = "pointer";
  }

  /* ⭐ MAIN GENERATE FUNCTION */
  const generateEmail = async (customPrompt = null, customTone = null) => {
    const userPrompt = customPrompt || promptInput.value.trim();
    const tone = customTone || toneSelect.value;

    lastPrompt = userPrompt;
    lastTone = tone;

    if (userPrompt === "") {
      outputText.innerText = "⚠️ Please enter a prompt before generating!";
      outputText.style.color = "#FFD700";
      return;
    }

    const finalPrompt = `${userPrompt}. Write this email in a ${tone} tone.`;

    disableAll();
    generateBtn.innerText = "🔄 Generating…";

    outputText.innerHTML =
      '<span class="email-spinner"></span><span>✉️ Generating your email...</span>';
    outputText.classList.add("loading");

    try {
      const response = await fetch(
        "https://mail-karo.onrender.com/api/generate-email",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: finalPrompt }),
        }
      );

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to generate email");

      outputText.classList.remove("loading");
      outputText.innerText = data.email;

      generateBtn.innerText = "🌟 Generated!";
    } catch (err) {
      outputText.classList.remove("loading");
      outputText.innerText = `⚠️ Error: ${err.message}`;
      outputText.style.color = "#FF6B6B";

      generateBtn.innerText = "❌ Try Again";
    }

    enableAll();
  };

  /* ⭐ Button Actions */
  generateBtn.addEventListener("click", () => generateEmail());
  regenerateBtn.addEventListener("click", () => {
    if (lastPrompt.trim() !== "") {
      generateEmail(lastPrompt, lastTone);
    }
  });

  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(outputText.innerText);
    copyBtn.innerText = "✓ Copied!";
    setTimeout(() => (copyBtn.innerText = "📋 Copy"), 1500);
  });

  resetBtn.addEventListener("click", () => {
    promptInput.value = "";
    outputText.innerText = "Your AI-generated email will appear here...";
    generateBtn.innerText = "⚡ Generate";
    promptInput.style.height = "50px";

    charCount.textContent = "0 chars";
    wordCount.textContent = "0 words";
  });
});

/* ⭐ Loading Animation */
const promptStyle = document.createElement("style");
promptStyle.innerHTML = `
.loading { animation: blink 0.8s infinite; }
@keyframes blink { 0%,100%{opacity:.5;} 50%{opacity:1;} }
`;
document.head.appendChild(promptStyle);
