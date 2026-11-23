// API pública y gratuita de recetas: https://www.themealdb.com/api.php
const API_BASE = "https://www.themealdb.com/api/json/v1/1";
const FAV_KEY = "recetario-favoritos";

const grid = document.querySelector("#recipeGrid");
const searchForm = document.querySelector("#searchForm");
const searchInput = document.querySelector("#searchInput");
const statusLabel = document.querySelector("#status");
const favBtn = document.querySelector("#favBtn");
const favCount = document.querySelector("#favCount");
const installBtn = document.querySelector("#installBtn");
const recipeDialog = document.querySelector("#recipeDialog");
const recipeDetails = document.querySelector("#recipeDetails");
const closeDialogBtn = document.querySelector("#closeDialogBtn");

let lastResults = [];      // última búsqueda
let showingFavorites = false;
let installPrompt = null;

// ---------- Favoritos (guardados en el navegador) ----------
function loadFavorites() {
  try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; }
  catch { return []; }
}
let favorites = loadFavorites();

function saveFavorites() {
  try { localStorage.setItem(FAV_KEY, JSON.stringify(favorites)); } catch { /* sin almacenamiento */ }
  favCount.textContent = favorites.length;
}
const isFavorite = id => favorites.some(meal => meal.idMeal === id);

function toggleFavorite(meal) {
  if (isFavorite(meal.idMeal)) favorites = favorites.filter(item => item.idMeal !== meal.idMeal);
  else favorites.push(meal);
  saveFavorites();
  if (showingFavorites) render(favorites);
}

// ---------- Utilidades ----------
function escapeHtml(text = "") {
  return String(text).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}

async function getJson(path) {
  const response = await fetch(`${API_BASE}/${path}`);
  if (!response.ok) throw new Error("La API respondió con un error.");
  return response.json();
}

function getIngredients(meal) {
  const list = [];
  for (let i = 1; i <= 20; i++) {
    const name = (meal[`strIngredient${i}`] || "").trim();
    const measure = (meal[`strMeasure${i}`] || "").trim();
    if (name) list.push({ name, measure });
  }
  return list;
}

function getSteps(meal) {
  return (meal.strInstructions || "")
    .split(/\r?\n+/)
    .map(step => step.replace(/^\s*(step\s*\d+[:.]?|\d+[.)])\s*/i, "").trim())
    .filter(step => step.length > 2);
}

function setStatus(text) {
  statusLabel.textContent = text;
  statusLabel.hidden = !text;
}

// ---------- Tarjetas ----------
function render(meals) {
  grid.innerHTML = "";
  if (!meals.length) {
    setStatus(showingFavorites
      ? "Aún no tienes favoritos. Marca la casilla de una receta para guardarla aquí."
      : "No se encontraron recetas. Prueba con otra palabra (en inglés).");
    return;
  }
  setStatus(showingFavorites ? `Tus favoritos (${meals.length})` : "");

  meals.forEach(meal => {
    const card = document.createElement("article");
    card.className = "recipe-card";
    card.innerHTML = `
      <label class="fav-check" title="Marcar como favorito">
        <input type="checkbox" ${isFavorite(meal.idMeal) ? "checked" : ""} aria-label="Favorito: ${escapeHtml(meal.strMeal)}">
        <span aria-hidden="true"></span>
      </label>
      <img class="recipe-image" loading="lazy" alt="${escapeHtml(meal.strMeal)}" src="${escapeHtml(meal.strMealThumb)}/preview"
        onerror="this.onerror=null;this.src='${escapeHtml(meal.strMealThumb)}'">
      <h3 class="recipe-name">${escapeHtml(meal.strMeal)}</h3>
    `;
    const checkbox = card.querySelector("input");
    checkbox.addEventListener("click", event => event.stopPropagation());
    checkbox.addEventListener("change", () => toggleFavorite(meal));
    card.querySelector(".fav-check").addEventListener("click", event => event.stopPropagation());

    card.tabIndex = 0;
    card.setAttribute("aria-label", `Ver receta de ${meal.strMeal}`);
    card.addEventListener("click", () => showRecipeDetails(meal));
    card.addEventListener("keydown", event => {
      if (event.target === card && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        showRecipeDetails(meal);
      }
    });
    grid.appendChild(card);
  });
}

// ---------- Detalle ----------
function youtubeEmbed(url) {
  const match = (url || "").match(/[?&]v=([\w-]{11})/);
  return match ? `https://www.youtube-nocookie.com/embed/${match[1]}` : "";
}

function showRecipeDetails(meal) {
  const ingredients = getIngredients(meal)
    .map(item => `<li><strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.measure)}</span></li>`).join("");
  const steps = getSteps(meal).map(step => `<li>${escapeHtml(step)}</li>`).join("");
  const video = youtubeEmbed(meal.strYoutube);

  recipeDetails.innerHTML = `
    <img class="detail-image" src="${escapeHtml(meal.strMealThumb)}" alt="${escapeHtml(meal.strMeal)}">
    <div class="detail-body">
      <h2 id="detailName">${escapeHtml(meal.strMeal)}</h2>
      <p class="detail-meta">${escapeHtml(meal.strCategory || "")} · ${escapeHtml(meal.strArea || "")}</p>
      <button id="detailFavBtn" class="btn btn-fav" type="button"></button>
      <h3>Ingredientes</h3>
      <ul class="ingredients">${ingredients || "<li>Sin ingredientes.</li>"}</ul>
      <h3>Preparación</h3>
      <ol class="steps">${steps || "<li>Sin instrucciones.</li>"}</ol>
      ${video ? `<h3>Video</h3><div class="video-wrap"><iframe src="${video}" title="Video de ${escapeHtml(meal.strMeal)}" loading="lazy" allowfullscreen></iframe></div>` : ""}
    </div>`;

  const detailFavBtn = document.querySelector("#detailFavBtn");
  const paint = () => { detailFavBtn.textContent = isFavorite(meal.idMeal) ? "★ Quitar de favoritos" : "☆ Agregar a favoritos"; };
  paint();
  detailFavBtn.addEventListener("click", () => {
    toggleFavorite(meal);
    paint();
    if (!showingFavorites) render(lastResults);
  });

  if (!recipeDialog.open) recipeDialog.showModal();
  recipeDialog.scrollTop = 0;
}

closeDialogBtn.addEventListener("click", () => recipeDialog.close());
recipeDialog.addEventListener("click", event => { if (event.target === recipeDialog) recipeDialog.close(); });
recipeDialog.addEventListener("close", () => {
  const frame = recipeDialog.querySelector("iframe");
  if (frame) frame.src = "about:blank"; // detiene el video
});

// ---------- Búsqueda ----------
async function search(query) {
  showingFavorites = false;
  favBtn.classList.remove("active");
  favBtn.setAttribute("aria-pressed", "false");
  grid.innerHTML = "";
  setStatus("Buscando recetas...");
  try {
    const data = await getJson(`search.php?s=${encodeURIComponent(query)}`);
    lastResults = data.meals || [];
    render(lastResults);
  } catch (error) {
    setStatus("No se pudo conectar con TheMealDB. Revisa tu conexión e inténtalo de nuevo.");
  }
}

searchForm.addEventListener("submit", event => {
  event.preventDefault();
  search(searchInput.value.trim());
});

favBtn.addEventListener("click", () => {
  showingFavorites = !showingFavorites;
  favBtn.classList.toggle("active", showingFavorites);
  favBtn.setAttribute("aria-pressed", String(showingFavorites));
  render(showingFavorites ? favorites : lastResults);
});

// ---------- Instalación PWA (botón "Descargar app") ----------
const installDialog = document.querySelector("#installDialog");
const installMsg = document.querySelector("#installMsg");
const isInstalled = () =>
  window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;

if (isInstalled()) installBtn.hidden = true; // ya se abrió como app

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  installPrompt = event; // el navegador permite instalar: el botón abrirá su ventana
});

installBtn.addEventListener("click", async () => {
  if (installPrompt) {
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    installPrompt = null;
    if (outcome === "accepted") installBtn.hidden = true;
    return;
  }
  // Sin ventana automática (iPhone, Firefox, ya instalada o sin HTTPS/localhost)
  installMsg.textContent = location.protocol === "file:"
    ? "Abre la app con Live Server (localhost) o desde HTTPS; abriendo el archivo directamente no se puede instalar."
    : "Tu navegador no mostró la ventana de instalación automática (o la app ya está instalada). Puedes instalarla así:";
  installDialog.showModal();
});
document.querySelector("#closeInstallBtn").addEventListener("click", () => installDialog.close());
installDialog.addEventListener("click", event => { if (event.target === installDialog) installDialog.close(); });
window.addEventListener("appinstalled", () => { installBtn.hidden = true; installPrompt = null; });

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(error => {
      console.error("No se pudo registrar el service worker:", error);
    });
  });
}

// Al abrir: favoritos guardados + recetas iniciales (búsqueda vacía = recetas variadas)
saveFavorites();
search("");
