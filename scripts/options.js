// DOM Elements
const urlList = document.getElementById('urlList');
const addUrlButton = document.getElementById('addUrl');
const saveButton = document.getElementById('save');
const status = document.getElementById('status');

// Load saved settings
document.addEventListener('DOMContentLoaded', () => {
  loadExcludedUrls();
  loadColorSettings();
  loadPositionSettings();
  
  // Add event listeners for color settings
  const buttonColor = document.getElementById('buttonColor');
  const buttonOpacity = document.getElementById('buttonOpacity');
  const opacityValue = document.getElementById('opacityValue');
  const colorPreview = document.getElementById('colorPreview');

  buttonColor.addEventListener('input', updateColorPreview);
  buttonOpacity.addEventListener('input', (e) => {
    opacityValue.textContent = `${e.target.value}%`;
    updateColorPreview();
  });

  // Add event listeners for position settings
  const defaultPosition = document.getElementById('defaultPosition');
  const customPosition = document.getElementById('customPosition');
  const defaultX = document.getElementById('defaultX');
  const defaultY = document.getElementById('defaultY');

  defaultPosition.addEventListener('change', (e) => {
    customPosition.style.display = e.target.value === 'custom' ? 'block' : 'none';
  });

  // Add URL pattern
  document.getElementById('addUrl').addEventListener('click', () => {
    addUrlInput();
  });

  // Save settings
  document.getElementById('save').addEventListener('click', saveSettings);
});

function loadColorSettings() {
  chrome.storage.sync.get(['buttonColor', 'buttonOpacity'], (result) => {
    const color = result.buttonColor || '#FFFF00';
    const opacity = result.buttonOpacity || 50;
    
    document.getElementById('buttonColor').value = color;
    document.getElementById('buttonOpacity').value = opacity;
    document.getElementById('opacityValue').textContent = `${opacity}%`;
    
    updateColorPreview();
  });
}

function updateColorPreview() {
  const color = document.getElementById('buttonColor').value;
  const opacity = document.getElementById('buttonOpacity').value;
  const colorPreview = document.getElementById('colorPreview');
  
  colorPreview.style.backgroundColor = color;
  colorPreview.style.opacity = opacity / 100;
}

function loadExcludedUrls() {
  chrome.storage.sync.get(['excludedUrls'], (result) => {
    const excludedUrls = result.excludedUrls || [];
    const urlList = document.getElementById('urlList');
    urlList.innerHTML = '';
    
    excludedUrls.forEach(url => {
      addUrlInput(url);
    });
    
    if (excludedUrls.length === 0) {
      addUrlInput();
    }
  });
}

function addUrlInput(value = '') {
  const urlList = document.getElementById('urlList');
  const urlItem = document.createElement('div');
  urlItem.className = 'url-item';
  
  const input = document.createElement('input');
  input.type = 'text';
  input.value = value;
  input.placeholder = 'Enter URL pattern (e.g., *.example.com)';
  
  const removeButton = document.createElement('button');
  removeButton.textContent = 'Remove';
  removeButton.className = 'remove';
  removeButton.onclick = () => urlItem.remove();
  
  urlItem.appendChild(input);
  urlItem.appendChild(removeButton);
  urlList.appendChild(urlItem);
}

function loadPositionSettings() {
  chrome.storage.sync.get(['defaultPosition', 'defaultX', 'defaultY'], (result) => {
    const position = result.defaultPosition || 'left';
    const x = result.defaultX || 0;
    const y = result.defaultY || 0;
    
    document.getElementById('defaultPosition').value = position;
    document.getElementById('defaultX').value = x;
    document.getElementById('defaultY').value = y;
    
    document.getElementById('customPosition').style.display = 
      position === 'custom' ? 'block' : 'none';
  });
}

function saveSettings() {
  // Get previous position settings first
  chrome.storage.sync.get(['defaultPosition', 'defaultX', 'defaultY'], (previousSettings) => {
    // Save color settings
    const buttonColor = document.getElementById('buttonColor').value;
    const buttonOpacity = parseInt(document.getElementById('buttonOpacity').value);
    
    // Save position settings
    const defaultPosition = document.getElementById('defaultPosition').value;
    const defaultX = parseInt(document.getElementById('defaultX').value) || 0;
    const defaultY = parseInt(document.getElementById('defaultY').value) || 0;
    
    // Save URL patterns
    const urlInputs = document.querySelectorAll('.url-item input');
    const excludedUrls = Array.from(urlInputs)
      .map(input => input.value.trim())
      .filter(url => url !== '');
    
    // Check if position settings have changed
    const positionChanged = defaultPosition !== previousSettings.defaultPosition ||
      defaultX !== previousSettings.defaultX ||
      defaultY !== previousSettings.defaultY;

    // Save all settings
    chrome.storage.sync.set({
      buttonColor,
      buttonOpacity,
      defaultPosition,
      defaultX,
      defaultY,
      excludedUrls
    }, () => {
      // If position settings changed, clear the saved position
      if (positionChanged) {
        chrome.storage.local.remove(['buttonPosition'], () => {
          console.log('Cleared saved position due to default position change');
        });
      }

      const status = document.getElementById('status');
      status.textContent = 'Settings saved successfully!';
      status.className = 'status success';
      setTimeout(() => {
        status.className = 'status';
      }, 3000);
    });
  });
} 