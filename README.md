# 💾 CYBEREXTRACTOR v2.0

A Chrome extension for extracting links and emails from web pages with a unique cyberpunk/retro-futuristic theme.

SEO-friendly summary
- Link extractor and email extractor for any webpage
- Filter internal/external, visible/hidden; live search
- Copy results or export to JSON and Excel (XLSX)
- Fast popup, no tracking, privacy-friendly

## 🔎 Features

- Extract all links from the current page
- Filter links by internal/external
- Extract all emails from the current page
- Search and filter capabilities
- Copy to clipboard functionality
- Export to JSON and Excel
- Interactive cyberpunk UI with animations and effects
- Hidden Easter eggs and features

## 🧭 Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the extension folder

## 🧪 Usage

1. Open any webpage
2. Click the extension icon
3. Choose LINKS or EMAILS, then Extract
4. Filter/search, Copy, or Export (JSON/XLSX)

## 🌐 Localization (i18n)

- Default locale: `en`
- Manifest strings use `__MSG_*__` placeholders
- Add more locales under `_locales/<lang>/messages.json`

## 🛡️ Privacy

- No analytics, no remote calls. All processing is local.

## 🛠️ Dev Notes

- XLSX is lazy-loaded to speed popup load
- Animations deferred on idle; interval leak fixed
- Store listing draft: `STORE-LISTING.md`

## 📄 License

MIT

---

Enjoy your cyberpunk-themed link extraction experience! 💻✨
