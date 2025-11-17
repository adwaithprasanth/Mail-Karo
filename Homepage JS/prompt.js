document.addEventListener("DOMContentLoaded", () => {
  const generateBtn = document.getElementById("generateBtn");
  const promptInput = document.getElementById("promptInput");
  const outputText = document.getElementById("outputText");

  const copyBtn = document.getElementById("copyBtn");
  const resetBtn = document.getElementById("resetBtn");
  const regenerateBtn = document.getElementById("regenerateBtn");

  const toneSelect = document.getElementById("toneSelect");

  let lastPrompt = "";
  let lastTone = "";

  generateBtn.innerText = "⚡ Generate";

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

  /* ⭐ Common Disable Function */
  function disableAll() {
    generateBtn.disabled = true;
    regenerateBtn.disabled = true;
    promptInput.disabled = true;
    toneSelect.disabled = true;

    generateBtn.style.cursor = "not-allowed";
    regenerateBtn.style.cursor = "not-allowed";
  }

  /* ⭐ Common Enable Function */
  function enableAll() {
    generateBtn.disabled = false;
    regenerateBtn.disabled = false;
    promptInput.disabled = false;
    toneSelect.disabled = false;

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

    // Spinner
    if (!document.getElementById("email-spinner-style")) {
      const s = document.createElement("style");
      s.id = "email-spinner-style";
      s.innerHTML = `
      .email-spinner { display:inline-block; width:16px; height:16px;
               border:2px solid rgba(255,255,255,0.2);
               border-top-color:#EAEAEA; border-radius:50%;
               animation:spin 1s linear infinite; margin-right:8px;
               vertical-align:middle; }
      @keyframes spin { to { transform: rotate(360deg); } }
      `;
      document.head.appendChild(s);
    }

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

  /* ⭐ Button Clicks */
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
