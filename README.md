# Lockbox

> A secure desktop application for managing API keys and tokens with military-grade encryption, biometric authentication, and smart expiry notifications.

[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?logo=github-actions&logoColor=white)](https://github.com)
[![Tests](https://img.shields.io/badge/Coverage-70%25%2B-success)](https://github.com)
[![Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey)](https://github.com)

## Features

- **Touch ID Authentication** - Biometric authentication on macOS with password fallback
- **AES-256-GCM Encryption** - Military-grade encryption for all stored tokens with authentication tags
- **Smart Notifications** - Automatic expiry warnings at 7 days, 1 day, and on expiration
- **Export Tokens** - Export to Bash or .env format for easy integration with development projects
- **SQL Injection Prevention** - Parameterized queries throughout the application
- **Auto-lock Security** - Automatically locks after 15 minutes of inactivity

## Tech Stack

- **Electron** - Cross-platform desktop framework
- **Vite** - Lightning-fast build tool
- **SQLite3** - Embedded database
- **React**, **TypeScript** - Modern UI development
- **Tailwind CSS**, **Radix UI** - Styling and accessible components
- **Node.js Crypto** - AES-256-GCM encryption
- **Jest** - Unit testing with coverage reporting
- **GitHub Actions** - Multi-platform CI/CD pipeline

## Testing & CI/CD

- **Jest Unit Tests** - 70%+ test coverage for business logic
- **GitHub Actions** - Automated testing on Ubuntu, Windows, and macOS for every push and PR
- **Coverage Reports** - HTML reports generated with `npm test` (see [TESTING.md](TESTING.md) for details)

## Getting Started

### Prerequisites

- **Node.js** 20.x or higher
- **Python 3** with PyObjC (macOS only, for Touch ID support)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/meenakship3/lockbox.git
   cd lockbox
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up encryption key**
   ```bash
   # run src/utils/generate/generateKey.js to generate your key
   # save the key to .env
   ```

### Running the Application

```bash
npm run dev
```

This starts the Vite dev server and launches Electron with DevTools enabled.

## License

ISC

## Author

Meenakshi Pradeep

---

Built with React, Electron, and modern security best practices.
