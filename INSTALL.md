# 🚀 Quick Installation Guide

## 1. Load the Extension in Chrome

1. **Open Chrome Extensions Page**:
   ```
   chrome://extensions/
   ```

2. **Enable Developer Mode**:
   - Toggle the "Developer mode" switch in the top-right corner

3. **Load Unpacked Extension**:
   - Click "Load unpacked"
   - Select the `linkExtractor` folder
   - The extension should appear with a green "Enabled" status

4. **Pin the Extension**:
   - Click the puzzle piece icon (🧩) in Chrome's toolbar
   - Find "Link Extractor" and click the pin icon

## 2. Test the Extension

1. Navigate to any website (try reddit.com, github.com, or news.ycombinator.com)
2. Click the Link Extractor icon in your toolbar
3. Click "Extract Links" button
4. You should see all links from the page appear in the popup

## 3. Features to Try

- ✅ **Extract Links**: Get all links from any webpage
- ✅ **Search**: Filter links by typing in the search box
- ✅ **Filter**: Toggle internal/external link visibility
- ✅ **Copy**: Copy individual links or all links at once
- ✅ **Highlight**: Click "Highlight" to highlight links on the page
- ✅ **Export**: Download link data as JSON

## 4. Troubleshooting

### Extension not loading?
- Make sure Developer mode is enabled
- Check that all files are in the correct location
- Look for error messages in the Extensions page

### No links found?
- Make sure the webpage has finished loading
- Some sites may block content scripts
- Try on a different website

### Permission issues?
- The extension needs "activeTab" permission
- This is automatically granted when you load the extension

## 5. Development

To modify the extension:
1. Edit the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon for "Link Extractor"
4. Test your changes

---

**🎉 You're all set! Happy link extracting!**
