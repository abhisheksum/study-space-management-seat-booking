/**
 * StudyHub - Interactive Gallery & Lightbox Controller
 * 
 * Features:
 * - Category filtering: Study Area, Seating, Facilities, Entrance, Environment, Students Studying
 * - Interactive modal lightbox on image card click
 * - Next / Previous navigation controls
 * - Keyboard navigation (Left, Right, Escape)
 * - Clean dataset mapping to images/gallery/, images/facilities/, images/hero/
 */

const GALLERY_DATA = [
  {
    id: 1,
    title: 'Individual Focus Cubicles',
    category: 'study-area',
    categoryLabel: 'Study Area',
    imagePath: 'images/gallery/study-area-1.jpg',
    description: 'Acoustic privacy partitions with independent task lighting, preventing peripheral distractions.'
  },
  {
    id: 2,
    title: 'Ergonomic High-Back Desks',
    category: 'seating',
    categoryLabel: 'Seating',
    imagePath: 'images/gallery/seating-1.jpg',
    description: 'Korean breathable mesh chairs engineered for 8-12 hour unbroken revision marathons.'
  },
  {
    id: 3,
    title: 'Acoustic Silent Reading Bay',
    category: 'environment',
    categoryLabel: 'Environment',
    imagePath: 'images/gallery/environment-1.jpg',
    description: 'Sound-dampened flooring and anti-echo ceiling panels maintaining strict library silence.'
  },
  {
    id: 4,
    title: 'Spacious Reference Workstations',
    category: 'study-area',
    categoryLabel: 'Study Area',
    imagePath: 'images/gallery/study-area-2.jpg',
    description: 'Wide laminate tables accommodating open laptops, tablets, and bulky legal/medical text modules.'
  },
  {
    id: 5,
    title: 'Lockers & RO Hydration Station',
    category: 'facilities',
    categoryLabel: 'Facilities',
    imagePath: 'images/gallery/facilities-1.jpg',
    description: 'Digital PIN-locked personal book drawers and multi-stage hot/cold pure RO water dispenser.'
  },
  {
    id: 6,
    title: 'Biometric Access Gate & Reception',
    category: 'entrance',
    categoryLabel: 'Entrance',
    imagePath: 'images/gallery/entrance-1.jpg',
    description: 'Contactless fingerprint entry turnstiles ensuring authorized student-only access 24/7.'
  },
  {
    id: 7,
    title: 'Evening Aspirants in Session',
    category: 'students-studying',
    categoryLabel: 'Students Studying',
    imagePath: 'images/gallery/students-1.jpg',
    description: 'Civil services and GATE scholars preparing with uninterrupted Wi-Fi and power backup.'
  },
  {
    id: 8,
    title: 'Adjustable Lumbar Support Chairs',
    category: 'seating',
    categoryLabel: 'Seating',
    imagePath: 'images/gallery/seating-2.jpg',
    description: 'Hydraulic height adjustments and padded armrests minimizing neck and back fatigue.'
  },
  {
    id: 9,
    title: 'Deep Work Mock Test Immersion',
    category: 'students-studying',
    categoryLabel: 'Students Studying',
    imagePath: 'images/gallery/students-2.jpg',
    description: 'Timed full-length test series conducted in distraction-free exam-simulated conditions.'
  },
  {
    id: 10,
    title: 'Centralized HVAC & Fresh Air Unit',
    category: 'environment',
    categoryLabel: 'Environment',
    imagePath: 'images/gallery/environment-1.jpg',
    description: 'Inverter climate control with continuous HEPA air filtration keeping CO2 levels alert.'
  },
  {
    id: 11,
    title: 'Cafeteria & Discussion Pods',
    category: 'facilities',
    categoryLabel: 'Facilities',
    imagePath: 'images/facilities/water-pantry.jpg',
    description: 'Isolated cafeteria lounge for lunch breaks, microwave heating, and casual phone calls.'
  },
  {
    id: 12,
    title: 'Exterior Center Welcome Façade',
    category: 'entrance',
    categoryLabel: 'Entrance',
    imagePath: 'images/hero/hero-study-center.jpg',
    description: 'Located in Knowledge Park III, easily accessible near Metro Station Gate 2.'
  }
];

class GalleryController {
  constructor() {
    this.grid = document.getElementById('gallery-grid');
    this.filterButtons = document.querySelectorAll('.gallery-filter-btn');

    // Lightbox modal elements
    this.modal = document.getElementById('lightbox-modal');
    this.lightboxImg = document.getElementById('lightbox-img');
    this.lightboxTitle = document.getElementById('lightbox-title');
    this.lightboxDesc = document.getElementById('lightbox-desc');
    this.lightboxCounter = document.getElementById('lightbox-counter');
    this.btnClose = document.getElementById('lightbox-close');
    this.btnPrev = document.getElementById('lightbox-prev');
    this.btnNext = document.getElementById('lightbox-next');

    // State
    this.activeCategory = 'all';
    this.filteredItems = [...GALLERY_DATA];
    this.currentIndex = 0;

    if (this.grid) {
      this.init();
    }
  }

  init() {
    // 1. Render all gallery items
    this.renderGallery();

    // 2. Category button clicks
    this.filterButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const cat = e.currentTarget.getAttribute('data-category');
        this.filterButtons.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.filterCategory(cat);
      });
    });

    // 3. Modal controls
    if (this.btnClose) {
      this.btnClose.addEventListener('click', () => this.closeLightbox());
    }

    if (this.btnPrev) {
      this.btnPrev.addEventListener('click', () => this.prevImage());
    }

    if (this.btnNext) {
      this.btnNext.addEventListener('click', () => this.nextImage());
    }

    // 4. Close when clicking modal backdrop
    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) {
          this.closeLightbox();
        }
      });
    }

    // 5. Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!this.modal || !this.modal.classList.contains('active')) return;
      if (e.key === 'Escape') this.closeLightbox();
      if (e.key === 'ArrowLeft') this.prevImage();
      if (e.key === 'ArrowRight') this.nextImage();
    });
  }

  filterCategory(category) {
    this.activeCategory = category;
    if (category === 'all') {
      this.filteredItems = [...GALLERY_DATA];
    } else {
      this.filteredItems = GALLERY_DATA.filter(item => item.category === category);
    }
    this.renderGallery();
  }

  renderGallery() {
    if (!this.grid) return;
    this.grid.innerHTML = '';

    if (this.filteredItems.length === 0) {
      this.grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: var(--bg-surface); border-radius: var(--radius-lg); border: 1px solid var(--border-light);">
          <i class="fa-regular fa-image" style="font-size: 2.5rem; color: var(--text-subtle); margin-bottom: 0.75rem;"></i>
          <h4 style="color: var(--text-main);">No photos found in this category.</h4>
        </div>
      `;
      return;
    }

    this.filteredItems.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = 'gallery-item';
      card.setAttribute('data-id', item.id);
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `View photo: ${item.title}`);

      card.innerHTML = `
        <div class="gallery-img-container">
          <img src="${item.imagePath}" alt="${item.title}" loading="lazy" onerror="this.onerror=null; this.src='images/gallery-1.jpg';">
          <span class="gallery-overlay-badge">${item.categoryLabel}</span>
          <div class="gallery-zoom-icon">
            <i class="fa-solid fa-magnifying-glass-plus"></i>
          </div>
        </div>
        <div class="gallery-info-block">
          <div>
            <h4>${item.title}</h4>
            <p>${item.description}</p>
          </div>
          <span style="font-size: 0.8rem; font-weight: 600; color: var(--accent); margin-top: 0.75rem; display: inline-flex; align-items: center; gap: 0.35rem;">
            Click to expand <i class="fa-solid fa-arrow-right"></i>
          </span>
        </div>
      `;

      card.addEventListener('click', () => this.openLightbox(idx));
      card.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.openLightbox(idx);
      });

      this.grid.appendChild(card);
    });
  }

  openLightbox(index) {
    if (!this.modal) return;
    this.currentIndex = index;
    this.updateLightboxContent();
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }

  closeLightbox() {
    if (!this.modal) return;
    this.modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  prevImage() {
    if (this.filteredItems.length <= 1) return;
    this.currentIndex = (this.currentIndex - 1 + this.filteredItems.length) % this.filteredItems.length;
    this.updateLightboxContent();
  }

  nextImage() {
    if (this.filteredItems.length <= 1) return;
    this.currentIndex = (this.currentIndex + 1) % this.filteredItems.length;
    this.updateLightboxContent();
  }

  updateLightboxContent() {
    const item = this.filteredItems[this.currentIndex];
    if (!item) return;

    if (this.lightboxImg) {
      this.lightboxImg.src = item.imagePath;
      this.lightboxImg.alt = item.title;
    }

    if (this.lightboxTitle) {
      this.lightboxTitle.textContent = item.title;
    }

    if (this.lightboxDesc) {
      this.lightboxDesc.textContent = `${item.categoryLabel} • ${item.description}`;
    }

    if (this.lightboxCounter) {
      this.lightboxCounter.textContent = `${this.currentIndex + 1} / ${this.filteredItems.length}`;
    }
  }
}

// Auto-initialize when gallery DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('gallery-grid')) {
    window.galleryController = new GalleryController();
  }
});
