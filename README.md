# 🚀 WhatsApp Bulk Portal (Frontend)

A modern, responsive frontend for a **WhatsApp Bulk Messaging Portal**, built using **React + TailwindCSS**.  
This portal allows users to send bulk WhatsApp campaigns, manage contacts, create templates, upload media, and track reports.

---

## 📌 Features

### 🔹 Authentication & Dashboard
- User login & registration (JWT-based auth)
- Role-based access (Admin / Reseller / Client)
- Interactive dashboard with campaign stats

### 🔹 Contact Management
- Import contacts via **CSV/Excel/Google Contacts**
- Group creation (Audience Segmentation)
- Duplicate removal & data cleaning
- Search & filter contacts

### 🔹 Template Management
- Save reusable templates (**Marketing / Utility / OTP**)
- Rich-text editor with placeholders (e.g. `{{name}}`)
- Media attachments for templates
- WhatsApp Business API approved template (HSM) support

### 🔹 Media Library
- Upload & reuse images, videos, PDFs
- Drag & Drop uploader with preview
- File size limit warnings (e.g. `20MB for videos`)
- Organized media grid/list view

### 🔹 Campaign Management
- Create, schedule, and manage bulk campaigns
- Attach templates or custom messages
- Select audiences (Groups / Segments)
- Track delivery, read, and failure stats

### 🔹 Reports & Analytics
- Campaign performance dashboard
- Export reports (CSV, Excel, PDF)
- Message logs with status tracking

---

## 🛠️ Tech Stack

- **React 18+**
- **Tailwind CSS** (UI styling)
- **Framer Motion** (animations)
- **React Router** (routing)
- **Axios / Fetch** (API integration)
- **ShadCN/UI** components

---

## ⚙️ Installation & Setup

### 1️⃣ Clone Repository
```bash
git clone https://github.com/your-username/WhatsApp_Bulk_Portal_Frontend.git
cd WhatsApp_Bulk_Portal_Frontend
```

### 2️⃣ Install Dependencies
```bash
# Using npm
npm install

# Using yarn
yarn install

# Using bun (recommended for faster installation)
bun install
```

### 3️⃣ Environment Configuration
Create a `.env` file in the root directory:
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_NAME=WhatsApp Bulk Portal

# WhatsApp Business API
VITE_WHATSAPP_API_URL=https://graph.facebook.com/v18.0
VITE_WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
VITE_WHATSAPP_ACCESS_TOKEN=your_access_token

# Third-party Services
VITE_RAZORPAY_KEY=your_razorpay_key
VITE_GOOGLE_CLIENT_ID=your_google_client_id

# Development Settings
VITE_DEV_MODE=true
```

### 4️⃣ Development Server Setup
```bash
# Start development server
npm run dev
# or
yarn dev
# or
bun dev

# The application will be available at:
# http://localhost:8080
```

### 5️⃣ Build for Production
```bash
# Build for production
npm run build

# Build for development mode
npm run build:dev

# Preview production build
npm run preview
```

---

## 🏗️ Frontend Architecture

### Project Structure
```
src/
├── app/                 # App-level configurations
├── assets/              # Static assets (images, icons)
├── components/          # Reusable UI components
│   ├── ui/             # ShadCN/UI components
│   └── common/         # Custom components
├── contexts/           # React contexts (Auth, Theme)
├── features/           # Feature-based modules
│   ├── auth/          # Authentication
│   ├── campaigns/     # Campaign management
│   ├── contacts/      # Contact management
│   └── reports/       # Reports & analytics
├── hooks/              # Custom React hooks
├── lib/               # Utility functions and configurations
├── pages/             # Page components
├── services/          # API services
└── store/             # Redux store configuration
```

### Key Technologies Used
- **React 18.3.1** - Core UI framework
- **TypeScript** - Type safety
- **Vite 5.4.19** - Build tool & dev server
- **TailwindCSS 3.4.17** - Utility-first CSS framework
- **ShadCN/UI** - Component library
- **Radix UI** - Headless UI primitives
- **React Router 6.30.1** - Client-side routing
- **Redux Toolkit** - State management
- **React Query** - Server state management
- **Framer Motion** - Animations
- **React Hook Form** - Form handling
- **Zod** - Schema validation

---

## 🚀 Development Workflow

### Code Quality & Linting
```bash
# Run ESLint
npm run lint

# Fix linting issues automatically
npm run lint:fix
```

### Component Development
1. Create components in `src/components/`
2. Use TypeScript for type safety
3. Follow ShadCN/UI patterns for consistency
4. Test components in isolation

### State Management
- **Redux Toolkit** for global state (user, settings)
- **React Query** for server state (API data)
- **Local state** for component-specific data

### API Integration
```typescript
// Example API call using axios
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Template System & Special Handling

#### Specific Template Names
The application includes a predefined list of template names that require special handling:

```typescript
const specificTemplateNames = [
  "poster_details",
  "opening_with_poster", 
  "opening",
  "opening_with_video",
  "video_details",
  "grand_tapi_video_info",
  "grand_tapi_video_contact",
  "grand_tapi_photo_info",
  "grand_tapi_photo_contact",
  "beingyou_intro_with_poster",
  "beingyou_intro",
  "beingyou_naturalcare_event_with_poster",
];
```

#### Why These Templates Are Special:
- **Button Variables**: These templates handle button variables differently
- **Redirect Logic**: Automatically include "redirectwhatsapp" variable
- **UI Rendering**: Some UI sections are hidden for these templates
- **Component Processing**: Different logic for button components

#### Template Handling Logic:
```typescript
// Button variable formatting
if (specificTemplateNames.includes(selectedTemplate.name)) {
  formattedButtonVariables.push("redirectwhatsapp");
} else {
  // Standard button variable processing
}

// UI conditional rendering
{buttonVariables.length > 0 && 
  !specificTemplateNames.includes(selectedTemplate.name) && (
    // Render button variables section
  )}
```

---

## 🎨 UI/UX Guidelines

### Design System
- **Primary Colors**: Blue gradient theme
- **Typography**: Inter font family
- **Spacing**: TailwindCSS spacing scale
- **Components**: ShadCN/UI component library

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- All components are responsive by default

### Accessibility
- Semantic HTML5 elements
- ARIA labels for screen readers
- Keyboard navigation support
- High contrast mode support

---

## 🔧 Configuration Files

### Vite Configuration (`vite.config.ts`)
- Development server on port 8080
- Path aliases (`@/` points to `src/`)
- React SWC plugin for fast refresh
- Component tagger for development
- **API Proxy**: All `/api` requests are automatically proxied to `https://policysarthi-whatsapp.fableadtech.in/services`

#### Proxy Configuration
The development server includes a proxy configuration to handle API requests:
```typescript
proxy: {
  "/api": {
    target: "https://policysarthi-whatsapp.fableadtech.in/services",
    changeOrigin: true,
    secure: false,
  },
}
```

This means:
- Frontend API calls to `/api/*` are automatically forwarded to the backend
- CORS issues are avoided during development
- No need to configure CORS on the backend for local development

### Tailwind Configuration (`tailwind.config.ts`)
- Custom color palette
- Typography plugin
- Animation utilities
- Design tokens

### TypeScript Configuration
- Strict type checking
- Path mapping for imports
- React types support

---

## 📦 Build & Deployment

### Production Build
```bash
# Optimized production build
npm run build

# Build output in /dist directory
# Ready for deployment to any static hosting
```

### Deployment Options

#### 1. Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### 2. Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

#### 3. Static Hosting (Apache/Nginx)
1. Run `npm run build`
2. Upload `dist/` folder to server
3. Configure server for SPA routing

### Environment Variables in Production
Set environment variables in your hosting platform:
- `VITE_API_BASE_URL`
- `VITE_WHATSAPP_API_URL`
- `VITE_RAZORPAY_KEY`
- And other required variables

---

## 🐛 Common Issues & Solutions

### 1. Port Already in Use
```bash
# Kill process on port 8080
npx kill-port 8080

# Or use different port
npm run dev -- --port 3000
```

### 2. Module Resolution Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### 3. TypeScript Errors
```bash
# Check TypeScript configuration
npx tsc --noEmit

# Update types if needed
npm update @types/react @types/react-dom
```

### 4. CORS Issues
Configure your backend to allow requests from `http://localhost:8080`

---

## 📱 Browser Support

- **Chrome** 90+
- **Firefox** 88+
- **Safari** 14+
- **Edge** 90+

---

## 🤝 Contributing Guidelines

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make changes and test thoroughly
4. Run linting: `npm run lint`
5. Commit changes: `git commit -m "Add new feature"`
6. Push to branch: `git push origin feature/new-feature`
7. Create a Pull Request

---

## 📞 Support & Contact

For technical support or questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation wiki

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Happy Coding! 🎉**
