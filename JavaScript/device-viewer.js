// DEVICE PREVIEW NOTE: adds the Desktop / Tablet / Phone preview menu to headers and opens each size in a preview frame.
(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.has("deviceview"))
    document.documentElement.classList.add("device-preview-embedded");

  function make(tag, className, attrs = {}) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    Object.entries(attrs).forEach(([key, value]) =>
      el.setAttribute(key, value),
    );
    return el;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const header = document.querySelector(".header, .destination-header");
    if (
      header &&
      !document.querySelector(".device-switcher") &&
      !params.has("deviceview")
    ) {
      header.classList.add("has-device-switcher");
      const wrap = make("div", "device-switcher");
      const trigger = make("button", "device-menu-button", {
        type: "button",
        "aria-label": "Choose device preview",
        "aria-expanded": "false",
        "aria-haspopup": "true",
      });
      trigger.innerHTML = "<span></span><span></span><span></span>";
      const menu = make("div", "device-switcher-menu", {
        role: "menu",
        hidden: "",
      });
      menu.innerHTML = `
        <p>Preview this page</p>
        <button type="button" role="menuitem" data-device="desktop"><span class="device-option-icon">▭</span><span class="device-option-label">Desktop<small>Wide screen</small></span></button>
        <button type="button" role="menuitem" data-device="tablet"><span class="device-option-icon">▯</span><span class="device-option-label">Tablet<small>768 px preview</small></span></button>
        <button type="button" role="menuitem" data-device="phone"><span class="device-option-icon">▯</span><span class="device-option-label">Phone<small>390 px preview</small></span></button>`;
      wrap.append(trigger, menu);
      header.appendChild(wrap);

      const closeMenu = () => {
        menu.hidden = true;
        trigger.setAttribute("aria-expanded", "false");
      };
      trigger.addEventListener("click", () => {
        menu.hidden = !menu.hidden;
        trigger.setAttribute("aria-expanded", menu.hidden ? "false" : "true");
      });
      document.addEventListener("click", (event) => {
        if (!wrap.contains(event.target)) closeMenu();
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeMenu();
      });

      let overlay = document.querySelector(".device-preview-overlay");
      if (!overlay) {
        overlay = make("div", "device-preview-overlay", {
          role: "dialog",
          "aria-modal": "true",
          "aria-label": "Responsive device preview",
        });
        overlay.innerHTML = `
          <div class="device-preview-dialog">
            <div class="device-preview-topbar"><div><strong class="device-preview-title">Desktop preview</strong><small>Previewing this page at a different screen size</small></div><button type="button" class="device-preview-close" aria-label="Close preview">×</button></div>
            <div class="device-preview-stage"><iframe class="device-preview-frame" title="Responsive website preview" loading="lazy"></iframe></div>
          </div>`;
        document.body.appendChild(overlay);
      }
      const frame = overlay.querySelector(".device-preview-frame");
      const title = overlay.querySelector(".device-preview-title");
      const close = overlay.querySelector(".device-preview-close");
      let previousFocus = null;

      const closePreview = () => {
        overlay.classList.remove("is-open");
        frame.src = "about:blank";
        document.body.style.overflow = "";
        if (previousFocus) previousFocus.focus();
      };
      close.addEventListener("click", closePreview);
      overlay.addEventListener("click", (event) => {
        if (event.target === overlay) closePreview();
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && overlay.classList.contains("is-open"))
          closePreview();
      });

      menu.querySelectorAll("[data-device]").forEach((option) => {
        option.addEventListener("click", () => {
          const device = option.dataset.device;
          closeMenu();
          previousFocus = trigger;
          const previewUrl = new URL(window.location.href);
          previewUrl.search = "";
          previewUrl.searchParams.set("deviceview", device);
          previewUrl.hash = window.location.hash;
          title.textContent = `${device[0].toUpperCase()}${device.slice(1)} preview`;
          frame.dataset.device = device;
          frame.src = previewUrl.toString();
          overlay.classList.add("is-open");
          document.body.style.overflow = "hidden";
          close.focus();
        });
      });
    }
  });
})();
