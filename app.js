/* The Moongate Vault — public site.
   Renders catalog.json, the JSON document exported from the private Vault
   space. No logins here: downloads link out to the artist's own host. */

(function () {
  "use strict";

  var state = {
    catalog: null,
    activeCategory: "all",
    query: "",
    sort: "newest"
  };

  var els = {};

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function hostLabel(url) {
    if (!url) return "";
    try {
      var host = new URL(url).hostname.replace(/^www\./, "");
      if (host.indexOf("github") !== -1) return "GitHub";
      if (host.indexOf("drive.google") !== -1) return "Google Drive";
      if (host.indexOf("terabox") !== -1) return "Terabox";
      if (host.indexOf("dropbox") !== -1) return "Dropbox";
      if (host.indexOf("mega.nz") !== -1) return "MEGA";
      if (host.indexOf("mediafire") !== -1) return "MediaFire";
      return host;
    } catch (e) {
      return "External";
    }
  }

  function categoryBySlug(slug) {
    var cats = (state.catalog && state.catalog.categories) || [];
    for (var i = 0; i < cats.length; i++) {
      if (cats[i].slug === slug) return cats[i];
    }
    return null;
  }

  function categoryName(slug) {
    var cat = categoryBySlug(slug);
    return cat ? cat.name : slug;
  }

  function formatDate(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  }

  function filteredAssets() {
    var assets = ((state.catalog && state.catalog.assets) || []).slice();
    if (state.activeCategory !== "all") {
      assets = assets.filter(function (a) { return a.categorySlug === state.activeCategory; });
    }
    var q = state.query.trim().toLowerCase();
    if (q) {
      assets = assets.filter(function (a) {
        var hay = [a.title, a.artist, a.description, (a.tags || []).join(" "), categoryName(a.categorySlug)]
          .join(" ").toLowerCase();
        return hay.indexOf(q) !== -1;
      });
    }
    if (state.sort === "downloads") {
      assets.sort(function (a, b) { return (b.downloads || 0) - (a.downloads || 0); });
    } else if (state.sort === "name") {
      assets.sort(function (a, b) { return String(a.title).localeCompare(String(b.title)); });
    } else {
      assets.sort(function (a, b) { return String(b.createdAt || "").localeCompare(String(a.createdAt || "")); });
    }
    return assets;
  }

  function thumbHtml(asset, size) {
    var cat = categoryBySlug(asset.categorySlug);
    var sigil = cat ? cat.sigil : "✦";
    if (asset.thumbnailUrl) {
      return '<img src="' + esc(asset.thumbnailUrl) + '" alt="Preview of ' + esc(asset.title) + '" loading="lazy">';
    }
    return '<span class="thumb-sigil" aria-hidden="true">' + esc(sigil) + "</span>";
  }

  function renderGates() {
    var cats = (state.catalog && state.catalog.categories) || [];
    var assets = (state.catalog && state.catalog.assets) || [];
    var counts = {};
    assets.forEach(function (a) { counts[a.categorySlug] = (counts[a.categorySlug] || 0) + 1; });
    var html = "";
    html += gateHtml("all", "✦", "All Works", assets.length, state.activeCategory === "all");
    cats.forEach(function (c) {
      html += gateHtml(c.slug, c.sigil, c.name, counts[c.slug] || 0, state.activeCategory === c.slug);
    });
    els.gates.innerHTML = html;
    els.gates.querySelectorAll(".gate").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.activeCategory = btn.getAttribute("data-slug");
        renderGates();
        renderGrid();
      });
    });
  }

  function gateHtml(slug, sigil, name, count, active) {
    return '<button type="button" class="gate' + (active ? " active" : "") + '" data-slug="' + esc(slug) + '">' +
      '<span class="sigil" aria-hidden="true">' + esc(sigil) + "</span>" +
      '<span class="gate-name">' + esc(name) + "</span>" +
      '<span class="gate-count">' + count + (count === 1 ? " work" : " works") + "</span>" +
      "</button>";
  }

  function renderGrid() {
    var assets = filteredAssets();
    if (!assets.length) {
      els.grid.innerHTML = "";
      els.emptyState.hidden = false;
      var cat = state.activeCategory === "all" ? null : categoryBySlug(state.activeCategory);
      els.emptyText.textContent = state.query
        ? "Nothing in the vault matches that search."
        : cat
          ? "Nothing in " + cat.name + " yet — the Keeper has not placed a work here."
          : "The vault awaits its first works.";
      return;
    }
    els.emptyState.hidden = true;
    els.grid.innerHTML = assets.map(function (a) {
      var tags = (a.tags || []).slice(0, 4).map(function (t) {
        return '<span class="tag">' + esc(t) + "</span>";
      }).join("");
      return '<article class="card" data-id="' + esc(a.id) + '" tabindex="0">' +
        '<div class="card-thumb">' + thumbHtml(a) + "</div>" +
        '<div class="card-body">' +
        "<h3>" + esc(a.title) + "</h3>" +
        '<p class="card-artist">by ' + esc(a.artist) + "</p>" +
        '<p class="card-meta"><span>' + esc(categoryName(a.categorySlug)) + "</span>" +
        "<span>" + (a.downloads || 0) + " downloads</span>" +
        (a.format ? "<span>" + esc(a.format) + "</span>" : "") + "</p>" +
        (tags ? '<p class="card-tags">' + tags + "</p>" : "") +
        "</div></article>";
    }).join("");
    els.grid.querySelectorAll(".card").forEach(function (card) {
      card.addEventListener("click", function () { openModal(card.getAttribute("data-id")); });
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openModal(card.getAttribute("data-id")); }
      });
    });
  }

  function renderCounts() {
    var assets = (state.catalog && state.catalog.assets) || [];
    var artists = {};
    assets.forEach(function (a) { if (a.artist) artists[a.artist] = true; });
    var n = Object.keys(artists).length;
    els.heroCounts.textContent = assets.length
      ? assets.length + (assets.length === 1 ? " work" : " works") + " · " + n + (n === 1 ? " artist" : " artists")
      : "The vault awaits its first works.";
  }

  function renderPosts() {
    var posts = ((state.catalog && state.catalog.posts) || []).slice();
    posts.sort(function (a, b) { return String(b.publishedAt || "").localeCompare(String(a.publishedAt || "")); });
    if (!posts.length) {
      els.postList.innerHTML = "";
      els.postsEmpty.hidden = false;
      return;
    }
    els.postsEmpty.hidden = true;
    els.postList.innerHTML = posts.map(function (p) {
      return '<article class="post">' +
        "<h3>" + esc(p.title) + "</h3>" +
        '<p class="post-date">' + esc(formatDate(p.publishedAt)) + (p.author ? " · " + esc(p.author) : "") + "</p>" +
        (p.excerpt ? '<p class="post-excerpt">' + esc(p.excerpt) + "</p>" : "") +
        (p.body ? '<div class="post-body">' + esc(p.body) + "</div>" : "") +
        "</article>";
    }).join("");
  }

  function openModal(id) {
    var assets = (state.catalog && state.catalog.assets) || [];
    var a = null;
    for (var i = 0; i < assets.length; i++) {
      if (String(assets[i].id) === String(id)) { a = assets[i]; break; }
    }
    if (!a) return;
    var rows = "";
    rows += metaRow("Category", categoryName(a.categorySlug));
    rows += metaRow("Artist", a.artist);
    if (a.format) rows += metaRow("Format", a.format);
    if (a.version) rows += metaRow("Version", a.version);
    if (a.fileSize) rows += metaRow("File size", a.fileSize);
    if (a.createdAt) rows += metaRow("Added", formatDate(a.createdAt));
    rows += metaRow("Downloads", String(a.downloads || 0));
    if (a.submitter && a.submitter !== a.artist) rows += metaRow("Shared by", a.submitter);
    var tags = (a.tags || []).map(function (t) {
      return '<span class="tag">' + esc(t) + "</span>";
    }).join(" ");
    els.modalBody.innerHTML =
      '<div class="modal-thumb">' + thumbHtml(a) + "</div>" +
      '<h2 id="modalTitle">' + esc(a.title) + "</h2>" +
      '<p class="modal-artist">by ' + esc(a.artist) + "</p>" +
      (a.description ? '<p class="modal-desc">' + esc(a.description) + "</p>" : "") +
      (tags ? '<p class="card-tags">' + tags + "</p>" : "") +
      '<table class="modal-meta">' + rows + "</table>" +
      '<a class="download-btn" href="' + esc(a.downloadUrl) + '" target="_blank" rel="noopener">Download</a>' +
      '<p class="host-note">Hosted on ' + esc(hostLabel(a.downloadUrl)) + " — the file opens on the artist's own host.</p>";
    els.modal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function metaRow(label, value) {
    return "<tr><th>" + esc(label) + "</th><td>" + esc(value) + "</td></tr>";
  }

  function closeModal() {
    els.modal.hidden = true;
    document.body.style.overflow = "";
  }

  function renderAll() {
    renderGates();
    renderGrid();
    renderCounts();
    renderPosts();
  }

  function init() {
    els.gates = document.getElementById("gates");
    els.grid = document.getElementById("assetGrid");
    els.emptyState = document.getElementById("emptyState");
    els.emptyText = document.getElementById("emptyText");
    els.heroCounts = document.getElementById("heroCounts");
    els.postList = document.getElementById("postList");
    els.postsEmpty = document.getElementById("postsEmpty");
    els.modal = document.getElementById("assetModal");
    els.modalBody = document.getElementById("modalBody");

    document.getElementById("searchBox").addEventListener("input", function (e) {
      state.query = e.target.value;
      renderGrid();
    });
    document.getElementById("sortSelect").addEventListener("change", function (e) {
      state.sort = e.target.value;
      renderGrid();
    });
    document.getElementById("modalClose").addEventListener("click", closeModal);
    document.getElementById("modalBackdrop").addEventListener("click", closeModal);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeModal();
    });

    fetch("catalog.json", { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("catalog.json " + r.status); return r.json(); })
      .then(function (data) { state.catalog = data; renderAll(); })
      .catch(function () {
        els.grid.innerHTML = "";
        els.emptyState.hidden = false;
        els.emptyText.textContent = "The catalog could not be loaded. Please try again later.";
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
