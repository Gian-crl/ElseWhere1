// Filter gallery tiles by destination and keep the View more control in sync.
let galleryExpanded = false;
function updateGalleryVisibility(category = "all") {
  const items = [...document.querySelectorAll(".gallery-item")];
  const buttons = [...document.querySelectorAll(".filter-btn")];
  const shownPerPlace = new Map();
  let shown = 0;
  items.forEach((item) => {
    const place = [...item.classList].find(
      (name) =>
        name !== "gallery-item" && !name.startsWith("gallery-variation-"),
    );
    const matches = category === "all" || item.classList.contains(category);
    const placeCount = shownPerPlace.get(place) || 0;
    const visible = matches && (galleryExpanded || placeCount < 5);
    item.hidden = !visible;
    if (matches) shownPerPlace.set(place, placeCount + 1);
    if (visible) shown++;
  });
  buttons.forEach((button) => {
    const active = button
      .getAttribute("onclick")
      ?.includes(`filterGallery('${category}'`);
    button.classList.toggle("active", !!active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
  const more = document.getElementById("galleryViewMore");
  const count = document.getElementById("galleryCount");
  if (more) {
    more.hidden = category !== "all";
    more.textContent = galleryExpanded
      ? "Show fewer images"
      : "View more images";
    more.setAttribute("aria-expanded", galleryExpanded ? "true" : "false");
  }
  if (count)
    count.textContent =
      category === "all"
        ? galleryExpanded
          ? `Showing all ${shown} gallery images.`
          : `Showing 5 images per destination. Select “View more images” to load the rest.`
        : `Showing images for ${category.replaceAll("-", " ")}.`;
}
function filterGallery(category, button) {
  galleryExpanded = false;
  updateGalleryVisibility(category);
  if (button) {
    document
      .querySelectorAll(".filter-btn")
      .forEach((item) => item.classList.toggle("active", item === button));
  }
}

function openGuide(type) {
  const popup = document.getElementById("guidePopup");
  const title = document.getElementById("guideTitle");
  const content = document.getElementById("guideContent");
  if (!popup || !title || !content) return;

  const guides = {
    packing: [
      "What to Pack",
      [
        "Pack clothes that fit the weather and activities planned for your trip.",
        "Bring comfortable shoes, personal hygiene items, identification, chargers, and any essential medication.",
        "Keep important items together in a small day bag.",
      ],
    ],
    budget: [
      "Budget Travel Tips",
      [
        "Plan your expenses before traveling so you can spend with confidence.",
        "Compare transport and accommodation options, then set a realistic daily budget.",
        "Choose local food and prioritize the experiences that matter most to you.",
      ],
    ],
    transportation: [
      "Transportation",
      [
        "Review available transport options before you arrive.",
        "Compare routes, schedules, fares, and travel times to avoid unnecessary delays.",
        "Keep a backup plan for late services or weather-related changes.",
      ],
    ],
    accommodation: [
      "Accommodation",
      [
        "Choose a stay based on location, price, cleanliness, facilities, and reviews.",
        "Staying near attractions or transport can make a trip easier.",
        "Confirm cancellation terms and arrival details before booking.",
      ],
    ],
    "best-time": [
      "Best Time to Travel",
      [
        "The best time to visit depends on weather, seasonal activities, and local events.",
        "Check forecasts and official information before choosing dates.",
        "Traveling outside busy periods may help you avoid crowds, though some services may have shorter hours.",
      ],
    ],
    photography: [
      "Photography Tips",
      [
        "Look for natural light and try different viewpoints to capture a place well.",
        "Photograph local architecture, food, landscapes, and memorable moments respectfully.",
        "Ask permission before photographing people and follow posted rules at attractions.",
      ],
    ],
  };
  const guide = guides[type];
  if (!guide) return;
  title.textContent = guide[0];
  content.replaceChildren(
    ...guide[1].map((paragraph) => {
      const p = document.createElement("p");
      p.textContent = paragraph;
      return p;
    }),
  );
  popup.style.display = "flex";
}

function closeGuide() {
  const popup = document.getElementById("guidePopup");
  if (popup) popup.style.display = "none";
}

document.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("guidePopup");
  if (popup)
    popup.addEventListener("click", (event) => {
      if (event.target === popup) closeGuide();
    });

  document.querySelectorAll(".filter-btn").forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      button.classList.contains("active") ? "true" : "false",
    );
  });
  const moreButton = document.getElementById("galleryViewMore");
  if (moreButton)
    moreButton.addEventListener("click", () => {
      galleryExpanded = !galleryExpanded;
      updateGalleryVisibility(
        document
          .querySelector(".filter-btn.active")
          ?.getAttribute("onclick")
          ?.match(/filterGallery\('([^']+)'/)?.[1] || "all",
      );
    });
  updateGalleryVisibility("all");
});

document.addEventListener("DOMContentLoaded", () => {
  const year = document.getElementById("footer-year");
  if (year) year.textContent = new Date().getFullYear();
  const form = document.getElementById("contactForm");
  if (form)
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      alert(
        "Thanks for your message. This demo form is not connected to an email service yet, so the message was not sent.",
      );
      form.reset();
    });
});

function openDestinationSearch() {
  const overlay = document.getElementById("destinationSearchOverlay");
  const input = document.getElementById("destinationSearchInput");
  if (!overlay || !input) return;
  overlay.hidden = false;
  document.body.style.overflow = "hidden";
  renderDestinationSearch(input.value);
  input.focus();
}

function closeDestinationSearch() {
  const overlay = document.getElementById("destinationSearchOverlay");
  const input = document.getElementById("destinationSearchInput");
  if (!overlay) return;
  overlay.hidden = true;
  document.body.style.overflow = "";
  if (input) input.value = "";
  const searchButton = document.querySelector(".search");
  if (searchButton) searchButton.focus();
}

function renderDestinationSearch(query = "") {
  const results = document.getElementById("destinationSearchResults");
  const hint = document.getElementById("destinationSearchHint");
  if (!results || !hint) return;
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const cards = Array.from(document.querySelectorAll(".destination-card"));
  const matches = cards.filter((card) =>
    card.innerText.toLocaleLowerCase().includes(normalizedQuery),
  );
  results.replaceChildren();
  hint.textContent = normalizedQuery
    ? `${matches.length} ${matches.length === 1 ? "destination" : "destinations"} found`
    : `Explore all ${cards.length} destinations or type to narrow the list.`;

  if (!matches.length) {
    const empty = document.createElement("p");
    empty.className = "destination-search-empty";
    empty.textContent =
      "No matches yet. Try a place name, country, or travel style.";
    results.appendChild(empty);
    return;
  }

  matches.forEach((card) => {
    const link = document.createElement("a");
    link.className = "destination-search-result";
    link.href = card.getAttribute("href");
    const copy = document.createElement("span");
    copy.className = "destination-search-result-copy";
    const title = document.createElement("strong");
    title.textContent =
      card.querySelector("h3")?.textContent.trim() || "Destination";
    const location = document.createElement("small");
    location.textContent =
      card.querySelector(".location")?.innerText.trim() ||
      "Explore destination";
    copy.append(title, location);
    const arrow = document.createElement("span");
    arrow.className = "destination-search-result-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "↗";
    link.append(copy, arrow);
    results.appendChild(link);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.getElementById("destinationSearchOverlay");
  const input = document.getElementById("destinationSearchInput");
  if (!overlay || !input) return;
  input.addEventListener("input", () => renderDestinationSearch(input.value));
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeDestinationSearch();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !overlay.hidden) closeDestinationSearch();
  });
});
