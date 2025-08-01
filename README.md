# LeakSight Frontend 🛡️  
**Threat Intelligence Monitoring UI**

This is the Angular frontend for **LeakSight**, a platform for monitoring and enriching threat intelligence indicators. It currently includes authentication, core services, IOC management, and enrichment modules for IPs, domains, URLs, and file hashes.

---

## 🚀 Overview

LeakSight helps cybersecurity professionals monitor, enrich, and manage Indicators of Compromise (IOCs) with real-time intelligence.

### 🔐 Authentication (`/auth`)
- Secure login using JWT tokens  
- AuthGuard protection for restricted routes  
- Session handling via HTTP interceptors  

### ⚙️ Core Services (`/core`)
- API communication and configuration  
- JWT token interception  
- Global error handling  

### 🧠 IOC Management (`/ioc`)
- Create, read, update, delete Indicators of Compromise  
- IOC types may include hashes, IPs, URLs, and domains  
- Clean UI for managing threat entries  

### 🛰️ IOC Enrichment (`/enrichment`)
- Query real-time threat data from third-party APIs  
- View enrichment results by job ID  
- Modules:  
  - `/enrichment/ip`  
  - `/enrichment/url`  
  - `/enrichment/domain`  
  - `/enrichment/hash`

---

## 📂 Project Structure
```css
src/
├── app/
│ ├── auth/ # Authentication services & components
│ ├── core/ # Interceptors, guards, base services 
| ├── components/ # Core components
| |     ├── ioc/ # IOC CRUD views and services
│ |     └── enrichment/ # Threat data enrichment by IOC type
| ├── services/ # Shared services
| └── shared/ # Shared modules
└── assets/ # Static assets
```
## 📦 Tech Stack

- Angular  19  
- RxJS  
- Angular Forms  
- JWT-based Auth  
- SCSS or Tailwind (optional)  
- ApexCharts or raw Chart.js (optional)

---

## 🔧 Setup & Run

### 1. Clone & Install

```bash
git clone https://github.com/GHYounesse/LeakSight-Frontend.git
cd LeakSight-Frontend
npm install
```

### 2. Start the development server

```bash
ng serve
```

