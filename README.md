# HomeButtonExtension

A Chrome extension that adds a floating home button similar to the iPhone's virtual home button. The button can be moved around the screen and provides quick access to common browser actions.

![Screenshot](/screenshots/1.png)

## Features

- Draggable floating button that sticks to screen edges
- Quick access to common actions:
  - Close current tab
  - Go back to previous page
  - Scroll to top
  - Refresh page
- Configurable URL exclusion list
- Persistent button position
- Touch-friendly

## Installation

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory

## Usage

- The floating home button will appear on all web pages (except excluded URLs)
- Click and drag the button to move it around
- Click the button to show/hide the action menu
- Click anywhere else on the page to hide the action menu
- Configure excluded URLs in the extension options (click the extension icon and select "Configure Settings")

## Configuration

You can configure which websites should not show the floating button:

1. Click the extension icon in the toolbar
2. Click "Configure Settings"
3. Add URL patterns to exclude (supports wildcards *)
4. Click "Save"

## Development

The extension is built using vanilla JavaScript and Chrome Extension APIs. The main components are:

- `manifest.json`: Extension configuration
- `content.js`: Main functionality for the floating button
- `options.js`: Settings page functionality
- `floating-button.css`: Styles for the floating button
- `options.html`: Settings page UI
- `popup.html`: Extension popup UI

## License

MIT License 