// Application State
let releaseNotes = [];
let activeCategory = 'all';
let searchQuery = '';
let selectedUpdateId = null; // Stores currently selected update details if any

// DOM Elements
const elements = {
    btnRefresh: document.getElementById('btn-refresh'),
    refreshIcon: document.getElementById('refresh-icon'),
    lastUpdatedTime: document.getElementById('last-updated-time'),
    btnExport: document.getElementById('btn-export'),
    searchInput: document.getElementById('search-input'),
    searchClearBtn: document.getElementById('search-clear-btn'),
    categoryFiltersContainer: document.getElementById('category-filters-container'),
    feedContainer: document.getElementById('feed-container'),
    loadingState: document.getElementById('loading-state'),
    errorState: document.getElementById('error-state'),
    errorMessage: document.getElementById('error-message'),
    emptyState: document.getElementById('empty-state'),
    btnRetry: document.getElementById('btn-retry'),
    btnClearFilters: document.getElementById('btn-clear-filters'),
    
    // Modal Elements
    tweetModal: document.getElementById('tweet-modal'),
    btnCloseModal: document.getElementById('btn-close-modal'),
    btnCancelTweet: document.getElementById('btn-cancel-tweet'),
    btnSubmitTweet: document.getElementById('btn-submit-tweet'),
    tweetTextarea: document.getElementById('tweet-textarea'),
    tweetPreviewDate: document.getElementById('tweet-preview-date'),
    tweetPreviewCategory: document.getElementById('tweet-preview-category'),
    tweetPreviewBody: document.getElementById('tweet-preview-body'),
    charCounter: document.getElementById('char-counter'),
    charRingProgress: document.getElementById('char-ring-progress'),
    themeCheckbox: document.getElementById('theme-checkbox')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupEventListeners();
    fetchReleaseNotes();
});

// Setup Event Listeners
function setupEventListeners() {
    // Theme toggle
    elements.themeCheckbox.addEventListener('change', handleThemeChange);

    // Refresh action
    elements.btnRefresh.addEventListener('click', fetchReleaseNotes);
    elements.btnRetry.addEventListener('click', fetchReleaseNotes);
    elements.btnExport.addEventListener('click', exportFilteredToCSV);
    
    // Search actions
    elements.searchInput.addEventListener('input', handleSearchInput);
    elements.searchClearBtn.addEventListener('click', clearSearch);
    elements.btnClearFilters.addEventListener('click', resetAllFilters);
    
    // Category filter pills
    elements.categoryFiltersContainer.addEventListener('click', handleCategoryClick);
    
    // Modal events
    elements.btnCloseModal.addEventListener('click', closeModal);
    elements.btnCancelTweet.addEventListener('click', closeModal);
    elements.btnSubmitTweet.addEventListener('click', submitTweet);
    elements.tweetTextarea.addEventListener('input', handleTweetTextareaInput);
    
    // Close modal on escape key or clicking backdrop
    elements.tweetModal.addEventListener('click', (e) => {
        if (e.target === elements.tweetModal) closeModal();
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && elements.tweetModal.classList.contains('active')) {
            closeModal();
        }
    });
}

// Fetch Release Notes from Backend Flask API
async function fetchReleaseNotes() {
    showState('loading');
    elements.btnRefresh.classList.add('loading');
    
    try {
        const response = await fetch('/api/release-notes');
        const result = await response.json();
        
        if (response.ok && result.status === 'success') {
            // Flatten updates with custom client IDs for ease of reference
            releaseNotes = result.data.map((day, dayIndex) => {
                return {
                    ...day,
                    updates: day.updates.map((update, updateIndex) => {
                        return {
                            ...update,
                            id: `note-${dayIndex}-${updateIndex}`,
                            date: day.date,
                            link: day.link
                        };
                    })
                };
            });
            
            // Set last checked time
            const now = new Date();
            elements.lastUpdatedTime.textContent = `Last Checked: ${now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}`;
            
            // Render the items
            renderReleaseNotes();
        } else {
            throw new Error(result.message || 'API responded with success: false');
        }
    } catch (error) {
        console.error('Fetch error:', error);
        elements.errorMessage.textContent = error.message || 'The application could not retrieve release notes. Check Flask logs.';
        showState('error');
    } finally {
        elements.btnRefresh.classList.remove('loading');
    }
}

// Helper to toggle visible states (loading, error, empty, content)
function showState(state) {
    elements.loadingState.style.display = state === 'loading' ? 'block' : 'none';
    elements.errorState.style.display = state === 'error' ? 'block' : 'none';
    elements.emptyState.style.display = state === 'empty' ? 'block' : 'none';
    elements.feedContainer.style.display = state === 'content' ? 'block' : 'none';
}

// Handle Search Input with direct rendering
function handleSearchInput(e) {
    searchQuery = e.target.value.toLowerCase().strip();
    
    if (searchQuery.length > 0) {
        elements.searchClearBtn.style.display = 'block';
    } else {
        elements.searchClearBtn.style.display = 'none';
    }
    
    renderReleaseNotes();
}

// Strip whitespace utility since JS trim is standard
String.prototype.strip = function() {
    return this.trim();
};

// Clear Search Input
function clearSearch() {
    elements.searchInput.value = '';
    searchQuery = '';
    elements.searchClearBtn.style.display = 'none';
    renderReleaseNotes();
}

// Reset Search & Category Filters
function resetAllFilters() {
    clearSearch();
    activeCategory = 'all';
    
    // Reset category filter pills UI
    const pills = elements.categoryFiltersContainer.querySelectorAll('.filter-pill');
    pills.forEach(pill => {
        if (pill.dataset.category === 'all') {
            pill.classList.add('active');
        } else {
            pill.classList.remove('active');
        }
    });
    
    renderReleaseNotes();
}

// Handle Category Filter Click
function handleCategoryClick(e) {
    const pill = e.target.closest('.filter-pill');
    if (!pill) return;
    
    // Toggle active classes
    const pills = elements.categoryFiltersContainer.querySelectorAll('.filter-pill');
    pills.forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    
    activeCategory = pill.dataset.category;
    renderReleaseNotes();
}

// Filter and Render Release Notes Timeline
function renderReleaseNotes() {
    // Empty timeline container
    elements.feedContainer.innerHTML = '';
    
    let totalVisibleNotes = 0;
    
    releaseNotes.forEach(day => {
        // Filter the updates in this day
        const filteredUpdates = day.updates.filter(update => {
            // 1. Category Filter
            const categoryMatches = (activeCategory === 'all') || 
                                    (update.category.toLowerCase() === activeCategory.toLowerCase());
            
            // 2. Search Query Filter (Checks text, category, and date)
            const searchMatches = searchQuery === '' || 
                                  update.body_text.toLowerCase().includes(searchQuery) ||
                                  update.category.toLowerCase().includes(searchQuery) ||
                                  day.date.toLowerCase().includes(searchQuery);
                                  
            return categoryMatches && searchMatches;
        });
        
        // If there are updates for this day matching filters, render the group
        if (filteredUpdates.length > 0) {
            totalVisibleNotes += filteredUpdates.length;
            
            const dateGroup = document.createElement('div');
            dateGroup.className = 'date-group';
            
            // Header for date group
            const headerWrapper = document.createElement('div');
            headerWrapper.className = 'date-header-wrapper';
            
            const dot = document.createElement('div');
            dot.className = 'date-indicator-dot';
            
            const header = document.createElement('h2');
            header.className = 'date-header';
            header.textContent = day.date;
            
            headerWrapper.appendChild(dot);
            headerWrapper.appendChild(header);
            dateGroup.appendChild(headerWrapper);
            
            // Render individual update cards
            filteredUpdates.forEach(update => {
                const card = createUpdateCard(update, day);
                dateGroup.appendChild(card);
            });
            
            elements.feedContainer.appendChild(dateGroup);
        }
    });
    
    // Adjust view states
    if (totalVisibleNotes === 0) {
        showState('empty');
    } else {
        showState('content');
    }
}

// Create Card HTML Element
function createUpdateCard(update, day) {
    const card = document.createElement('article');
    card.className = 'update-card';
    card.id = update.id;
    card.setAttribute('aria-label', `Release update: ${update.category} on ${day.date}`);
    
    // Category css class
    const categoryClass = `badge-${update.category.toLowerCase()}`;
    
    card.innerHTML = `
        <div class="update-card-header">
            <div class="badge-and-meta">
                <span class="category-badge ${categoryClass}">${update.category}</span>
                <a href="${day.link}" target="_blank" class="card-link" title="Open source release note in new tab">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i> Docs
                </a>
            </div>
            <div class="card-select-btn" title="Click card to select update">
                <i class="fa-solid fa-check"></i>
            </div>
        </div>
        <div class="update-card-content">
            ${update.body_html}
        </div>
        <div class="card-actions-footer">
            <button class="btn-copy-action" onclick="event.stopPropagation(); copyToClipboard('${update.id}', this)" title="Copy text to clipboard">
                <i class="fa-regular fa-copy"></i>
                <span>Copy</span>
            </button>
            <button class="btn-tweet-action" onclick="event.stopPropagation(); openTweetModal('${update.id}')">
                <i class="fa-brands fa-x-twitter"></i>
                <span>Tweet Update</span>
            </button>
        </div>
    `;
    
    // Selection toggle on card click
    card.addEventListener('click', (e) => {
        // Don't select if user clicked a link inside the card
        if (e.target.tagName.toLowerCase() === 'a' || e.target.closest('a')) {
            return;
        }
        
        // Toggle selected state
        const allCards = elements.feedContainer.querySelectorAll('.update-card');
        const isSelected = card.classList.contains('selected');
        
        // Clear all selections first
        allCards.forEach(c => c.classList.remove('selected'));
        
        if (!isSelected) {
            card.classList.add('selected');
            selectedUpdateId = update.id;
        } else {
            selectedUpdateId = null;
        }
    });
    
    return card;
}

// Find update object helper by custom ID
function findUpdateById(id) {
    for (const day of releaseNotes) {
        const update = day.updates.find(u => u.id === id);
        if (update) return update;
    }
    return null;
}

// Generate the initial pre-composed Tweet text
function generateTweetText(update) {
    // Twitter handles/tags setup
    const hashtags = " #BigQuery #GoogleCloud";
    const readMore = `\n\nRead more: ${update.link}`;
    
    // Prefix text
    const prefix = `🚀 BigQuery [${update.category}] (${update.date}): `;
    
    // Calculate space remaining for the main body content
    // Total 280.
    const reservedLength = prefix.length + hashtags.length + readMore.length;
    const maxBodyLength = 280 - reservedLength - 4; // 4 extra buffer for '...' etc.
    
    let body = update.body_text;
    
    if (body.length > maxBodyLength) {
        body = body.slice(0, maxBodyLength).strip() + "...";
    }
    
    return `${prefix}${body}${hashtags}${readMore}`;
}

// Open Tweet Composer Modal
function openTweetModal(updateId) {
    const update = findUpdateById(updateId);
    if (!update) return;
    
    // Highlight the selected card in the UI
    const allCards = elements.feedContainer.querySelectorAll('.update-card');
    allCards.forEach(c => c.classList.remove('selected'));
    const selectedCard = document.getElementById(updateId);
    if (selectedCard) {
        selectedCard.classList.add('selected');
        selectedUpdateId = updateId;
    }
    
    // Populate Modal Preview details
    elements.tweetPreviewDate.textContent = update.date;
    elements.tweetPreviewCategory.textContent = update.category;
    elements.tweetPreviewCategory.className = `preview-badge badge-${update.category.toLowerCase()}`;
    elements.tweetPreviewBody.textContent = update.body_text;
    
    // Prefill Tweet draft
    const tweetDraft = generateTweetText(update);
    elements.tweetTextarea.value = tweetDraft;
    
    // Open Modal
    elements.tweetModal.classList.add('active');
    elements.tweetModal.setAttribute('aria-hidden', 'false');
    
    // Trigger count validation
    handleTweetTextareaInput();
    
    // Autofocus textarea
    setTimeout(() => {
        elements.tweetTextarea.focus();
    }, 100);
}

// Close Modal
function closeModal() {
    elements.tweetModal.classList.remove('active');
    elements.tweetModal.setAttribute('aria-hidden', 'true');
}

// Handle key press or text edit inside composer text area
function handleTweetTextareaInput() {
    const text = elements.tweetTextarea.value;
    const len = text.length;
    const remaining = 280 - len;
    
    elements.charCounter.textContent = remaining;
    
    // Character limit classes
    if (remaining < 0) {
        elements.charCounter.className = 'char-counter danger';
        elements.btnSubmitTweet.disabled = true;
        elements.btnSubmitTweet.style.opacity = 0.5;
        elements.btnSubmitTweet.style.cursor = 'not-allowed';
    } else if (remaining < 30) {
        elements.charCounter.className = 'char-counter warning';
        elements.btnSubmitTweet.disabled = false;
        elements.btnSubmitTweet.style.opacity = 1;
        elements.btnSubmitTweet.style.cursor = 'pointer';
    } else {
        elements.charCounter.className = 'char-counter';
        elements.btnSubmitTweet.disabled = false;
        elements.btnSubmitTweet.style.opacity = 1;
        elements.btnSubmitTweet.style.cursor = 'pointer';
    }
    
    // Update SVG Progress Ring
    // Radius of progress circle = 10. Stroke length = 2 * PI * R = 62.83
    const maxOffset = 62.83;
    const percentageUsed = Math.min(len / 280, 1.0);
    const offset = maxOffset - (maxOffset * percentageUsed);
    
    elements.charRingProgress.style.strokeDashoffset = offset;
    
    // Update ring progress color based on state
    if (remaining < 0) {
        elements.charRingProgress.style.stroke = '#ef4444'; // Red
    } else if (remaining < 30) {
        elements.charRingProgress.style.stroke = '#f59e0b'; // Amber
    } else {
        elements.charRingProgress.style.stroke = '#1d9bf0'; // Blue
    }
}

// Open Twitter Web Intent to post tweet
function submitTweet() {
    const text = elements.tweetTextarea.value;
    
    if (text.length > 280) {
        alert("Your tweet exceeds the 280 character limit.");
        return;
    }
    
    const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(twitterIntentUrl, '_blank', 'width=550,height=420');
    
    closeModal();
}

// Copy single release note text to clipboard
async function copyToClipboard(updateId, buttonEl) {
    const update = findUpdateById(updateId);
    if (!update) return;
    
    const textToCopy = `🚀 BigQuery [${update.category}] (${update.date}):\n${update.body_text}\n\nRead more: ${update.link}`;
    
    try {
        await navigator.clipboard.writeText(textToCopy);
        
        // Success UI Feedback
        const icon = buttonEl.querySelector('i');
        const label = buttonEl.querySelector('span');
        
        buttonEl.classList.add('copied');
        icon.className = 'fa-solid fa-check';
        label.textContent = 'Copied!';
        
        setTimeout(() => {
            buttonEl.classList.remove('copied');
            icon.className = 'fa-regular fa-copy';
            label.textContent = 'Copy';
        }, 2000);
    } catch (err) {
        console.error('Clipboard copy failed:', err);
        alert('Failed to copy to clipboard. Please grant clipboard permissions.');
    }
}

// Export currently filtered release notes list to CSV
function exportFilteredToCSV() {
    if (releaseNotes.length === 0) {
        alert("No release notes loaded to export.");
        return;
    }
    
    const csvRows = [];
    
    // CSV Header row
    csvRows.push(['Date', 'Category', 'Link', 'Content']);
    
    releaseNotes.forEach(day => {
        day.updates.forEach(update => {
            // Apply matching current search & category filter rules
            const categoryMatches = (activeCategory === 'all') || 
                                    (update.category.toLowerCase() === activeCategory.toLowerCase());
            const searchMatches = searchQuery === '' || 
                                  update.body_text.toLowerCase().includes(searchQuery) ||
                                  update.category.toLowerCase().includes(searchQuery) ||
                                  day.date.toLowerCase().includes(searchQuery);
                                  
            if (categoryMatches && searchMatches) {
                // Escape quotes inside fields for valid CSV formatting
                const dateVal = `"${day.date.replace(/"/g, '""')}"`;
                const catVal = `"${update.category.replace(/"/g, '""')}"`;
                const linkVal = `"${day.link.replace(/"/g, '""')}"`;
                const contentVal = `"${update.body_text.replace(/"/g, '""')}"`;
                
                csvRows.push([dateVal, catVal, linkVal, contentVal]);
            }
        });
    });
    
    // Prevent download if result set is empty
    if (csvRows.length <= 1) {
        alert("No matching notes found to export with the current filter settings.");
        return;
    }
    
    // Join with CSV conventions
    const csvContent = csvRows.map(row => row.join(',')).join('\r\n');
    
    // Download triggers
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    
    // Dynamic filename based on filters
    const categorySlug = activeCategory !== 'all' ? `-${activeCategory.toLowerCase()}` : '';
    const searchSlug = searchQuery ? `-search-${searchQuery.substring(0, 10).replace(/[^a-z0-9]/gi, '_')}` : '';
    link.setAttribute("download", `bigquery-release-notes${categorySlug}${searchSlug}.csv`);
    
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Initialize theme from localStorage or default to dark
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (elements.themeCheckbox) {
        elements.themeCheckbox.checked = (savedTheme === 'light');
    }
}

// Toggle and save theme preference
function handleThemeChange(e) {
    const newTheme = e.target.checked ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}
