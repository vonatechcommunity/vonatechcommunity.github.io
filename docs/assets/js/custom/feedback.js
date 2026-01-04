// Import stories data used to populate the feedback list
import { stories } from '../../db/stories.js';

// -----------------------------------------------------------------------------
// State and configuration
// -----------------------------------------------------------------------------

// Number of feedback items per page
const PAGE_SIZE = 5;

// Pagination state (current page index and total available pages)
let currentPage = 0;
let totalPages = 0;

// Data state (stories with mapped image position + currently filtered set)
let mappedStories = mapStoriesImgPosition(stories);
let filteredStories = [];

// Tracks the latest scheduled render request to avoid race conditions with
// delayed timeouts when users click pagination very quickly.
let renderRequestId = 0;

// -----------------------------------------------------------------------------
// Utility helpers (pure logic, no DOM access)
// -----------------------------------------------------------------------------

/**
 * Toggle the `imageFirst` flag on stories so that items with images alternate
 * between "image first" and "text first" layout for visual variety.
 */
function mapStoriesImgPosition(stories) {
  let previousImageFirst = false;

  return stories.map((storyData) => {
    if (storyData.img && storyData.img.trim() !== '' && !previousImageFirst) {
      storyData.imageFirst = true;
      previousImageFirst = true;
    } else {
      storyData.imageFirst = false;
      previousImageFirst = false;
    }
    return storyData;
  });
}

/**
 * Execute a callback after a given timeout. Kept separate so the delay logic
 * is easy to tweak and test.
 */
function wrapWithTimeout(callback, timeout) {
  return setTimeout(() => {
    callback();
  }, timeout);
}

/**
 * Return the list of stories that belong to the given page index.
 */
function getCurrentPageStories(pageIndex) {
  const startIndex = pageIndex * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  return filteredStories.slice(startIndex, endIndex);
}

// -----------------------------------------------------------------------------
// UI rendering helpers (DOM building and updates)
// -----------------------------------------------------------------------------

/**
 * Render skeleton placeholders into the feedback container while data
 * is "loading" (initial load or pagination change).
 */
function showFeedbackSkeleton() {
  const feedbackContainer = document.getElementById('feedback-blocks');
  if (!feedbackContainer) return;

  feedbackContainer.innerHTML = `
    <div class="py-5" id="feedback-loader">
      <div class="row align-items-start">
        <div class="col-md-7 mb-4 mb-md-0">
          <div class="feedback-skeleton feedback-skeleton-title mb-3"></div>
          <div class="feedback-skeleton feedback-skeleton-subtitle mb-3"></div>
          <div class="feedback-skeleton feedback-skeleton-text"></div>
        </div>
        <div class="col-md-5">
          <div class="feedback-skeleton feedback-skeleton-image ml-md-auto"></div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Create a single feedback block DOM node for a given story, preserving
 * the original Argon carousel look & feel.
 */
function createFeedbackBlock(storyData) {
  const feedbackItem = document.createElement('div');
  feedbackItem.className = 'mb-5'; // Add margin between feedback items
  
  const hasImage = storyData.img && storyData.img.trim() !== '';

  if (hasImage) {
    feedbackItem.innerHTML = `
      <div class="container">
        <div class="row">
          ${storyData.imageFirst ? `
            <div class="col-md-7 ml-auto">
              <h3 class="card-title">${storyData.name}</h3>
              ${storyData.role ? `<h3 class="text-info">${storyData.role}</h3>` : ''}
              <h4 class="lead">
                <i>${storyData.text}</i>
              </h4>
            </div>
            <div class="col-md-5 p-5 ml-auto">
              <div class="p-3">
                <img class="img-fluid rounded shadow transform-perspective-right" 
                     src="${storyData.img}" 
                     alt="${storyData.name}">
              </div>
            </div>
          ` : `
            <div class="col-md-5 p-5 ml-auto">
              <div class="p-3">
                <img class="img-fluid rounded shadow transform-perspective-right" 
                     src="${storyData.img}" 
                     alt="${storyData.name}">
              </div>
            </div>
            <div class="col-md-7 ml-auto">
              <h3 class="card-title">${storyData.name}</h3>
              ${storyData.role ? `<h3 class="text-info">${storyData.role}</h3>` : ''}
              <h4 class="lead">
                <i>${storyData.text}</i>
              </h4>
            </div>
          `}
        </div>
      </div>
    `;
  } else {
    // For stories without images, use full width
    feedbackItem.innerHTML = `
      <div class="container">
        <div class="row">
          <div class="col-md-12 p-5 ml-auto">
            <h3 class="card-title">${storyData.name}</h3>
            ${storyData.role ? `<h3 class="text-info">${storyData.role}</h3>` : ''}
            <h4 class="lead">
              <i>${storyData.text}</i>
            </h4>
          </div>
        </div>
      </div>
    `;
  }
  
  return feedbackItem;
}

/**
 * Rebuild the pagination controls (prev / page numbers / next) according to
 * the current page and the total number of pages.
 */
function updatePagination() {
  const paginationContainer = document.querySelector('#feedback-blocks').parentElement.querySelector('.pagination');
  if (!paginationContainer) return;

  paginationContainer.innerHTML = '';

  // Previous button
  const prevButton = document.createElement('li');
  prevButton.className = `page-item ${currentPage === 0 ? 'disabled' : ''}`;
  prevButton.innerHTML = `
    <a class="page-link" href="#" aria-label="Previous" ${currentPage === 0 ? 'tabindex="-1"' : ''}>
      <i class="fa fa-angle-left"></i>
      <span class="sr-only">Previous</span>
    </a>
  `;
  if (currentPage > 0) {
    prevButton.addEventListener('click', (e) => {
      e.preventDefault();
      goToPage(currentPage - 1);
    });
  }
  paginationContainer.appendChild(prevButton);

  // Page numbers
  for (let i = 0; i < totalPages; i++) {
    const pageButton = document.createElement('li');
    pageButton.className = `page-item ${i === currentPage ? 'active' : ''}`;
    pageButton.innerHTML = `
      <a class="page-link" href="#">${i + 1} ${i === currentPage ? '<span class="sr-only">(current)</span>' : ''}</a>
    `;
    if (i !== currentPage) {
      pageButton.addEventListener('click', (e) => {
        e.preventDefault();
        goToPage(i);
      });
    }
    paginationContainer.appendChild(pageButton);
  }

  // Next button
  const nextButton = document.createElement('li');
  nextButton.className = `page-item ${currentPage === totalPages - 1 ? 'disabled' : ''}`;
  nextButton.innerHTML = `
    <a class="page-link" href="#" aria-label="Next" ${currentPage === totalPages - 1 ? 'tabindex="-1"' : ''}>
      <i class="fa fa-angle-right"></i>
      <span class="sr-only">Next</span>
    </a>
  `;
  if (currentPage < totalPages - 1) {
    nextButton.addEventListener('click', (e) => {
      e.preventDefault();
      goToPage(currentPage + 1);
    });
  }
  paginationContainer.appendChild(nextButton);
}

/**
 * Change the current page, show the skeleton while content is being prepared,
 * then update both the feedback blocks and pagination controls.
 */
function goToPage(page) {
  if (page < 0 || page >= totalPages) return;

  const targetPage = page;
  const requestId = ++renderRequestId;

  // Show skeleton while the next page is being prepared
  showFeedbackSkeleton();

  wrapWithTimeout(() => {
    // Ignore outdated renders if a newer request was scheduled later
    if (requestId !== renderRequestId) return;

    currentPage = targetPage;
    updateFeedbackBlocks(targetPage);
    updatePagination();
  }, 1500);
}

/**
 * Replace the feedback content in the DOM with the items for the given page,
 * using a simple fade-out / fade-in transition and scrolling back to top.
 */
function updateFeedbackBlocks(pageIndex) {
  const feedbackContainer = document.getElementById('feedback-blocks');
  if (!feedbackContainer) return;

  // Add fade-out class and wait for transition
  feedbackContainer.classList.add('fade-out');
  
  setTimeout(() => {
    // Clear existing content
    feedbackContainer.innerHTML = '';

    // Get stories for the requested page
    const currentPageStories = getCurrentPageStories(pageIndex);

    // Create feedback blocks for current page
    currentPageStories.forEach(story => {
      const feedbackBlock = createFeedbackBlock(story);
      feedbackContainer.appendChild(feedbackBlock);
    });

    // Remove fade-out and add fade-in class
    feedbackContainer.classList.remove('fade-out');
    feedbackContainer.classList.add('fade-in');
    
    // Scroll to top of the page smoothly
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
    // Remove fade-in class after transition completes
    setTimeout(() => {
      feedbackContainer.classList.remove('fade-in');
    }, 300); // Match the CSS transition duration
  }, 300); // Wait for fade-out to complete
}

// -----------------------------------------------------------------------------
// Initialization / entry points
// -----------------------------------------------------------------------------

/**
 * Set up static feedback pagination view:
 * - bind DOM container
 * - prepare stories data & pagination
 * - show skeleton briefly
 * - then render the first page and controls
 */
function initializeFeedbackStatic() {
  const feedbackContainer = document.getElementById('feedback-blocks');
  
  if (!feedbackContainer) {
    console.warn('Feedback blocks container not found');
    return;
  }

  // Add the feedback-container class for smooth transitions
  feedbackContainer.classList.add('feedback-container');

  // Use all stories from stories.js (already sorted with photos first)
  filteredStories = [...mappedStories];
  
  // Calculate total pages
  totalPages = Math.ceil(filteredStories.length / PAGE_SIZE);
  
  // Reset to first page
  currentPage = 0;

  // Ensure skeleton is visible before first render as well
  showFeedbackSkeleton();

  const initialPage = 0;
  const requestId = ++renderRequestId;

  // Small delay so the skeleton loader is visible before content is rendered
  wrapWithTimeout(() => {
    // Ignore outdated renders if a newer request was scheduled later
    if (requestId !== renderRequestId) return;

    // Update feedback blocks for first page
    currentPage = initialPage;
    updateFeedbackBlocks(initialPage);
    
    // Update pagination
    updatePagination();
  }, 1500);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeFeedbackStatic);
} else {
  initializeFeedbackStatic();
}

// Export for potential external use
export { initializeFeedbackStatic };
