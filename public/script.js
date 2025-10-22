// API Configuration
const API_BASE_URL = `${window.location.origin.replace(/\/$/, '')}/api`;

// State Management
let currentMovieId = null;
let currentUserId = null;
let currentPage = 1;
let searchDebounceTimer = null;
let allUsers = [];

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const genreFilter = document.getElementById('genreFilter');
const minRatingInput = document.getElementById('minRating');
const clearFiltersBtn = document.getElementById('clearFilters');
const searchResults = document.getElementById('searchResults');
const searchPagination = document.getElementById('searchPagination');

const trendingList = document.getElementById('trendingList');
const userSelect = document.getElementById('userSelect');
const historyList = document.getElementById('historyList');
const historyStats = document.getElementById('historyStats');
const historyPagination = document.getElementById('historyPagination');

const movieModal = document.getElementById('movieModal');
const movieDetails = document.getElementById('movieDetails');
const movieReviews = document.getElementById('movieReviews');
const reviewStats = document.getElementById('reviewStats');
const reviewForm = document.getElementById('reviewForm');
const reviewUserSelect = document.getElementById('reviewUserSelect');

const loadingSpinner = document.getElementById('loadingSpinner');
const toast = document.getElementById('toast');

// Utility Functions
function showLoading() {
  loadingSpinner.classList.add('active');
}

function hideLoading() {
  loadingSpinner.classList.remove('active');
}

function showToast(message, type = 'success') {
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Image helper - images are now stored as base64 in MongoDB
function getImageSrc(url) {
  return url || '';
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// API Functions
async function apiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    showToast(error.message, 'error');
    throw error;
  }
}

// Tab Switching
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    
    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Update active content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tab}Section`).classList.add('active');
    
    // Load content for specific tabs
    if (tab === 'trending') {
      loadTrendingMovies();
    } else if (tab === 'history') {
      if (currentUserId && currentUserId.trim() !== '') {
        console.log('Loading history for user:', currentUserId);
        loadUserHistory(currentUserId);
      } else {
        console.log('No user selected, showing message');
        // Show message to select user from header
        historyStats.innerHTML = '<div class="empty-state"><h3>👤 Please select a user from the header to view watch history</h3></div>';
        historyList.innerHTML = '';
        historyPagination.innerHTML = '';
      }
    }
  });
});

// Search Functionality
searchBtn.addEventListener('click', () => performSearch());

searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    performSearch();
  }
});

// Debounced search on input - more responsive
searchInput.addEventListener('input', () => {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    const query = searchInput.value.trim();
    if (query && query.length >= 2) { // Search after 2 characters
      performSearch();
    } else if (query.length === 0) {
      // Clear results when input is empty
      searchResults.innerHTML = '';
      searchPagination.innerHTML = '';
    }
  }, 300); // Reduced debounce time for better responsiveness
});

genreFilter.addEventListener('change', () => performSearch());
minRatingInput.addEventListener('change', () => performSearch());

clearFiltersBtn.addEventListener('click', () => {
  searchInput.value = '';
  genreFilter.value = '';
  minRatingInput.value = '';
  searchResults.innerHTML = '';
  searchPagination.innerHTML = '';
});

async function performSearch(page = 1) {
  const query = searchInput.value.trim();
  
  if (!query || query.length < 2) {
    if (query.length === 0) {
      searchResults.innerHTML = '';
      searchPagination.innerHTML = '';
    }
    return;
  }

  showLoading();
  currentPage = page;

  try {
    const params = new URLSearchParams({
      query,
      page,
      limit: 12
    });

    // Add userId for personalized search
    if (currentUserId) params.append('userId', currentUserId);
    
    if (genreFilter.value) params.append('genre', genreFilter.value);
    if (minRatingInput.value) params.append('minRating', minRatingInput.value);

    const data = await apiRequest(`/movies/search?${params}`);
    
    displaySearchResults(data.data.movies, data.data.userFavoriteGenre, data.data.personalized);
    displayPagination(data.data.pagination, 'search');
  } catch (error) {
    searchResults.innerHTML = '<div class="empty-state"><h3>Search failed. Please try again.</h3></div>';
  } finally {
    hideLoading();
  }
}

function displaySearchResults(movies, userFavoriteGenre, personalized) {
  if (movies.length === 0) {
    searchResults.innerHTML = '<div class="empty-state"><h3>No movies found</h3><p>Try a different search term</p></div>';
    return;
  }

  // Show personalized search info if available
  if (personalized && userFavoriteGenre) {
    const personalizedInfo = document.createElement('div');
    personalizedInfo.className = 'personalized-info';
    personalizedInfo.innerHTML = `
      <div style="background: var(--primary-color); color: white; padding: 10px; border-radius: 5px; margin-bottom: 20px; text-align: center;">
        🎯 Personalized for you: Prioritizing <strong>${userFavoriteGenre}</strong> movies
      </div>
    `;
    searchResults.innerHTML = '';
    searchResults.appendChild(personalizedInfo);
  }

  const moviesHtml = movies.map(movie => `
    <div class="movie-card" onclick="showMovieDetails('${movie._id}')">
      ${movie.posterUrl 
        ? `<img src="${getImageSrc(movie.posterUrl)}" alt="${movie.title}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
           <div class="placeholder-img" style="display:none;">🎬</div>`
        : `<div class="placeholder-img">🎬</div>`
      }
      <div class="movie-info">
        <h3>${movie.titleHighlighted || movie.title}</h3>
        <div class="movie-meta">
          <span>${movie.releaseYear || 'N/A'}</span>
          <span class="rating">⭐ ${movie.rating ? movie.rating.toFixed(1) : 'N/A'}</span>
        </div>
        <div class="genres">${movie.genres?.slice(0, 3).join(', ') || 'No genres'}</div>
        ${movie.directorHighlighted ? `<div class="director">Director: ${movie.directorHighlighted}</div>` : ''}
        ${movie.castHighlighted ? `<div class="cast">Cast: ${movie.castHighlighted.map(c => c.nameHighlighted || c.name).slice(0, 2).join(', ')}</div>` : ''}
        ${movie.hybridScore ? `<div class="watch-stats">Score: ${(movie.hybridScore * 100).toFixed(0)}%</div>` : ''}
      </div>
    </div>
  `).join('');
  
  // Add movies to the results (either append to personalized info or replace)
  if (personalized && userFavoriteGenre) {
    searchResults.innerHTML += moviesHtml;
  } else {
    searchResults.innerHTML = moviesHtml;
  }
}

// Trending Movies
async function loadTrendingMovies() {
  showLoading();

  try {
    // Add userId parameter if user is selected
    const url = currentUserId ? `/movies/trending?userId=${currentUserId}` : '/movies/trending';
    const data = await apiRequest(url);
    displayTrendingMovies(data.data.trending, data.data.userFavoriteGenre, data.data.filteredOutWatched);
  } catch (error) {
    trendingList.innerHTML = '<div class="empty-state"><h3>Failed to load trending movies</h3></div>';
  } finally {
    hideLoading();
  }
}

function displayTrendingMovies(movies, userFavoriteGenre, filteredOutWatched) {
  if (movies.length === 0) {
    trendingList.innerHTML = '<div class="empty-state"><h3>No trending movies yet</h3></div>';
    return;
  }

  // Update the trending section title if personalized
  const trendingTitle = document.querySelector('#trendingSection h2');
  if (userFavoriteGenre) {
    trendingTitle.innerHTML = `🔥 Trending Movies for You <span style="color: var(--primary-color); font-size: 0.8em;">(Favorite: ${userFavoriteGenre})</span>`;
  } else {
    trendingTitle.innerHTML = '🔥 Top 5 Movies This Month';
  }

  // Update subtitle to show filtering info
  const subtitle = document.querySelector('#trendingSection .subtitle');
  if (filteredOutWatched && filteredOutWatched > 0) {
    subtitle.innerHTML = `Most watched movies in the last 30 days (${filteredOutWatched} movies you've already watched are hidden)`;
  } else {
    subtitle.innerHTML = 'Most watched movies in the last 30 days';
  }

  trendingList.innerHTML = movies.map((movie, index) => {
    // Check if this movie matches user's favorite genre
    const isRecommended = userFavoriteGenre && movie.genres && movie.genres.includes(userFavoriteGenre);
    
    return `
      <div class="movie-card" onclick="showMovieDetails('${movie._id}')">
        ${isRecommended ? '<div class="trending-badge recommended">⭐ Recommended</div>' : `<div class="trending-badge">#${index + 1}</div>`}
        ${movie.posterUrl 
          ? `<img src="${getImageSrc(movie.posterUrl)}" alt="${movie.title}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
             <div class="placeholder-img" style="display:none;">🎬</div>`
          : `<div class="placeholder-img">🎬</div>`
        }
        <div class="movie-info">
          <h3>${movie.title}</h3>
          <div class="movie-meta">
            <span>${movie.releaseYear || 'N/A'}</span>
            <span class="rating">⭐ ${movie.rating ? movie.rating.toFixed(1) : 'N/A'}</span>
          </div>
          <div class="genres">${movie.genres?.slice(0, 3).join(', ') || 'No genres'}</div>
          <div class="watch-stats">
            👁️ ${movie.watchCount} views | 👥 ${movie.uniqueViewers} viewers
            ${isRecommended ? '<br><span style="color: var(--primary-color); font-weight: bold;">🎯 Matches your favorite genre!</span>' : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// User Management
async function loadUsers() {
  try {
    console.log('Loading users...');
    const data = await apiRequest('/users');
    allUsers = data.data.users;
    console.log(`Loaded ${allUsers.length} users:`, allUsers.map(u => u.name));
    populateUserSelects();
  } catch (error) {
    console.error('Failed to load users:', error);
  }
}

// userSelect event listener removed - now using global user selection from header

async function loadUserHistory(userId, page = 1) {
  showLoading();

  try {
    // Debug: Check if userId is valid
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    // Validate MongoDB ObjectId format (24 hex characters)
    if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
      throw new Error('Invalid user ID format');
    }
    
    console.log('Making API request for user history:', userId);
    const params = new URLSearchParams({ page, limit: 10 });
    const data = await apiRequest(`/users/${userId}/history?${params}`);
    
    displayUserStats(data.data.stats);
    displayUserHistory(data.data.history);
    displayPagination(data.data.pagination, 'history');
  } catch (error) {
    console.error('Error loading user history:', error);
    historyStats.innerHTML = '<div class="empty-state"><h3>Failed to load history</h3><p>Please try again or select a different user.</p></div>';
    historyList.innerHTML = '';
    historyPagination.innerHTML = '';
  } finally {
    hideLoading();
  }
}

function displayUserStats(stats) {
  historyStats.innerHTML = `
    <div class="stat-item">
      <div class="stat-value">${stats.totalMoviesWatched}</div>
      <div class="stat-label">Movies Watched</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">${Math.round(stats.totalWatchTime / 60)}h</div>
      <div class="stat-label">Total Watch Time</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">${stats.favoriteGenre}</div>
      <div class="stat-label">Favorite Genre</div>
    </div>
  `;
}

function displayUserHistory(history) {
  if (history.length === 0) {
    historyList.innerHTML = '<div class="empty-state"><h3>No watch history yet</h3></div>';
    return;
  }

  historyList.innerHTML = history.map(item => `
    <div class="history-item">
      ${item.movie?.posterUrl 
        ? `<img src="${getImageSrc(item.movie.posterUrl)}" alt="${item.movie?.title}">`
        : `<div style="width:100px;height:150px;background:#333;display:flex;align-items:center;justify-content:center;border-radius:5px;">🎬</div>`
      }
      <div class="history-details">
        <h4>${item.movie?.title || 'Unknown Movie'}</h4>
        <div class="history-meta">
          <p>⭐ Rating: ${item.movie?.rating?.toFixed(1) || 'N/A'}</p>
          <p>📅 Watched: ${formatDate(item.watchedAt)}</p>
          <p>⏱️ Duration: ${item.duration} minutes</p>
          <p>✅ Completion: ${item.completionPercentage}%</p>
        </div>
      </div>
    </div>
  `).join('');
}

// Pagination
function displayPagination(pagination, type) {
  const container = type === 'search' ? searchPagination : historyPagination;
  
  if (pagination.pages <= 1) {
    container.innerHTML = '';
    return;
  }

  // For history pagination, make sure we have a valid user ID
  if (type === 'history' && (!currentUserId || currentUserId.trim() === '')) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <button ${pagination.page === 1 ? 'disabled' : ''} onclick="${type === 'search' ? 'performSearch' : 'loadUserHistory'}(${type === 'search' ? '' : 'currentUserId, '}${pagination.page - 1})">
      Previous
    </button>
    <span class="page-info">Page ${pagination.page} of ${pagination.pages}</span>
    <button ${pagination.page === pagination.pages ? 'disabled' : ''} onclick="${type === 'search' ? 'performSearch' : 'loadUserHistory'}(${type === 'search' ? '' : 'currentUserId, '}${pagination.page + 1})">
      Next
    </button>
  `;
}

// Movie Details Modal
async function showMovieDetails(movieId) {
  showLoading();
  currentMovieId = movieId;

  try {
    const movieData = await apiRequest(`/movies/${movieId}`);
    const reviewsData = await apiRequest(`/movies/${movieId}/reviews?limit=5`);
    const statsData = await apiRequest(`/movies/${movieId}/reviews/stats`);

    displayMovieDetails(movieData.data.movie);
    displayReviewStats(statsData.data);
    displayReviews(reviewsData.data.reviews);

    movieModal.classList.add('active');
  } catch (error) {
    showToast('Failed to load movie details', 'error');
  } finally {
    hideLoading();
  }
}

function displayMovieDetails(movie) {
  movieDetails.innerHTML = `
    <div>
      ${movie.posterUrl 
        ? `<img src="${getImageSrc(movie.posterUrl)}" alt="${movie.title}">`
        : `<div class="placeholder-img">🎬</div>`
      }
    </div>
    <div class="movie-full-info">
      <h2>${movie.title}</h2>
      <p><strong>Year:</strong> ${movie.releaseYear || 'N/A'}</p>
      <p><strong>Director:</strong> ${movie.director || 'Unknown'}</p>
      <p><strong>Rating:</strong> ⭐ ${movie.rating?.toFixed(1) || 'N/A'}/10</p>
      <p><strong>Genres:</strong> ${movie.genres?.join(', ') || 'No genres'}</p>
      <p><strong>Watch Count:</strong> 👁️ ${movie.watchCount || 0} views</p>
      <p><strong>Description:</strong> ${movie.description || 'No description available'}</p>
      ${movie.cast && movie.cast.length > 0 ? `
        <div>
          <strong>Cast:</strong>
          <div class="cast-list">
            ${movie.cast.slice(0, 10).map(c => `<span class="cast-member">${c.name}</span>`).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function displayReviewStats(stats) {
  reviewStats.innerHTML = `
    <p><strong>Average Rating:</strong> ⭐ ${stats.averageRating}/10</p>
    <p><strong>Total Reviews:</strong> ${stats.totalReviews}</p>
  `;
}

function displayReviews(reviews) {
  if (reviews.length === 0) {
    movieReviews.innerHTML = '<div class="empty-state"><p>No reviews yet. Be the first to review!</p></div>';
    return;
  }

  movieReviews.innerHTML = reviews.map(review => `
    <div class="review-item">
      <div class="review-header">
        <span class="review-author">${review.userId?.name || 'Anonymous'}</span>
        <span class="review-rating">⭐ ${review.rating}/10</span>
      </div>
      ${review.reviewText ? `<p class="review-text">${review.reviewText}</p>` : ''}
      <div class="review-footer">
        <span>👍 ${review.helpful} found helpful</span>
        <span>•</span>
        <span>${formatDate(review.createdAt)}</span>
      </div>
    </div>
  `).join('');
}

// Review Form
reviewForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const userId = reviewUserSelect.value;
  const rating = document.getElementById('reviewRating').value;
  const reviewText = document.getElementById('reviewText').value.trim();

  if (!userId) {
    showToast('Please select a user', 'error');
    return;
  }

  showLoading();

  try {
    await apiRequest(`/movies/${currentMovieId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ userId, rating: parseInt(rating), reviewText })
    });

    showToast('Review submitted successfully!', 'success');
    reviewForm.reset();
    
    // Reload reviews
    const reviewsData = await apiRequest(`/movies/${currentMovieId}/reviews?limit=5`);
    const statsData = await apiRequest(`/movies/${currentMovieId}/reviews/stats`);
    displayReviewStats(statsData.data);
    displayReviews(reviewsData.data.reviews);
  } catch (error) {
    showToast(error.message || 'Failed to submit review', 'error');
  } finally {
    hideLoading();
  }
});

// Add to Watched Function
async function addToWatched() {
  if (!currentUserId) {
    showToast('Please select a user first', 'error');
    return;
  }

  if (!currentMovieId) {
    showToast('No movie selected', 'error');
    return;
  }

  const watchDuration = document.getElementById('watchDuration').value;
  const completionPercentage = document.getElementById('completionPercentage').value;

  if (!watchDuration || !completionPercentage) {
    showToast('Please fill in watch duration and completion percentage', 'error');
    return;
  }


  showLoading();

  try {
    const requestBody = {
      movieId: currentMovieId,
      watchDuration: parseInt(watchDuration),
      completionPercentage: parseInt(completionPercentage)
    };

    const response = await apiRequest(`/users/${currentUserId}/watch`, {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });

    const message = response.data.review 
      ? 'Movie added to watch history with review!' 
      : 'Movie added to watch history!';
    showToast(message, 'success');
    
    // Clear form
    document.getElementById('watchDuration').value = '';
    document.getElementById('completionPercentage').value = '';
    
    // Refresh history if on history tab
    if (document.querySelector('[data-tab="history"]').classList.contains('active')) {
      loadUserHistory(currentUserId);
    }
    
    // Refresh trending if on trending tab
    if (document.querySelector('[data-tab="trending"]').classList.contains('active')) {
      loadTrendingMovies();
    }

    // Refresh reviews in modal
    if (currentMovieId) {
      const reviewsData = await apiRequest(`/movies/${currentMovieId}/reviews?limit=5`);
      const statsData = await apiRequest(`/movies/${currentMovieId}/reviews/stats`);
      displayReviewStats(statsData.data);
      displayReviews(reviewsData.data.reviews);
    }
  } catch (error) {
    showToast(error.message || 'Failed to add to watch history', 'error');
  } finally {
    hideLoading();
  }
}

// Modal Close
document.querySelector('.close').addEventListener('click', () => {
  movieModal.classList.remove('active');
  reviewForm.reset();
  // Clear watch form
  document.getElementById('watchDuration').value = '';
  document.getElementById('completionPercentage').value = '';
});

window.addEventListener('click', (e) => {
  if (e.target === movieModal) {
    movieModal.classList.remove('active');
    reviewForm.reset();
    // Clear watch form
    document.getElementById('watchDuration').value = '';
    document.getElementById('completionPercentage').value = '';
    document.getElementById('watchRating').value = '';
    document.getElementById('watchReviewText').value = '';
  }
});

// User Management Functions
function switchUser() {
  const headerSelect = document.getElementById('userSelectHeader');
  const reviewSelect = document.getElementById('reviewUserSelect');
  const currentUserName = document.getElementById('currentUserName');
  
  const selectedUserId = headerSelect.value;
  
  // Update select elements (removed historySelect since we use global selection)
  reviewSelect.value = selectedUserId;
  
  // Update current user display
  if (selectedUserId) {
    const user = allUsers.find(u => u._id === selectedUserId);
    if (user) {
      currentUserName.textContent = user.name;
      currentUserId = selectedUserId;
      console.log('User switched to:', user.name, 'ID:', currentUserId);
      
      // If on history tab, refresh the data
      if (document.querySelector('[data-tab="history"]').classList.contains('active')) {
        loadUserHistory(currentUserId);
      }
      
      // If on trending tab, refresh with personalized recommendations
      if (document.querySelector('[data-tab="trending"]').classList.contains('active')) {
        loadTrendingMovies();
      }
    }
  } else {
    currentUserName.textContent = 'Select User';
    currentUserId = null;
    console.log('User deselected');
  }
}

function populateUserSelects() {
  const headerSelect = document.getElementById('userSelectHeader');
  const reviewSelect = document.getElementById('reviewUserSelect');
  
  // Create user options HTML
  const userOptions = allUsers.map(user => 
    `<option value="${user._id}">${user.name} (${user.email})</option>`
  ).join('');
  
  // Populate selects (removed historySelect since we use global selection)
  headerSelect.innerHTML = '<option value="">Select User...</option>' + userOptions;
  reviewSelect.innerHTML = '<option value="">Select user...</option>' + userOptions;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('Page loaded, initializing...');
  loadUsers();
});

