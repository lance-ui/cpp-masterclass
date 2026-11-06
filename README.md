# C++ MasterClass

A browser-based C++ course with lessons, Google Drive video and PDF links, quizzes, a code playground, bookmarks, notes, and local progress tracking.

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Run locally

```sh
npm install
npm run dev
```

Vite prints the local URL when the development server starts.

## Build and preview

```sh
npm run lint
npm test
npm run build
npm run preview
```

The production files are written to `dist/`. `npm run preview` serves that output locally.

## Deploy

Deploy `dist/` to any static hosting provider. For a connected repository, set the build command to `npm run build` and the publish directory to `dist`. No server or API keys are required. Course media is linked from Google Drive and may require an internet connection and access to the source files.

Progress, bookmarks, and notes are stored in the browser's local storage; they are not synced between devices.

The app can be installed as a PWA. Its service worker caches the app shell and same-origin assets after they are opened online. Google Drive videos and PDFs are external and still require an internet connection.
