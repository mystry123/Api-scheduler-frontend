# API Scheduler UI

A modern, elegant frontend for the API Scheduler built with Remix and shadcn/ui.

## Features

- **Dashboard**: Real-time metrics and system overview
- **Targets Management**: Create, edit, and delete HTTP endpoint configurations
- **Schedules Management**: Configure interval and window-based schedules
- **Runs Monitoring**: View execution history with filtering and auto-refresh
- **Dark Mode**: Toggle between light and dark themes
- **Responsive**: Works on desktop and mobile devices

## Tech Stack

- **Remix** - Full-stack React framework
- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** - Beautiful, accessible components
- **Radix UI** - Headless UI primitives
- **Lucide Icons** - Beautiful icons

## Getting Started

### Prerequisites

- Node.js 18+
- API Scheduler backend running on http://localhost:8000

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The UI will be available at http://localhost:3000

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
app/
├── components/
│   ├── ui/           # shadcn/ui components
│   └── layout.tsx    # Main layout with sidebar
├── lib/
│   ├── api.ts        # API client
│   └── utils.ts      # Utility functions
├── routes/
│   ├── _index.tsx    # Dashboard
│   ├── targets.tsx   # Targets page
│   ├── schedules.tsx # Schedules page
│   └── runs.tsx      # Runs page
├── styles/
│   └── globals.css   # Global styles and theme
└── root.tsx          # Root layout
```

## Configuration

Create a `.env` file:

```
API_URL=http://localhost:8000
```

## Design System

The UI uses a refined, elegant color palette:

- **Light Mode**: Warm grays with subtle blue accents
- **Dark Mode**: Deep slate blues with soft highlights
- **Status Colors**: Muted, professional tones for success/warning/error states

## License

MIT
