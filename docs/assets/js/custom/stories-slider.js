// Import stories data
import { stories } from '../../db/stories.js';

// Function to populate a story component with data
function populateStory(component, storyData) {
  component.href = `/feedback`;
  const photo = component.querySelector('.story-author-photo');
  const author = component.querySelector('.story-author');
  const text = component.querySelector('.story-text');

  // Handle photo - hide if no image
  if (photo) {
    if (storyData.img && storyData.img.trim() !== '') {
      photo.src = storyData.img;
      photo.style.display = 'block';
      photo.classList.remove('no-photo');
    } else {
      photo.style.display = 'none';
      photo.classList.add('no-photo');
    }
  }

  // Handle author name - make it a link if LinkedIn exists, otherwise just text
  if (author) {
    if (storyData.linkedin && storyData.linkedin.trim() !== '') {
      // Create LinkedIn link
      author.innerHTML = `<a href="${storyData.linkedin}" target="_blank" class="text-white">${storyData.name}</a>`;
    } else {
      // Just text
      author.textContent = storyData.name;
    }
  }

  // Handle story text
  if (text) {
    text.textContent = `"${storyData.text}"`;
  }
}

// Shuffle helper
function shuffle(array) {
  return array.sort(() => 0.5 - Math.random());
}

// Get a template component to clone
const templateComponent = document.querySelector('#stories-pool .story-card');

// Shuffle stories and pick some for display
const selectedStories = shuffle([...stories]).slice(0, stories.length);

// Inject them into Swiper
const wrapper = document.getElementById('custom-slider');

selectedStories.forEach((storyData, index) => {
  const slide = document.createElement('div');
  slide.className = 'swiper-slide d-flex align-items-center justify-content-center';
  
  // Clone the template component
  const storyComponent = templateComponent.cloneNode(true);
  
  // Populate with story data
  populateStory(storyComponent, storyData);
  
  // Add background color variation
  const bgColors = ['bg-primary', 'bg-default', 'bg-primary', 'bg-default', 'bg-primary', 'bg-default'];
  const textColors = ['text-white', 'text-white', 'text-white', 'text-white', 'text-white', 'text-white'];
  const colorIndex = index % bgColors.length;
  
  storyComponent.classList.add(bgColors[colorIndex], textColors[colorIndex]);
  
  slide.appendChild(storyComponent);
  wrapper.appendChild(slide);
});

// If we have fewer than 4 stories, duplicate some for smooth looping
if (selectedStories.length < 4) {
  selectedStories.forEach((storyData, index) => {
    const slide = document.createElement('div');
    slide.className = 'swiper-slide d-flex align-items-center justify-content-center';
    
    const storyComponent = templateComponent.cloneNode(true);
    populateStory(storyComponent, storyData);
    
    storyComponent.classList.add(bgColors[colorIndex], textColors[colorIndex]);
    
    slide.appendChild(storyComponent);
    wrapper.appendChild(slide);
  });
}

// Init Swiper
const swiper = new Swiper('.swiper', {
  loop: true,
  slidesPerView: 3,
  spaceBetween: 20,
  autoplay: {
    delay: 3000,   // 3 seconds
    disableOnInteraction: false
  },
  pagination: {
    el: '.swiper-pagination',
    clickable: true
  },

  breakpoints: {
    0: { slidesPerView: 1 },
    768: { slidesPerView: 2 },
    992: { slidesPerView: 3 }
  }
});

// Initialize Bootstrap tooltips for full text on hover/focus
if (window.bootstrap && typeof window.bootstrap.Tooltip === 'function') {
  const tooltipTriggerList = Array.from(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.forEach(el => new window.bootstrap.Tooltip(el, { trigger: 'hover focus' }));
} 