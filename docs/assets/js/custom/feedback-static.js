// Import stories data
import { stories } from '../../db/stories.js';

// Pagination settings
const PAGE_SIZE = 5;
let currentPage = 0;
let totalPages = 0;
let mappedStories = mapStoriesImgPosition(stories);
let filteredStories = [];

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

// Function to get current page stories
function getCurrentPageStories() {
  const startIndex = currentPage * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  return filteredStories.slice(startIndex, endIndex);
}

// Function to create a feedback block template (using original carousel design)
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

// Function to update pagination
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

// Function to go to a specific page
function goToPage(page) {
  if (page < 0 || page >= totalPages) return;
  currentPage = page;
  updateFeedbackBlocks();
  updatePagination();
}

// Function to update feedback blocks for current page with smooth transition
function updateFeedbackBlocks() {
  const feedbackContainer = document.getElementById('feedback-blocks');
  if (!feedbackContainer) return;

  // Add fade-out class and wait for transition
  feedbackContainer.classList.add('fade-out');
  
  setTimeout(() => {
    // Clear existing content
    feedbackContainer.innerHTML = '';

    // Get current page stories
    const currentPageStories = getCurrentPageStories();

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

// Initialize the feedback static layout
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

  // Update feedback blocks for first page
  updateFeedbackBlocks();
  
  // Update pagination
  updatePagination();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeFeedbackStatic);
} else {
  initializeFeedbackStatic();
}

// Export for potential external use
export { initializeFeedbackStatic };
