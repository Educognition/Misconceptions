// Cyber-Classroom: Misconception Explorer Redesigned Driver

// ----------------------------------------------------
// LMS API Callbacks
// ----------------------------------------------------
function onIconClick(misconceptionId) {
  console.log(`[LMS API] onIconClick triggered. Item ID: ${misconceptionId}`);
  // Learning Management System hook point
}

function onProgressUpdate(count) {
  console.log(`[LMS API] onProgressUpdate triggered. Total Debunked: ${count}`);
  // Learning Management System hook point
}

// ----------------------------------------------------
// State Management
// ----------------------------------------------------
let misconceptionsData = [];
let completedIds = new Set();
let currentView = "categories"; // "categories" | "explorer"
let activeCategory = null; // String name of category or null
let searchQuery = "";
let progressFilter = "all"; // "all" | "debunked" | "remaining"
let activeItem = null;

// Category Information & Summaries
const categoryMetadata = {
  "Human Biology & Medicine": {
    id: "biology",
    icon: "fa-dna",
    textClass: "theme-text-biology",
    description: "Explore misconceptions about neuroscience, bodily functions, and common medical advice that people get wrong. Learn what really happens to your brain, tongue, and body."
  },
  "Astronomy & Physics": {
    id: "physics",
    icon: "fa-user-astronaut",
    textClass: "theme-text-physics",
    description: "Delve into the laws of physics, gravitational orbits, and celestial bodies. Understand the truth about zero gravity, meteor temperatures, and how the seasons actually work."
  },
  "Zoology & Natural World": {
    id: "zoology",
    icon: "fa-paw",
    textClass: "theme-text-zoology",
    description: "Discover the amazing adaptations and behaviors of animals, insects, and earthworms. Debunk myths about chameleon camouflage, dog vision, and bats."
  },
  "History & Human Thought": {
    id: "history",
    icon: "fa-landmark",
    textClass: "theme-text-history",
    description: "Uncover historical errors, myths about figures like Columbus and Napoleon, and popular urban legends. Find out what really happened in medieval times and the Salem trials."
  }
};

// Load progress from sessionStorage
function loadState() {
  const stored = sessionStorage.getItem('cyber_classroom_completed_ids');
  if (stored) {
    try {
      completedIds = new Set(JSON.parse(stored));
    } catch (e) {
      console.error("Error parsing completed state:", e);
      completedIds = new Set();
    }
  }
}

// Save progress to sessionStorage
function saveState() {
  sessionStorage.setItem('cyber_classroom_completed_ids', JSON.stringify(Array.from(completedIds)));
  onProgressUpdate(completedIds.size);
}

// ----------------------------------------------------
// DOM Elements
// ----------------------------------------------------
const categoriesView = document.getElementById('categories-view');
const explorerView = document.getElementById('explorer-view');
const categoriesGrid = document.getElementById('categories-grid');
const cardsGrid = document.getElementById('cards-grid');

// Search and Navigation Controls
const searchInput = document.getElementById('search-input');
const progressFilters = document.querySelectorAll('[data-progress-filter]');
const backToCategoriesBtn = document.getElementById('back-to-categories');

// Dynamic Headers in Explorer View
const explorerCategoryTitle = document.getElementById('explorer-category-title');
const explorerCategoryIcon = document.getElementById('explorer-category-icon');
const explorerCategoryDesc = document.getElementById('explorer-category-desc');

// Statistics Dashboard Elements
const debunkedCounter = document.getElementById('debunked-counter');
const totalCounter = document.getElementById('total-counter');
const progressPercent = document.getElementById('progress-percent');
const progressBar = document.getElementById('progress-bar');
const categoryMasteryEl = document.getElementById('category-mastery');

// Modal Elements
const modalOverlay = document.getElementById('cyber-modal');
const modalClose = document.getElementById('modal-close');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalCategory = document.getElementById('modal-category');
const modalTitle = document.getElementById('modal-title');
const modalMythText = document.getElementById('modal-myth-text');
const modalScienceText = document.getElementById('modal-science-text');
const modalOriginText = document.getElementById('modal-origin-text');
const modalActionBtn = document.getElementById('modal-action-btn');
const modalContentPanel = document.querySelector('.modal-content-panel');

// ----------------------------------------------------
// Navigation & Rendering Logic
// ----------------------------------------------------

// Initialize Application
async function init() {
  loadState();
  await fetchData();
  setupEventListeners();
  updateGlobalDashboard();
  renderCategoryLanding();
}

// Fetch Data payload from data.json
async function fetchData() {
  try {
    const response = await fetch('data.json');
    if (!response.ok) {
      throw new Error(`HTTP fetch failed with code: ${response.status}`);
    }
    misconceptionsData = await response.json();
  } catch (error) {
    console.error("Failed to load data:", error);
    categoriesGrid.innerHTML = `
      <div class="col-span-full border border-red-500 bg-red-950/20 p-6 text-center text-red-400 font-mono">
        <p class="font-bold">SYSTEM ERROR: FAILED TO FETCH DATASET</p>
        <p class="text-sm mt-1">${error.message}</p>
      </div>
    `;
  }
}

// Setup Interactive Events
function setupEventListeners() {
  // Back to categories view button
  backToCategoriesBtn.addEventListener('click', navigateToCategories);
  
  // Search text input
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderExplorerCards();
  });
  
  // Progress filters selection (All, Debunked, Remaining)
  progressFilters.forEach(tab => {
    tab.addEventListener('click', () => {
      progressFilters.forEach(t => {
        t.classList.remove('bg-gray-700', 'text-white');
        t.classList.add('bg-transparent', 'text-gray-400');
      });
      tab.classList.remove('bg-transparent', 'text-gray-400');
      tab.classList.add('bg-gray-700', 'text-white');
      progressFilter = tab.getAttribute('data-progress-filter');
      renderExplorerCards();
    });
  });

  // Modal control buttons
  modalClose.addEventListener('click', closeModal);
  modalCloseBtn.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });
  
  // Modal toggle action (Mark as debunked / Restore myth)
  modalActionBtn.addEventListener('click', () => {
    if (!activeItem) return;
    
    if (completedIds.has(activeItem.id)) {
      completedIds.delete(activeItem.id);
    } else {
      completedIds.add(activeItem.id);
    }
    
    saveState();
    updateGlobalDashboard();
    renderCategoryLanding();
    renderExplorerCards();
    updateModalActionState();
  });

  // Escape key closure
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

// Navigate to Category Selector view
function navigateToCategories() {
  currentView = "categories";
  activeCategory = null;
  searchQuery = "";
  searchInput.value = "";
  
  // Reset progress tab filter to all
  progressFilters.forEach(t => {
    if (t.getAttribute('data-progress-filter') === 'all') {
      t.classList.add('bg-gray-700', 'text-white');
    } else {
      t.classList.remove('bg-gray-700', 'text-white');
      t.classList.add('bg-transparent', 'text-gray-400');
    }
  });
  progressFilter = "all";
  
  explorerView.classList.add('hidden-view');
  categoriesView.classList.remove('hidden-view');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Navigate to specific Domain Explorer view
function navigateToExplorer(categoryName) {
  currentView = "explorer";
  activeCategory = categoryName;
  
  const meta = categoryMetadata[categoryName];
  explorerCategoryTitle.innerText = categoryName;
  explorerCategoryIcon.className = `fas ${meta.icon} ${meta.textClass}`;
  explorerCategoryDesc.innerText = meta.description;
  
  categoriesView.classList.add('hidden-view');
  explorerView.classList.remove('hidden-view');
  
  renderExplorerCards();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Render landing page category cards
function renderCategoryLanding() {
  categoriesGrid.innerHTML = "";
  
  const categories = Object.keys(categoryMetadata);
  
  categories.forEach(cat => {
    const meta = categoryMetadata[cat];
    const catItems = misconceptionsData.filter(item => item.category === cat);
    const catCompleted = catItems.filter(item => completedIds.has(item.id)).length;
    const total = catItems.length || 1;
    const pct = Math.round((catCompleted / total) * 100);
    
    const panel = document.createElement('div');
    panel.className = "cat-card";
    panel.setAttribute('data-cat', meta.id);
    
    panel.innerHTML = `
      <div class="cat-icon-container">
        <i class="fas ${meta.icon}"></i>
      </div>
      <h3 class="text-white text-lg font-bold mb-2 tracking-wide">${cat}</h3>
      <p class="text-sm leading-relaxed mb-4 text-slate-400">${meta.description}</p>
      
      <div class="mt-6 pt-4 border-t border-gray-800">
        <div class="flex justify-between items-center text-xs font-mono text-slate-400 mb-2">
          <span>COMPLETION</span>
          <span class="text-white font-bold">${catCompleted} / ${total} DEBUNKED (${pct}%)</span>
        </div>
        <div class="cat-progress-bar-bg">
          <div class="cat-progress-bar-fill" style="width: ${pct}%;"></div>
        </div>
      </div>
    `;
    
    panel.addEventListener('click', () => {
      navigateToExplorer(cat);
    });
    
    categoriesGrid.appendChild(panel);
  });
}

// Render misconceptions in active category
function renderExplorerCards() {
  if (!activeCategory) return;
  
  cardsGrid.innerHTML = "";
  
  const filtered = misconceptionsData.filter(item => {
    // 1. Must match current category
    if (item.category !== activeCategory) return false;
    
    // 2. Completion filter
    const isCompleted = completedIds.has(item.id);
    if (progressFilter === 'debunked' && !isCompleted) return false;
    if (progressFilter === 'remaining' && isCompleted) return false;
    
    // 3. Search query filter
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const titleMatch = item.title.toLowerCase().includes(q);
      const mythMatch = item.myth.toLowerCase().includes(q);
      const scienceMatch = item.science.toLowerCase().includes(q);
      const originMatch = item.origin.toLowerCase().includes(q);
      
      if (!titleMatch && !mythMatch && !scienceMatch && !originMatch) return false;
    }
    
    return true;
  });
  
  if (filtered.length === 0) {
    cardsGrid.innerHTML = `
      <div class="col-span-full border border-dashed border-gray-700 bg-gray-900/10 p-12 text-center text-gray-500 font-mono">
        <i class="fas fa-search-minus text-2xl mb-2 text-gray-600"></i>
        <p>NO MISCONCEPTIONS DETECTED MATCHING FILTERS</p>
        <p class="text-xs mt-1">Refine your search input or switch tabs</p>
      </div>
    `;
    return;
  }
  
  filtered.forEach(item => {
    const isCompleted = completedIds.has(item.id);
    const card = document.createElement('div');
    card.className = `item-card ${isCompleted ? 'debunked' : ''}`;
    card.setAttribute('data-category', item.category);
    
    card.innerHTML = `
      <div class="flex justify-between items-start mb-3">
        <span class="text-xs font-mono text-slate-500">ID: #${String(item.id).padStart(3, '0')}</span>
        ${isCompleted ? '<span class="status-badge border-emerald-500 text-emerald-400 bg-emerald-500/5">DEBUNKED</span>' : '<span class="status-badge border-gray-700 text-slate-400">UNRESOLVED</span>'}
      </div>
      <h4 class="text-white text-md font-bold mb-2 tracking-wide line-clamp-2">${item.title}</h4>
      <p class="text-slate-400 text-sm line-clamp-3 leading-relaxed mb-4">${item.myth}</p>
      
      <div class="flex justify-between items-center pt-3 border-t border-gray-800/80">
        <span class="text-xs text-slate-500 font-mono">INVESTIGATE</span>
        <button class="w-8 h-8 flex items-center justify-center border border-gray-800 bg-gray-900/30 text-slate-400 hover:text-white transition-colors duration-150 item-icon-btn">
          <i class="fas ${item.icon}"></i>
        </button>
      </div>
    `;
    
    card.addEventListener('click', (e) => {
      const iconBtn = card.querySelector('.item-icon-btn');
      if (iconBtn && iconBtn.contains(e.target)) {
        e.stopPropagation();
        onIconClick(item.id);
        return;
      }
      openModal(item);
    });
    
    cardsGrid.appendChild(card);
  });
}

// Update Dashboard Numbers
function updateGlobalDashboard() {
  const total = misconceptionsData.length || 64;
  const debunked = completedIds.size;
  const percentage = Math.round((debunked / total) * 100);
  
  debunkedCounter.innerText = debunked;
  totalCounter.innerText = total;
  progressPercent.innerText = `${percentage}%`;
  progressBar.style.width = `${percentage}%`;
  
  // Count domains where 100% of myths are debunked
  let mastered = 0;
  const categories = Object.keys(categoryMetadata);
  categories.forEach(cat => {
    const catItems = misconceptionsData.filter(item => item.category === cat);
    if (catItems.length > 0) {
      const catCompleted = catItems.filter(item => completedIds.has(item.id)).length;
      if (catCompleted === catItems.length) {
        mastered++;
      }
    }
  });
  
  categoryMasteryEl.innerText = `${mastered}/4`;
}

// ----------------------------------------------------
// Modal Controls
// ----------------------------------------------------
function openModal(item) {
  activeItem = item;
  
  modalCategory.innerText = item.category;
  modalTitle.innerText = item.title;
  modalMythText.innerText = item.myth;
  modalScienceText.innerText = item.science;
  modalOriginText.innerText = item.origin;
  
  // Visual themes
  const meta = categoryMetadata[item.category];
  modalCategory.className = "font-mono text-xs uppercase tracking-widest";
  if (meta) {
    modalCategory.classList.add(meta.textClass);
    modalContentPanel.style.borderColor = `var(--${meta.id}-color)`;
    modalContentPanel.style.boxShadow = `var(--${meta.id}-glow)`;
  }
  
  updateModalActionState();
  
  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function updateModalActionState() {
  if (!activeItem) return;
  const isCompleted = completedIds.has(activeItem.id);
  
  if (isCompleted) {
    modalActionBtn.className = "panel-btn panel-btn-danger w-full md:w-auto text-xs";
    modalActionBtn.innerHTML = `<i class="fas fa-undo mr-2"></i> RESTORE MYTH`;
  } else {
    modalActionBtn.className = "panel-btn panel-btn-success w-full md:w-auto text-xs";
    modalActionBtn.innerHTML = `<i class="fas fa-check-double mr-2"></i> DEBUNK MYTH`;
  }
}

function closeModal() {
  modalOverlay.classList.remove('active');
  activeItem = null;
  document.body.style.overflow = '';
}

// ----------------------------------------------------
// Interactive Particle Canvas Background (Subtle)
// ----------------------------------------------------
function initCanvasBackground() {
  const canvas = document.getElementById('cyber-canvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;
  
  const particles = [];
  const particleCount = Math.min(45, Math.floor((width * height) / 30000));
  let mouse = { x: null, y: null, radius: 120 };
  
  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.size = Math.random() * 1.2 + 0.4;
      this.speedX = (Math.random() * 0.3) - 0.15;
      this.speedY = (Math.random() * 0.3) - 0.15;
    }
    
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      
      if (this.x < 0) this.x = width;
      if (this.x > width) this.x = 0;
      if (this.y < 0) this.y = height;
      if (this.y > height) this.y = 0;
      
      // Mouse push
      if (mouse.x != null && mouse.y != null) {
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouse.radius) {
          let force = (mouse.radius - dist) / mouse.radius;
          this.x -= (dx / dist) * force * 3;
          this.y -= (dy / dist) * force * 3;
        }
      }
    }
    
    draw() {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }
  
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.x;
    mouse.y = e.y;
  });
  
  window.addEventListener('mouseout', () => {
    mouse.x = null;
    mouse.y = null;
  });
  
  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });
  
  function animate() {
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();
      
      for (let j = i + 1; j < particles.length; j++) {
        let dx = particles[i].x - particles[j].x;
        let dy = particles[i].y - particles[j].y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 150) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(animate);
  }
  
  animate();
}

document.addEventListener('DOMContentLoaded', init);
