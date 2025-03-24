class FloatingHomeButton {
  constructor() {
    // First check if we should show the button on this URL
    this.checkUrlExclusion().then(shouldShow => {
      if (shouldShow) {
        this.loadColorSettings().then(() => {
          this.injectStyles();
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
          } else {
            this.init();
          }
        });
      }
    });
  }

  async loadColorSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['buttonColor', 'buttonOpacity'], (result) => {
        this.buttonColor = result.buttonColor || '#FFFF00';
        this.buttonOpacity = result.buttonOpacity || 50;
        resolve();
      });
    });
  }

  injectStyles() {
    const normalOpacity = this.buttonOpacity / 100;
    const hoverOpacity = Math.min((this.buttonOpacity + 20) / 100, 1);
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      .home-button-container {
        all: initial;
        position: fixed !important;
        z-index: 2147483647 !important;
        touch-action: none;
        user-select: none;
        width: 50px !important;
        height: 50px !important;
        display: block !important;
        pointer-events: auto !important;
      }

      .home-button {
        all: initial;
        width: 50px !important;
        height: 50px !important;
        border-radius: 25px !important;
        background-color: ${this.buttonColor}${Math.round(normalOpacity * 255).toString(16).padStart(2, '0')} !important;
        cursor: move !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        color: ${this.getContrastColor(this.buttonColor)} !important;
        font-size: 24px !important;
        transition: background-color 0.3s !important;
        box-shadow: 0 2px 10px ${this.buttonColor}${Math.round(normalOpacity * 0.3 * 255).toString(16).padStart(2, '0')} !important;
        opacity: 1 !important;
        visibility: visible !important;
        pointer-events: auto !important;
      }

      @media (hover: hover) {
        .home-button:hover {
          background-color: ${this.buttonColor}${Math.round(hoverOpacity * 255).toString(16).padStart(2, '0')} !important;
        }
      }

      .home-button.active {
        background-color: ${this.buttonColor}${Math.round(hoverOpacity * 255).toString(16).padStart(2, '0')} !important;
      }

      .actions-menu {
        all: initial;
        position: absolute !important;
        display: none !important;
        background-color: white !important;
        border-radius: 8px !important;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1) !important;
        padding: 8px !important;
        width: 150px !important;
        right: 60px !important;
        top: 50% !important;
        transform: translateY(-50%) !important;
        pointer-events: auto !important;
      }

      .actions-menu.visible {
        display: block !important;
      }

      .action-item {
        all: initial;
        display: flex !important;
        align-items: center !important;
        padding: 8px !important;
        cursor: pointer !important;
        border-radius: 4px !important;
        color: #333 !important;
        transition: background-color 0.2s !important;
        pointer-events: auto !important;
      }

      .action-item:hover {
        background-color: #f0f0f0 !important;
      }

      .action-item i {
        margin-right: 8px !important;
        font-size: 18px !important;
        width: 20px !important;
        text-align: center !important;
      }

      .action-item span {
        flex-grow: 1 !important;
      }
    `;
    document.head.appendChild(styleSheet);
  }

  getContrastColor(hexcolor) {
    // Remove the # if present
    hexcolor = hexcolor.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(hexcolor.substr(0, 2), 16);
    const g = parseInt(hexcolor.substr(2, 2), 16);
    const b = parseInt(hexcolor.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return black or white based on luminance
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  }

  init() {
    this.createElements();
    this.initializeButton();
    this.setupEventListeners();
    
    // Load saved position instead of setting default
    this.loadSavedPosition();
  }

  createElements() {
    // Remove existing button if any
    const existingButton = document.querySelector('.home-button-container');
    if (existingButton) {
      existingButton.remove();
    }

    // Create container
    this.container = document.createElement('div');
    this.container.className = 'home-button-container';

    // Create main button
    this.button = document.createElement('div');
    this.button.className = 'home-button';
    this.button.innerHTML = '⌂';

    // Create actions menu
    this.actionsMenu = document.createElement('div');
    this.actionsMenu.className = 'actions-menu';

    // Create action items
    const actions = [
      { icon: '×', text: 'Close Tab', action: () => window.close() },
      { icon: '←', text: 'Go Back', action: () => history.back() },
      { icon: '↑', text: 'To Top', action: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
      { icon: '↻', text: 'Refresh', action: () => location.reload() }
    ];

    actions.forEach(({ icon, text, action }) => {
      const item = document.createElement('div');
      item.className = 'action-item';
      item.innerHTML = `<i>${icon}</i><span>${text}</span>`;
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        action();
        this.hideActions();
      });
      this.actionsMenu.appendChild(item);
    });

    // Append elements
    this.container.appendChild(this.button);
    this.container.appendChild(this.actionsMenu);
    document.body.appendChild(this.container);
  }

  initializeButton() {
    this.isDragging = false;
    // Set initial X position to left side
    this.currentX = 0;
    // Set initial Y position to vertical center
    this.currentY = Math.floor(window.innerHeight / 2 - 25);
    this.initialX = 0;
    this.initialY = 0;
  }

  setupEventListeners() {
    let touchStartTime = 0;
    let hasMoved = false;

    this.button.addEventListener('mousedown', (e) => this.dragStart(e));
    this.button.addEventListener('touchstart', (e) => {
      touchStartTime = Date.now();
      hasMoved = false;
      this.dragStart(e);
    });

    document.addEventListener('mousemove', (e) => this.drag(e));
    document.addEventListener('touchmove', (e) => {
      hasMoved = true;
      this.drag(e);
    }, { passive: false });

    document.addEventListener('mouseup', () => this.dragEnd());
    document.addEventListener('touchend', (e) => {
      const touchDuration = Date.now() - touchStartTime;
      if (!hasMoved && touchDuration < 200) {
        // Short tap without movement - treat as click
        e.preventDefault();
        this.toggleActions();
      }
      this.dragEnd();
    });

    // Remove click event and handle it in touchend
    if (!('ontouchstart' in window)) {
      // Only add click handler for non-touch devices
      this.button.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleActions();
      });
    }

    // Close actions menu when clicking/touching outside
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        this.hideActions();
      }
    });

    document.addEventListener('touchstart', (e) => {
      if (!this.container.contains(e.target)) {
        this.hideActions();
      }
    });
  }

  dragStart(e) {
    if (e.type === 'touchstart') {
      e.preventDefault();
      this.initialX = e.touches[0].clientX - this.currentX;
      this.initialY = e.touches[0].clientY - this.currentY;
    } else {
      this.initialX = e.clientX - this.currentX;
      this.initialY = e.clientY - this.currentY;
    }

    if (e.target === this.button) {
      this.isDragging = true;
    }
  }

  drag(e) {
    if (this.isDragging) {
      e.preventDefault();

      if (e.type === 'touchmove') {
        this.currentX = e.touches[0].clientX - this.initialX;
        this.currentY = e.touches[0].clientY - this.initialY;
      } else {
        this.currentX = e.clientX - this.initialX;
        this.currentY = e.clientY - this.initialY;
      }

      // Constrain to viewport
      this.currentX = Math.min(Math.max(0, this.currentX), window.innerWidth - 50);
      this.currentY = Math.min(Math.max(0, this.currentY), window.innerHeight - 50);

      this.container.style.left = `${this.currentX}px`;
      this.container.style.top = `${this.currentY}px`;

      // Save position while dragging
      this.savePosition();
    }
  }

  dragEnd() {
    this.isDragging = false;
  }

  toggleActions() {
    // Calculate if button is on the left half of the screen
    const buttonRect = this.button.getBoundingClientRect();
    const isOnLeftSide = buttonRect.left < window.innerWidth / 2;

    // Position menu based on button position
    if (isOnLeftSide) {
      this.actionsMenu.style.left = '60px';
      this.actionsMenu.style.right = 'auto';
    } else {
      this.actionsMenu.style.right = '60px';
      this.actionsMenu.style.left = 'auto';
    }

    this.actionsMenu.classList.toggle('visible');
    this.button.classList.toggle('active');
  }

  hideActions() {
    this.actionsMenu.classList.remove('visible');
    this.button.classList.remove('active');
  }

  async checkUrlExclusion() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['excludedUrls'], (result) => {
        const excludedUrls = result.excludedUrls || [];
        const currentUrl = window.location.href;
        
        // Always exclude localhost
        if (window.location.hostname === 'localhost' || 
            window.location.hostname === '127.0.0.1') {
          console.log('Excluding localhost URL:', currentUrl);
          resolve(false);
          return;
        }
        
        // Check if current URL matches any excluded pattern
        const isExcluded = excludedUrls.some(pattern => {
          try {
            // Convert wildcard pattern to regex
            const regexPattern = pattern
              .replace(/\./g, '\\.')
              .replace(/\*/g, '.*');
            const regex = new RegExp(`^${regexPattern}$`);
            return regex.test(currentUrl);
          } catch (e) {
            console.error('Invalid URL pattern:', pattern);
            return false;
          }
        });

        console.log('Current URL:', currentUrl);
        console.log('Excluded URLs:', excludedUrls);
        console.log('Is excluded:', isExcluded);
        
        resolve(!isExcluded);
      });
    });
  }

  loadSavedPosition() {
    chrome.storage.local.get(['buttonPosition'], (result) => {
      if (result.buttonPosition) {
        const { x, y } = result.buttonPosition;
        // Ensure the position is within current viewport
        this.currentX = Math.min(Math.max(0, x), window.innerWidth - 50);
        this.currentY = Math.min(Math.max(0, y), window.innerHeight - 50);
        this.container.style.left = `${this.currentX}px`;
        this.container.style.top = `${this.currentY}px`;
      } else {
        this.setDefaultPosition();
      }
    });
  }

  setDefaultPosition() {
    chrome.storage.sync.get(['defaultPosition', 'defaultX', 'defaultY'], (settings) => {
      const position = settings.defaultPosition || 'left';
      
      if (position === 'custom') {
        // Use custom coordinates
        this.currentX = Math.min(Math.max(0, settings.defaultX || 0), window.innerWidth - 50);
        this.currentY = Math.min(Math.max(0, settings.defaultY || 0), window.innerHeight - 50);
      } else if (position === 'right') {
        // Right middle position
        this.currentX = window.innerWidth - 50;
        this.currentY = Math.floor(window.innerHeight / 2 - 25);
      } else {
        // Left middle position (default)
        this.currentX = 0;
        this.currentY = Math.floor(window.innerHeight / 2 - 25);
      }
      
      this.container.style.left = `${this.currentX}px`;
      this.container.style.top = `${this.currentY}px`;
    });
  }

  savePosition() {
    chrome.storage.local.set({
      buttonPosition: {
        x: this.currentX,
        y: this.currentY
      }
    });
  }
}

// Initialize the floating button
new FloatingHomeButton(); 