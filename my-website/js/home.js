// --- Configuration Constants ---
const API_CONFIG = {
  KEY: '420dd26414b8bcb319a5d49051b6ac25',
  BASE_URL: 'https://api.themoviedb.org/3',
  IMG_URL: 'https://image.tmdb.org/t/p/original',
};

// --- State Variables ---
let currentItem = null;
let currentTheme = 'dark';

// --- Utility Functions ---

/**
 * Shows loading screen
 */
function showLoading() {
  document.getElementById('loading-screen').classList.remove('hidden');
}

/**
 * Hides loading screen
 */
function hideLoading() {
  document.getElementById('loading-screen').classList.add('hidden');
}

/**
 * Formats date to readable string
 */
function formatDate(dateString) {
  if (!dateString) return 'Unknown';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

/**
 * Toggles between dark and light theme
 */
function toggleTheme() {
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  currentTheme = newTheme;
  
  // Update theme toggle icon
  const themeIcon = document.querySelector('.theme-toggle i');
  themeIcon.className = currentTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
  
  // Save preference to localStorage
  localStorage.setItem('theme', newTheme);
}

/**
 * Scrolls to top of page
 */
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Scrolls to content section
 */
function scrollToContent() {
  document.getElementById('trending-section').scrollIntoView({ 
    behavior: 'smooth' 
  });
}

/**
 * Scrolls media lists horizontally
 */
function scrollList(containerId, distance) {
  const container = document.getElementById(containerId);
  container.scrollBy({ left: distance, behavior: 'smooth' });
}

// --- API Fetching Functions ---

/**
 * Fetches trending movies or TV shows from TMDB.
 */
async function fetchTrending(type) {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/trending/${type}/week?api_key=${API_CONFIG.KEY}`
    );
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error(`Error fetching trending ${type}:`, error);
    return [];
  }
}

/**
 * Fetches trending anime by filtering Japanese animation.
 */
async function fetchTrendingAnime() {
  let allResults = [];
  const MAX_PAGES = 3;
  const ANIME_GENRE_ID = 16;

  for (let page = 1; page <= MAX_PAGES; page++) {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/trending/tv/week?api_key=${API_CONFIG.KEY}&page=${page}`
      );
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      const filtered = data.results.filter(item =>
        item.original_language === 'ja' &&
        item.genre_ids && item.genre_ids.includes(ANIME_GENRE_ID)
      );
      
      allResults = allResults.concat(filtered);
    } catch (error) {
      console.error(`Error fetching anime page ${page}:`, error);
    }
  }

  return allResults;
}

// --- DOM Manipulation / Display Functions ---

/**
 * Displays the hero banner with random content.
 */
function displayBanner(item) {
  const bannerElement = document.getElementById('banner');
  const titleElement = document.getElementById('banner-title');
  const descElement = document.getElementById('banner-description');
  
  if (item && item.backdrop_path) {
    bannerElement.style.backgroundImage = `url(${API_CONFIG.IMG_URL}${item.backdrop_path})`;
    titleElement.textContent = item.title || item.name || 'StreamFlix';
    descElement.textContent = item.overview 
      ? (item.overview.substring(0, 150) + '...') 
      : 'Discover thousands of movies and TV shows';
  }
}

/**
 * Creates a media card element.
 */
function createMediaCard(item) {
  if (!item.poster_path) return null;

  const card = document.createElement('div');
  card.className = 'media-card';
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  
  card.innerHTML = `
    <img src="${API_CONFIG.IMG_URL}${item.poster_path}" 
         alt="Poster for ${item.title || item.name}" 
         class="media-poster" />
    <div class="media-info">
      <h3 class="media-title">${item.title || item.name}</h3>
      <div class="media-meta">
        <div class="stars">${renderRating(item.vote_average)}</div>
        <span>${(item.vote_average / 2).toFixed(1)}</span>
      </div>
    </div>
  `;

  // Add click and keyboard events
  const clickHandler = () => showDetails(item);
  card.onclick = clickHandler;
  card.onkeydown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      clickHandler();
    }
  };

  return card;
}

/**
 * Populates a media list with cards.
 */
function displayList(items, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';
  items.forEach(item => {
    const card = createMediaCard(item);
    if (card) container.appendChild(card);
  });
}

/**
 * Renders star rating based on vote average.
 */
function renderRating(voteAverage) {
  const ratingOutOfFive = Math.round(voteAverage / 2);
  return '★'.repeat(ratingOutOfFive) + '☆'.repeat(5 - ratingOutOfFive);
}

// --- Modal and Details Logic ---

/**
 * Shows detailed modal for selected media item.
 */
function showDetails(item) {
  currentItem = item;
  
  // Set media details
  document.getElementById('modal-title').textContent = item.title || item.name;
  document.getElementById('modal-description').textContent = 
    item.overview || 'No description available.';
  document.getElementById('modal-image').src = 
    `${API_CONFIG.IMG_URL}${item.poster_path}`;
  document.getElementById('modal-image').alt = 
    `Poster for ${item.title || item.name}`;
  
  // Set additional metadata
  document.getElementById('modal-rating').innerHTML = renderRating(item.vote_average);
  document.getElementById('modal-rating-text').textContent = 
    `${(item.vote_average / 2).toFixed(1)}/5`;
  document.getElementById('modal-date').textContent = 
    formatDate(item.release_date || item.first_air_date);
  
  // Reset server and load video
  document.getElementById('server').value = 'vidsrc.cc';
  changeServer();
  
  // Show modal
  document.getElementById('modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

/**
 * Updates video iframe based on selected server.
 */
function changeServer() {
  if (!currentItem) return;

  const server = document.getElementById('server').value;
  const type = (currentItem.media_type === "movie" || currentItem.title) ? "movie" : "tv";
  let embedURL = "";

  if (server === "vidsrc.cc") {
    embedURL = `https://vidsrc.cc/v2/embed/${type}/${currentItem.id}`;
  } else if (server === "vidsrc.net") {
    embedURL = `https://vidsrc.net/embed/${type}/?tmdb=${currentItem.id}`;
  } else if (server === "player.videasy.net") {
    embedURL = `https://player.videasy.net/${type}/${currentItem.id}`;
  }

  document.getElementById('modal-video').src = embedURL;
}

/**
 * Closes the details modal.
 */
function closeModal() {
  document.getElementById('modal').style.display = 'none';
  document.getElementById('modal-video').src = '';
  document.body.style.overflow = 'auto';
}

// --- Search Functionality ---

/**
 * Opens search modal.
 */
function openSearchModal() {
  document.getElementById('search-modal').style.display = 'block';
  document.getElementById('search-input').focus();
  document.body.style.overflow = 'hidden';
}

/**
 * Closes search modal.
 */
function closeSearchModal() {
  document.getElementById('search-modal').style.display = 'none';
  document.getElementById('search-results').innerHTML = '';
  document.getElementById('search-input').value = '';
  document.body.style.overflow = 'auto';
}

/**
 * Searches TMDB and displays results.
 */
async function searchTMDB() {
  const query = document.getElementById('search-input').value.trim();
  const container = document.getElementById('search-results');
  const emptyState = document.getElementById('search-empty');
  
  if (!query) {
    container.innerHTML = '';
    if (emptyState) container.appendChild(emptyState);
    return;
  }

  // Remove empty state during search
  if (emptyState) emptyState.remove();

  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/search/multi?api_key=${API_CONFIG.KEY}&query=${encodeURIComponent(query)}`
    );
    if (!response.ok) throw new Error(`Search error! status: ${response.status}`);
    
    const data = await response.json();
    container.innerHTML = '';

    const validResults = data.results.filter(item =>
      item.media_type !== 'person' &&
      (item.poster_path || item.backdrop_path) &&
      (item.title || item.name)
    );

    if (validResults.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-search"></i>
          <p>No results found for "${query}"</p>
        </div>
      `;
      return;
    }

    validResults.forEach(item => {
      const card = createMediaCard(item);
      if (card) {
        // Update click handler to close search modal first
        const originalClick = card.onclick;
        card.onclick = () => {
          closeSearchModal();
          originalClick();
        };
        container.appendChild(card);
      }
    });

  } catch (error) {
    console.error("Search error:", error);
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Search failed. Please try again.</p>
      </div>
    `;
  }
}

// --- Event Listeners and Initialization ---

/**
 * Sets up event listeners.
 */
function setupEventListeners() {
  // Close modals on outside click
  document.addEventListener('click', (e) => {
    const modal = document.getElementById('modal');
    const searchModal = document.getElementById('search-modal');
    
    if (e.target === modal) closeModal();
    if (e.target === searchModal) closeSearchModal();
  });

  // Close modals on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closeSearchModal();
    }
  });

  // Show back-to-top button on scroll
  window.addEventListener('scroll', () => {
    const backToTop = document.getElementById('back-to-top');
    const navbar = document.querySelector('.navbar');
    
    if (window.scrollY > 300) {
      backToTop.style.display = 'flex';
      navbar.classList.add('scrolled');
    } else {
      backToTop.style.display = 'none';
      navbar.classList.remove('scrolled');
    }
  });

  // Search on Enter key
  document.getElementById('search-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchTMDB();
  });
}

/**
 * Loads saved theme preference.
 */
function loadThemePreference() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  currentTheme = savedTheme;
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  const themeIcon = document.querySelector('.theme-toggle i');
  themeIcon.className = savedTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
}

/**
 * Main initialization function.
 */
async function init() {
  showLoading();
  loadThemePreference();
  setupEventListeners();

  try {
    const [movies, tvShows, anime] = await Promise.all([
      fetchTrending('movie'),
      fetchTrending('tv'),
      fetchTrendingAnime()
    ]);

    // Display banner with random content
    if (movies.length > 0) {
      const randomMovie = movies[Math.floor(Math.random() * movies.length)];
      displayBanner(randomMovie);
    }

    // Display all lists
    displayList(movies, 'movies-list');
    displayList(tvShows, 'tvshows-list');
    displayList(anime, 'anime-list');

  } catch (error) {
    console.error('Initialization error:', error);
  } finally {
    setTimeout(hideLoading, 1000); // Ensure loading screen shows briefly
  }

  // Expose functions globally
  window.closeModal = closeModal;
  window.changeServer = changeServer;
  window.openSearchModal = openSearchModal;
  window.closeSearchModal = closeSearchModal;
  window.searchTMDB = searchTMDB;
  window.toggleTheme = toggleTheme;
  window.scrollToTop = scrollToTop;
  window.scrollToContent = scrollToContent;
  window.scrollList = scrollList;
  window.playTrailer = () => alert('Trailer feature coming soon!');
  window.addToFavorites = () => alert('Added to favorites!');
  window.shareMedia = () => alert('Share feature coming soon!');
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
