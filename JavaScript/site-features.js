(() => {
  "use strict";
  const cfg = window.ELSEWHERE_CONFIG || {};
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const safeText = (value, max = 1000) =>
    String(value || "")
      .trim()
      .slice(0, max);

  // THEME CONTROL NOTE: restore the visitor's preference and provide a persistent light/dark toggle.
  const savedTheme = (() => {
    try {
      return localStorage.getItem("elsewhere-theme");
    } catch (_) {
      return null;
    }
  })();
  if (savedTheme === "dark") document.body.classList.add("ew-dark");
  const themeButton = document.createElement("button");
  themeButton.className = "ew-theme-toggle";
  themeButton.type = "button";
  themeButton.setAttribute("aria-label", "Switch to dark mode");
  themeButton.title = "Toggle light and dark mode";
  const updateThemeButton = () => {
    const dark = document.body.classList.contains("ew-dark");
    themeButton.textContent = dark ? "☀" : "☾";
    themeButton.setAttribute(
      "aria-label",
      dark ? "Switch to light mode" : "Switch to dark mode",
    );
    themeButton.title = dark ? "Switch to light mode" : "Switch to dark mode";
  };
  updateThemeButton();
  themeButton.addEventListener("click", () => {
    document.body.classList.toggle("ew-dark");
    const theme = document.body.classList.contains("ew-dark")
      ? "dark"
      : "light";
    try {
      localStorage.setItem("elsewhere-theme", theme);
    } catch (_) {}
    updateThemeButton();
  });
  document.body.appendChild(themeButton);

  // MUSIC CONTROL NOTES:
  // - The music icon only opens/closes the control panel; it does not mute music.
  // - We first attempt normal autoplay, then retry silently if browser policy blocks sound.
  // - When autoplay was blocked, the first interaction elsewhere on the page enables audio.
  //   This avoids forcing the visitor to press a separate “Unmute” button just to start music.
  // - Browsers can still restrict audible autoplay; site code cannot override that browser policy.
  const backgroundMusic = document.createElement("audio");
  backgroundMusic.id = "elsewhereBackgroundMusic";
  backgroundMusic.loop = true;
  backgroundMusic.autoplay = true;
  backgroundMusic.muted = false;
  backgroundMusic.volume = 0.35;
  backgroundMusic.preload = "auto";
  backgroundMusic.setAttribute("aria-label", "ElseWhere background music");
  const musicSource = document.createElement("source");
  musicSource.src = "../music/background-music.mp3";
  musicSource.type = "audio/mpeg";
  backgroundMusic.appendChild(musicSource);
  document.body.appendChild(backgroundMusic);

  const musicUi = document.createElement("div");
  musicUi.className = "ew-music-ui";
  musicUi.innerHTML = `
    <button type="button" class="ew-music-toggle" aria-label="Open music controls" aria-expanded="false" aria-controls="ewMusicControls" title="Music controls">♫</button>
    <section class="ew-music-controls" id="ewMusicControls" aria-label="Background music controls" aria-hidden="true">
      <div class="ew-music-heading">
        <span class="ew-music-heading-icon" aria-hidden="true">♫</span>
        <div class="ew-music-heading-copy"><strong>Background music</strong><span>Set the sound to your liking</span></div>
      </div>
      <button type="button" class="ew-music-mute" aria-label="Mute background music" aria-pressed="false">Mute music</button>
      <label class="ew-volume-row"><span class="ew-volume-label">Volume</span><input id="ewMusicVolume" class="ew-volume-slider" type="range" min="0" max="100" value="35" step="1" aria-label="Background music volume"></label>
      <p class="ew-music-status" id="ewMusicStatus" role="status" aria-live="polite">Trying to start the music automatically…</p>
    </section>`;
  document.body.appendChild(musicUi);

  const musicLauncher = musicUi.querySelector(".ew-music-toggle");
  const musicPanel = musicUi.querySelector(".ew-music-controls");
  const musicMuteButton = musicUi.querySelector(".ew-music-mute");
  const volumeSlider = musicUi.querySelector(".ew-volume-slider");
  const musicStatus = musicUi.querySelector(".ew-music-status");
  let waitingForFirstGesture = false;
  let musicFileFailed = false;

  // Update the visible player controls whenever audio state changes.
  const updateMusicControls = () => {
    const muted = backgroundMusic.muted || backgroundMusic.volume === 0;
    musicMuteButton.textContent = muted ? "Unmute music" : "Mute music";
    musicMuteButton.setAttribute(
      "aria-label",
      muted ? "Unmute background music" : "Mute background music",
    );
    musicMuteButton.setAttribute("aria-pressed", muted ? "false" : "true");
    volumeSlider.value = String(Math.round(backgroundMusic.volume * 100));
    if (musicFileFailed) {
      musicStatus.textContent =
        "Music file could not be loaded. Check music/background-music.mp3.";
    } else if (backgroundMusic.paused) {
      musicStatus.textContent =
        "Music is ready. Your browser may require a page interaction before it can play.";
    } else if (muted && waitingForFirstGesture) {
      musicStatus.textContent =
        "Music is running quietly. Interact with the page once to enable sound.";
    } else if (muted) {
      musicStatus.textContent = "Music is muted.";
    } else {
      musicStatus.textContent = "Music is playing.";
    }
  };

  const closeMusicPanel = () => {
    musicPanel.classList.remove("is-open");
    musicPanel.setAttribute("aria-hidden", "true");
    musicLauncher.setAttribute("aria-expanded", "false");
  };
  musicLauncher.addEventListener("click", () => {
    const willOpen = !musicPanel.classList.contains("is-open");
    if (willOpen) {
      musicPanel.classList.add("is-open");
      musicPanel.setAttribute("aria-hidden", "false");
      musicLauncher.setAttribute("aria-expanded", "true");
      updateMusicControls();
    } else {
      closeMusicPanel();
    }
  });
  musicMuteButton.addEventListener("click", async () => {
    if (backgroundMusic.paused) {
      try {
        await backgroundMusic.play();
      } catch (_) {
        /* Status below explains the state. */
      }
    }
    if (backgroundMusic.muted || backgroundMusic.volume === 0) {
      backgroundMusic.muted = false;
      if (backgroundMusic.volume === 0) backgroundMusic.volume = 0.35;
      waitingForFirstGesture = false;
    } else {
      backgroundMusic.muted = true;
    }
    updateMusicControls();
  });
  volumeSlider.addEventListener("input", () => {
    backgroundMusic.volume = Number(volumeSlider.value) / 100;
    backgroundMusic.muted = backgroundMusic.volume === 0;
    if (backgroundMusic.volume > 0) waitingForFirstGesture = false;
    updateMusicControls();
  });
  document.addEventListener("pointerdown", (event) => {
    // Opening the music panel should not immediately flip the visitor's choice.
    if (musicUi.contains(event.target)) return;
    if (!waitingForFirstGesture || musicFileFailed) return;
    backgroundMusic.muted = false;
    backgroundMusic
      .play()
      .then(() => {
        waitingForFirstGesture = false;
        updateMusicControls();
      })
      .catch(() => {
        backgroundMusic.muted = true;
        updateMusicControls();
      });
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && musicPanel.classList.contains("is-open")) {
      closeMusicPanel();
      musicLauncher.focus();
    }
    if (
      musicUi.contains(event.target) ||
      !waitingForFirstGesture ||
      musicFileFailed
    )
      return;
    backgroundMusic.muted = false;
    backgroundMusic
      .play()
      .then(() => {
        waitingForFirstGesture = false;
        updateMusicControls();
      })
      .catch(() => {
        backgroundMusic.muted = true;
        updateMusicControls();
      });
  });
  document.addEventListener("pointerdown", (event) => {
    if (!musicUi.contains(event.target)) closeMusicPanel();
  });
  backgroundMusic.addEventListener("playing", updateMusicControls);
  backgroundMusic.addEventListener("pause", updateMusicControls);
  backgroundMusic.addEventListener("volumechange", updateMusicControls);
  backgroundMusic.addEventListener("error", () => {
    musicFileFailed = true;
    waitingForFirstGesture = false;
    updateMusicControls();
  });

  // Try audible autoplay first; if blocked, start muted and enable sound on first page interaction.
  backgroundMusic
    .play()
    .then(() => {
      waitingForFirstGesture = false;
      updateMusicControls();
    })
    .catch(async () => {
      backgroundMusic.muted = true;
      waitingForFirstGesture = true;
      try {
        await backgroundMusic.play();
        updateMusicControls();
      } catch (_) {
        updateMusicControls();
      }
    });
  updateMusicControls();

  // ASK ELSEWHERE NOTE: the floating launcher and chat panel provide on-site travelogue help.
  const launcher = document.createElement("button");
  launcher.type = "button";
  launcher.className = "ew-chat-launcher";
  launcher.setAttribute("aria-label", "Open ElseWhere AI travel assistant");
  launcher.setAttribute("aria-expanded", "false");
  launcher.innerHTML =
    '<span class="ew-chat-orb" aria-hidden="true">✧</span><span>Ask ElseWhere<small>Travel assistant · Here to help</small></span>';
  const panel = document.createElement("section");
  panel.className = "ew-chat-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "ElseWhere travel assistant");
  panel.setAttribute("aria-modal", "false");
  panel.innerHTML =
    '<div class="ew-chat-head"><div class="ew-chat-avatar" aria-hidden="true">✧</div><div class="ew-chat-head-copy"><strong>ElseWhere Assistant</strong><span>Discover your next somewhere</span></div><button type="button" class="ew-chat-close" aria-label="Close chat">×</button></div><div class="ew-chat-messages" aria-live="polite" aria-relevant="additions text"></div><div class="ew-chat-quick"><button type="button" data-prompt="Show me local destinations">Local escapes</button><button type="button" data-prompt="Show me international destinations">Go abroad</button><button type="button" data-prompt="Give me budget travel tips">Budget tips</button><button type="button" data-prompt="Where can I leave feedback?">Give feedback</button><button type="button" data-prompt="What can you help me with?">What can you do?</button></div><form class="ew-chat-form"><input name="message" maxlength="800" placeholder="Ask about ElseWhere…" aria-label="Your message" autocomplete="off" required><button type="submit" aria-label="Send message">➤</button></form><div class="ew-chat-disclaimer">For travel planning inspiration. Confirm current prices, schedules, and local requirements before traveling.</div>';
  document.body.append(launcher, panel);
  const messages = $(".ew-chat-messages", panel),
    chatForm = $(".ew-chat-form", panel),
    chatInput = $('input[name="message"]', panel);
  let greeted = false;
  function addMessage(text, who = "bot") {
    const node = document.createElement("div");
    node.className = `ew-chat-message ${who}`;
    node.textContent = text;
    messages.appendChild(node);
    messages.scrollTop = messages.scrollHeight;
    return node;
  }
  function openChat() {
    panel.classList.add("is-open");
    launcher.setAttribute("aria-expanded", "true");
    if (!greeted) {
      addMessage(
        "Hi, traveler! ✨ I'm the ElseWhere assistant. Ask me about the destinations, travel guides, gallery, or how to use this website.",
      );
      greeted = true;
    }
    chatInput.focus();
  }
  function closeChat() {
    panel.classList.remove("is-open");
    launcher.setAttribute("aria-expanded", "false");
    launcher.focus();
  }
  launcher.addEventListener("click", () =>
    panel.classList.contains("is-open") ? closeChat() : openChat(),
  );
  $(".ew-chat-close", panel).addEventListener("click", closeChat);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && panel.classList.contains("is-open")) closeChat();
  });

  // LOCAL KNOWLEDGE BASE NOTE: these keyword/answer pairs let the assistant help without a server API.
  const knowledge = [
    {
      keys: [
        "what can you do",
        "help me",
        "help with",
        "capabilities",
        "what do you know",
        "how can you help",
      ],
      answer:
        "I can help you explore ElseWhere, compare local and international destinations, find the travel guide and gallery, explain feedback and dark mode, and suggest destination ideas based on your interests. I can share planning inspiration, but you should confirm current prices, opening hours, transport schedules, and travel requirements with official sources.",
    },
    {
      keys: [
        "what is elsewhere",
        "about elsewhere",
        "about us",
        "website about",
        "purpose",
        "mission",
        "what is this site",
        "what is this website",
      ],
      answer:
        "ElseWhere is a student-created travelogue for discovering destinations in the Philippines and around the world. It brings destination details, inspiration, a gallery, practical travel tips, and helpful website features together in one place.",
    },
    {
      keys: [
        "local destinations",
        "philippines",
        "local places",
        "places in the philippines",
        "local escape",
      ],
      answer:
        "Our Local Destinations include Mount Pulag in Benguet, Batanes, Isla Gigantes in Carles, Iloilo, Tawi-Tawi, Palawan, and Boracay. Scroll to Local Destinations and select any card to read more.",
    },
    {
      keys: [
        "international destinations",
        "abroad",
        "international places",
        "other countries",
        "world discovery",
        "go abroad",
      ],
      answer:
        "Our International Destinations include Chefchaouen in Morocco, Vatican City, Tromsø in northern Norway, France, Japan, and South Korea. Open a card in the International Destinations section to explore its details.",
    },
    {
      keys: [
        "destination",
        "places",
        "website have",
        "website offer",
        "all places",
        "all destinations",
      ],
      answer:
        "ElseWhere features 12 destinations: Mount Pulag, Batanes, Isla Gigantes, Tawi-Tawi, Palawan, Boracay, Chefchaouen, Vatican City, Tromsø, France, Japan, and South Korea. Use the destination cards or the magnifying-glass search in the main navigation.",
    },
    {
      keys: ["pulag", "mount pulag", "mountain", "hiking", "sea of clouds"],
      answer:
        "Mount Pulag in Benguet is known for highland landscapes and its famous sea of clouds. Hiking conditions can change quickly, so check current park rules, permits, weather, and accredited guide requirements before planning a trip.",
    },
    {
      keys: ["batanes", "ivatan"],
      answer:
        "Batanes is known for rolling green hills, stone houses, dramatic coastlines, and Ivatan culture. It is a good idea for travelers who prefer scenic landscapes and a quieter island atmosphere.",
    },
    {
      keys: ["gigantes", "iloilo", "island hopping", "isla gigantes"],
      answer:
        "Isla Gigantes is in Carles, Iloilo. Visitors often look forward to island-hopping, limestone scenery, beaches, and seafood. Check current boat schedules and weather with local operators before traveling.",
    },
    {
      keys: ["tawi-tawi", "tawi tawi"],
      answer:
        "Tawi-Tawi is a southern Philippine island province shaped by maritime heritage, island scenery, and distinctive local culture. Review current local travel advice, transport availability, and community guidance before arranging a visit.",
    },
    {
      keys: ["palawan", "lagoon", "limestone cliffs"],
      answer:
        "Palawan is known for limestone cliffs, clear lagoons, and island scenery. ElseWhere's Palawan page is a starting point for inspiration; confirm current tour availability, fees, and environmental guidelines with local providers.",
    },
    {
      keys: ["boracay", "white beach", "sunset sail"],
      answer:
        "Boracay is known for White Beach, clear water, sunset sails, and island dining. Check current local environmental rules and travel guidance before your visit.",
    },
    {
      keys: ["chefchaouen", "morocco", "blue city"],
      answer:
        "Chefchaouen is Morocco's famous blue-painted mountain town, known for blue-washed lanes, artisan shops, and mountain views. Open the Chefchaouen card for more inspiration.",
    },
    {
      keys: ["tromso", "tromsø", "norway", "aurora", "northern lights"],
      answer:
        "Tromsø in northern Norway is a popular base for Arctic scenery and seasonal northern-lights trips. Viewing depends on darkness, weather, and solar activity, so sightings can never be guaranteed.",
    },
    {
      keys: ["vatican", "rome", "st. peter", "saint peter"],
      answer:
        "Vatican City is an independent city-state within Rome, known for St. Peter's Basilica, St. Peter's Square, and the Vatican Museums. Check official visitor information for current access and ticket rules.",
    },
    {
      keys: ["france", "paris", "french"],
      answer:
        "The France destination page features ideas inspired by Paris, historic towns, art, cuisine, and the countryside. Confirm current attraction tickets, public transport, and opening hours before you go.",
    },
    {
      keys: ["japan", "kyoto", "tokyo", "japanese"],
      answer:
        "The Japan page highlights ideas such as temple paths, traditional streets, seasonal scenery, and modern city life. Plan by season and confirm current transport and entry requirements through official sources.",
    },
    {
      keys: ["korea", "south korea", "seoul", "korean"],
      answer:
        "The South Korea page offers inspiration around palace history, food markets, riverside walks, and modern city life, especially in Seoul. Check current travel requirements and transit details before you go.",
    },
    {
      keys: ["beach", "sea", "island", "swim", "snorkel"],
      answer:
        "For beach and island inspiration, explore Isla Gigantes, Palawan, Boracay, Batanes, and Tawi-Tawi in the Local Destinations section. Weather and sea conditions matter, so confirm safe activities and transport locally.",
    },
    {
      keys: ["culture", "history", "architecture", "museum", "food"],
      answer:
        "For culture, history, and architecture, explore Vatican City, Chefchaouen, France, Japan, South Korea, and Batanes. Each destination page gives a starting point for learning about its character and experiences.",
    },
    {
      keys: ["snow", "winter", "arctic", "cold", "northern"],
      answer:
        "Tromsø in northern Norway is the best match on ElseWhere for Arctic scenery, winter experiences, and possible northern-lights viewing. Dress for the season and check current forecasts and tour conditions.",
    },
    {
      keys: [
        "travel guide",
        "guide",
        "tips",
        "itinerary",
        "plan a trip",
        "planning",
      ],
      answer:
        "The Travel Guide section has focused tips for packing, budgeting, transportation, accommodation, the best time to travel, and photography. Start with your travel dates, then estimate transport, accommodation, food, activities, and a small emergency fund. Prices and requirements change, so verify them before booking.",
    },
    {
      keys: ["packing", "pack", "luggage", "suitcase"],
      answer:
        "Open Travel Guide → What to Pack for the site's packing tips. In general, plan for the forecast and activities, and bring comfortable footwear, weather-appropriate layers, identification, chargers, personal essentials, and any required medication.",
    },
    {
      keys: ["budget", "cheap", "affordable", "save money", "expense", "cost"],
      answer:
        "Open Travel Guide → Budget Travel Tips. Compare transport and accommodation before booking, set a daily food and activity budget, prioritize what matters most, and keep emergency funds. I can't promise exact prices because costs change by date and provider.",
    },
    {
      keys: [
        "transport",
        "transportation",
        "commute",
        "bus",
        "boat",
        "flight",
        "getting there",
      ],
      answer:
        "Open Travel Guide → Transportation for general planning ideas. Check official route information, current schedules, fares, baggage rules, and weather-related changes with the relevant transport provider.",
    },
    {
      keys: [
        "accommodation",
        "hotel",
        "hostel",
        "where to stay",
        "place to stay",
      ],
      answer:
        "Open Travel Guide → Accommodation for tips. Compare location, price, cleanliness, facilities, and recent reviews, then confirm check-in details and cancellation terms directly with the property.",
    },
    {
      keys: ["best time", "when to go", "season", "weather", "best month"],
      answer:
        "Open Travel Guide → Best Time to Travel. The best season depends on the destination and your activities. Check official forecasts and local guidance for your exact dates; weather and seasonal services can change.",
    },
    {
      keys: ["photography", "camera", "photo tips", "taking photos"],
      answer:
        "Open Travel Guide → Photography Tips for advice on light and viewpoints. Be respectful when photographing people, follow posted rules at attractions, and ask permission when appropriate.",
    },
    {
      keys: ["gallery", "photo", "image", "picture", "filter"],
      answer:
        "The Gallery section collects destination imagery. Use the category filters to narrow the gallery to a place, then open any tile to visit that destination's detail page.",
    },
    {
      keys: [
        "feedback",
        "review",
        "rating",
        "star",
        "comment",
        "rate the website",
        "give feedback",
      ],
      answer:
        "Use Feedback in the main navigation or scroll to the feedback section just after the Gallery. Select one to five stars, add a comment, and press Post feedback. When shared review storage is not configured, your review is saved only in this browser and device.",
    },
    {
      keys: ["dark mode", "light mode", "theme", "appearance", "moon", "sun"],
      answer:
        "Use the floating moon/sun button near the bottom-right corner to switch between light and dark mode. Your preference is saved in this browser when local storage is available.",
    },
    {
      keys: ["search", "find", "look for", "magnifying", "search destination"],
      answer:
        "Select the magnifying-glass button in the main navigation, then type a destination, country, or travel style. You can also browse the Local and International sections directly.",
    },
    {
      keys: ["team", "who made", "members", "student", "project team"],
      answer:
        "ElseWhere is made by a five-member student team. The Our Team section describes these five project roles: Project Leader, Asst. Leader/Programmer, Web Designer/Researcher, Content Manager/Researcher, and Document Officer/Researcher. Replace the generic member labels with your actual names before presenting the website.",
    },
    {
      keys: [
        "contact",
        "email",
        "message the team",
        "social media",
        "instagram",
        "facebook",
      ],
      answer:
        "The Contact Us section lists the project's email and social media handles and includes a message form. Please note the current contact form is a demo and does not actually send messages unless it is connected to a form service or backend.",
    },
    {
      keys: ["faq", "question", "frequently asked"],
      answer:
        "The Frequently Asked Questions section is below About Us and covers what ElseWhere is, what destinations it features, and where to find travel tips and contact information.",
    },
    {
      keys: [
        "hello",
        "hi",
        "hey",
        "good morning",
        "good evening",
        "good afternoon",
      ],
      answer:
        "Hello, traveler! ✨ I can help you explore destinations, choose a place by travel style, find the travel guides or gallery, leave feedback, use search, or switch themes. Where shall we start?",
    },
    {
      keys: ["thank", "thanks", "thank you"],
      answer:
        "You're welcome! ✨ Happy exploring. Ask me about a destination, trip-planning topic, or any feature on ElseWhere.",
    },
  ];
  function localAnswer(question) {
    const q = question
      .toLocaleLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    if (/\b(current page|this page|page am i on)\b/.test(q))
      return `You're currently viewing ${document.title || "ElseWhere"}. Use the navigation to explore destinations, the gallery, travel guides, feedback, and more.`;
    const match = knowledge.find((item) =>
      item.keys.some((k) =>
        q.includes(k.normalize("NFD").replace(/[\u0300-\u036f]/g, "")),
      ),
    );
    if (match) return match.answer;
    if (/\b(best|recommend|recommendation|suggest)\b/.test(q))
      return "I can help you choose a destination. For beaches and islands, try Boracay, Palawan, or Isla Gigantes; for mountains and hiking, try Mount Pulag; for history and culture, try Vatican City, France, Japan, or South Korea; for Arctic scenery, try Tromsø. Tell me what kind of trip you prefer and I can narrow it down.";
    if (/\b(itinerary|3 day|three day|weekend|days trip)\b/.test(q))
      return "I can help with a starting itinerary. Tell me which destination, how many days you have, and what you enjoy. Check travel times, local weather, opening hours, and current availability before finalizing the plan.";
    return "I can help you explore ElseWhere's 12 destinations, find travel guides, compare destination styles, use the gallery and search, leave feedback, contact the team, and switch themes. I couldn't confidently match that question to the site's information. Try including a destination name or asking about budget, transport, packing, accommodation, or the best time to travel.";
  }
  async function askAssistant(question, bubble, history = []) {
    const endpoint = safeText(cfg.aiEndpoint, 300);
    if (endpoint) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: question,
            history: history.slice(-10),
            page: location.pathname,
            title: document.title,
          }),
          signal: AbortSignal.timeout(18000),
        });
        if (!response.ok)
          throw new Error(`AI service returned ${response.status}`);
        const data = await response.json();
        if (data && typeof data.reply === "string" && data.reply.trim()) {
          bubble.textContent = data.reply.trim().slice(0, 5000);
          messages.scrollTop = messages.scrollHeight;
          return;
        }
      } catch (err) {}
    }
    bubble.textContent = localAnswer(question);
    messages.scrollTop = messages.scrollHeight;
  }
  async function submitQuestion(value) {
    const question = safeText(value, 800);
    if (!question) return;
    const history = $$(".ew-chat-message", messages)
      .map((node) => ({
        role: node.classList.contains("user") ? "user" : "assistant",
        content: node.textContent,
      }))
      .slice(-10);
    addMessage(question, "user");
    chatInput.value = "";
    const bubble = addMessage("Let me check that for you…", "bot");
    await askAssistant(question, bubble, history);
  }
  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    submitQuestion(chatInput.value);
  });
  $$("[data-prompt]", panel).forEach((btn) =>
    btn.addEventListener("click", () => submitQuestion(btn.dataset.prompt)),
  );

  // FEEDBACK NOTE: validates visitor ratings/comments, saves locally by default, and uses Supabase only when configured.
  const form = $("#feedbackForm"),
    reviewsGrid = $("#reviewsGrid");
  if (form && reviewsGrid) {
    const status = $("#feedbackStatus"),
      comment = $("#feedbackComment"),
      charCount = $("#feedbackCharCount"),
      summary = $("#feedbackSummary"),
      note = $("#reviewsNote");
    const hasSupabase =
      /^https:\/\//.test(cfg.supabaseUrl || "") && !!cfg.supabaseAnonKey;
    const localKey = "elsewhere-feedback-v1";
    comment.addEventListener("input", () => {
      charCount.textContent = String(comment.value.length);
    });
    function dateLabel(date) {
      const d = new Date(date);
      return Number.isNaN(d.getTime())
        ? "Recently"
        : d.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          });
    }
    function renderReviews(items) {
      reviewsGrid.replaceChildren();
      const valid = (items || [])
        .filter(
          (x) =>
            Number(x.rating) >= 1 &&
            Number(x.rating) <= 5 &&
            safeText(x.comment, 1000),
        )
        .slice(0, 30);
      summary.textContent = valid.length
        ? `${valid.length} ${valid.length === 1 ? "review" : "reviews"} shared`
        : "Be the first to share your experience.";
      if (!valid.length) {
        const empty = document.createElement("div");
        empty.className = "ew-empty-reviews";
        empty.textContent =
          "Your story could be the first one here. Leave a rating and help us improve.";
        reviewsGrid.appendChild(empty);
        return;
      }
      valid.forEach((item) => {
        const card = document.createElement("article");
        card.className = "review-card";
        const stars = document.createElement("div");
        stars.className = "review-stars";
        stars.setAttribute("aria-label", `${item.rating} out of 5 stars`);
        stars.textContent =
          "★".repeat(Number(item.rating)) + "☆".repeat(5 - Number(item.rating));
        const name = document.createElement("h4");
        name.textContent = safeText(item.name, 60) || "A traveler";
        const text = document.createElement("p");
        text.textContent = safeText(item.comment, 1000);
        const time = document.createElement("time");
        time.dateTime = item.created_at || new Date().toISOString();
        time.textContent = dateLabel(item.created_at || Date.now());
        card.append(stars, name, text, time);
        reviewsGrid.appendChild(card);
      });
    }
    function localReviews() {
      try {
        const v = JSON.parse(localStorage.getItem(localKey) || "[]");
        return Array.isArray(v) ? v : [];
      } catch (_) {
        return [];
      }
    }
    async function loadReviews() {
      const local = localReviews();
      if (hasSupabase) {
        try {
          const url = `${cfg.supabaseUrl.replace(/\/$/, "")}/rest/v1/feedback?select=name,rating,comment,created_at&order=created_at.desc&limit=30`;
          const res = await fetch(url, {
            headers: {
              apikey: cfg.supabaseAnonKey,
              Authorization: `Bearer ${cfg.supabaseAnonKey}`,
            },
          });
          if (!res.ok) throw new Error("Could not load shared reviews");
          const remote = await res.json();
          const combined = [...local, ...(Array.isArray(remote) ? remote : [])];
          const seen = new Set();
          const unique = combined
            .filter((item) => {
              const key = `${safeText(item.name, 60)}|${Number(item.rating)}|${safeText(item.comment, 1000)}|${item.created_at || ""}`;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            })
            .sort(
              (a, b) =>
                new Date(b.created_at || 0) - new Date(a.created_at || 0),
            )
            .slice(0, 30);
          renderReviews(unique);
          note.textContent =
            "Shared reviews are shown here. Reviews posted on this device remain visible here too.";
          return;
        } catch (_) {
          status.textContent =
            "Shared reviews are temporarily unavailable. Showing feedback saved on this device.";
        }
      }
      renderReviews(local);
    }
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const chosen = $("input[name=rating]:checked", form);
      const rating = chosen ? Number(chosen.value) : 0;
      const name = safeText($("#feedbackName").value, 60);
      const message = safeText(comment.value, 1000);
      if (rating < 1 || rating > 5 || !message) {
        status.textContent = "Please choose a star rating and write a comment.";
        return;
      }
      const entry = {
        name: name || "A traveler",
        rating,
        comment: message,
        created_at: new Date().toISOString(),
      };
      const button = $(".feedback-submit", form);
      button.disabled = true;
      button.textContent = "Posting…";
      try {
        const entries = localReviews();
        entries.unshift(entry);
        try {
          localStorage.setItem(localKey, JSON.stringify(entries.slice(0, 30)));
        } catch (_) {
          if (!hasSupabase)
            throw new Error(
              "Your browser could not save the review. Check its storage settings and try again.",
            );
        }
        renderReviews(entries);
        if (hasSupabase) {
          const url = `${cfg.supabaseUrl.replace(/\/$/, "")}/rest/v1/feedback`;
          const res = await fetch(url, {
            method: "POST",
            headers: {
              apikey: cfg.supabaseAnonKey,
              Authorization: `Bearer ${cfg.supabaseAnonKey}`,
              "Content-Type": "application/json",
              Prefer: "return=minimal",
            },
            body: JSON.stringify({
              name: entry.name,
              rating: entry.rating,
              comment: entry.comment,
            }),
          });
          if (!res.ok) {
            status.textContent =
              "Your feedback is visible on this device, but sharing it with other visitors failed. Please try again later.";
          } else {
            status.textContent =
              "Thank you! Your feedback is posted below and shared with other visitors.";
            await loadReviews();
          }
        } else {
          status.textContent =
            "Thanks for your feedback! Your review is posted below and saved on this device.";
        }
        form.reset();
        charCount.textContent = "0";
        const firstReview = reviewsGrid.querySelector(".review-card");
        if (firstReview)
          firstReview.scrollIntoView({ behavior: "smooth", block: "center" });
        else
          reviewsGrid.scrollIntoView({ behavior: "smooth", block: "center" });
      } catch (err) {
        status.textContent =
          err.message || "Something went wrong. Please try again.";
      } finally {
        button.disabled = false;
        button.innerHTML = 'Post feedback <span aria-hidden="true">↗</span>';
      }
    });
    loadReviews();
  }
})();
