# 🔗 Link Extractor Chrome Extension

A powerful Chrome extension that extracts and analyzes all links from any webpage you're currently viewing.

## Features

- **⚡ Auto-Extract Links**: Automatically extracts links when you open the extension popup
- **🔍 Smart Extraction**: Intelligently handles dynamic content and injection timing
- **📊 Link Analysis**: Categorize links as internal or external with detailed statistics
- **🔎 Search & Filter**: Search through extracted links and filter by type
- **📋 Copy Links**: Copy individual links or all links at once
- **📄 Export Data**: Export link data as JSON for further analysis
- **🔄 Refresh Option**: Manual refresh button for updated content
- **📱 Responsive Design**: Clean, modern UI that works reliably

## Installation

1. **Open Chrome Extensions Page**:
   - Open Google Chrome
   - Navigate to `chrome://extensions/`
   - Or go to Menu → More Tools → Extensions

2. **Enable Developer Mode**:
   - Toggle the "Developer mode" switch in the top-right corner

3. **Load the Extension**:
   - Click "Load unpacked"
   - Select the `linkExtractor` folder containing the extension files
   - The extension should now appear in your extensions list

4. **Pin the Extension**:
   - Click the puzzle piece icon (🧩) in Chrome's toolbar
   - Find "Link Extractor" and click the pin icon to keep it visible

## Usage

1. **Navigate to Any Webpage**: Go to any website you want to extract links from
2. **Open the Extension**: Click the Link Extractor icon in your Chrome toolbar
3. **Links Auto-Extract**: Links are automatically extracted when the popup opens
4. **Use the Features**:
   - **Search**: Type in the search box to filter links
   - **Filter**: Toggle internal/external link visibility
   - **Copy**: Click "Copy All Links" to copy all links to clipboard
   - **Export**: Click "Export as JSON" to download link data
   - **Refresh**: Click "Refresh Links" if page content has changed

## File Structure

```
linkExtractor/
├── manifest.json       # Extension configuration
├── popup.html         # Extension popup interface
├── popup.js           # Popup logic and interactions
├── content.js         # Content script for link extraction
├── styles.css         # Styling for the popup
├── icons/             # Extension icons
│   ├── icon.svg       # SVG icon source
│   ├── icon16.png     # 16x16 icon
│   ├── icon32.png     # 32x32 icon
│   ├── icon48.png     # 48x48 icon
│   └── icon128.png    # 128x128 icon
└── README.md          # This file
```

## How It Works

1. **Auto-Injection**: The extension automatically injects the content script when needed
2. **Smart Retry**: Uses retry logic with fallback content script injection for reliability  
3. **Content Script**: The `content.js` file extracts link information from webpages
4. **Popup Interface**: The popup provides a user-friendly interface to view and interact with extracted links
5. **Message Passing**: The popup communicates with the content script using Chrome's messaging API

## Data Extracted

For each link, the extension extracts:
- **URL**: The full link URL
- **Text**: The visible link text
- **Type**: Internal or external classification
- **Domain**: The link's domain name

## Privacy & Security

- **No Data Collection**: This extension does not collect or store any personal data
- **Local Processing**: All link extraction happens locally in your browser
- **No Network Requests**: The extension doesn't send data to external servers
- **Minimal Permissions**: Only requests necessary permissions (activeTab, scripting)

## Browser Compatibility

- **Chrome**: Fully supported (Manifest V3)
- **Edge**: Should work with Chromium-based Edge

## Troubleshooting

### Extension Not Working
- The extension now auto-extracts links, so no manual action needed
- If it still doesn't work, try clicking "Refresh Links"
- Make sure you've enabled the extension in `chrome://extensions/`

### No Links Found
- Some websites may load links dynamically via JavaScript
- Try clicking "Refresh Links" after the page has fully loaded
- The extension now automatically handles most timing issues

### Page Refresh Required (Fixed!)
- **This issue has been resolved!** You no longer need to refresh pages
- The extension automatically injects content scripts when needed

### Permission Issues
- The extension requires the "activeTab" and "scripting" permissions
- Make sure you've granted necessary permissions during installation

## License

This project is open source and available under the MIT License.

---

**Happy Link Extracting! 🔗✨**
