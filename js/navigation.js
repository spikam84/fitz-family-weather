(() => {
  const menuTrigger = document.querySelector(".menu-icon");
  if (!menuTrigger) return;

  const button = document.createElement("button");
  button.className = "menu-icon";
  button.type = "button";
  button.setAttribute("aria-label", "Open navigation menu");
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", "site-navigation");
  button.textContent = "☰";
  menuTrigger.replaceWith(button);

  const overlay = document.createElement("div");
  overlay.className = "site-menu-overlay";
  overlay.hidden = true;
  overlay.innerHTML = `
    <aside class="site-menu" id="site-navigation" aria-label="Main navigation">
      <div class="site-menu-header">
        <div>
          <strong>FITZ WEATHER HQ</strong>
          <span>Choose a page</span>
        </div>
        <button class="site-menu-close" type="button" aria-label="Close navigation menu">×</button>
      </div>
      <nav class="site-menu-links">
        <a href="index.html" data-page="index.html"><span>🏠</span><div><strong>Home</strong><small>Family weather dashboard</small></div></a>
        <a href="storm.html" data-page="storm.html"><span>⛈️</span><div><strong>Storm Center</strong><small>Radar, alerts, and storm tracking</small></div></a>
        <a href="garden.html" data-page="garden.html"><span>🌿</span><div><strong>Garden Center</strong><small>Garden and lawn conditions</small></div></a>
        <a href="boating.html" data-page="boating.html"><span>🚤</span><div><strong>Boating Center</strong><small>Wind, visibility, and water safety</small></div></a>
      </nav>
    </aside>
  `;
  document.body.appendChild(overlay);

  const closeButton = overlay.querySelector(".site-menu-close");
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const currentLink = overlay.querySelector(`[data-page="${currentPage}"]`);
  if (currentLink) {
    currentLink.classList.add("active");
    currentLink.setAttribute("aria-current", "page");
  }

  function openMenu() {
    overlay.hidden = false;
    document.body.classList.add("menu-open");
    button.setAttribute("aria-expanded", "true");
    closeButton.focus();
  }

  function closeMenu() {
    overlay.hidden = true;
    document.body.classList.remove("menu-open");
    button.setAttribute("aria-expanded", "false");
    button.focus();
  }

  button.addEventListener("click", openMenu);
  closeButton.addEventListener("click", closeMenu);
  overlay.addEventListener("click", event => {
    if (event.target === overlay) closeMenu();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !overlay.hidden) closeMenu();
  });
})();
