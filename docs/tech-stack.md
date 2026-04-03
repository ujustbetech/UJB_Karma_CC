## Tech Stack (UJB_Karma_CC)

### Frontend / App Framework

- `next` (Next.js, App Router)
- `react` / `react-dom` (React 19)
- UI/UX libraries:
  - `lucide-react` (icons)
  - `clsx` (conditional class helpers)
  - `react-hot-toast` (toast notifications)
  - `sweetalert2` (modal alerts)
  - `react-select` (select inputs)
  - `react-slick` + `slick-carousel` (carousel UI)
  - `react-swipeable` (swipe gestures)
  - `recharts` (charts in admin dashboards)
  - `canvas` (used in client-side/JS workflows; also present as a dependency)

### Styling

- `tailwindcss` (Tailwind v4)
- `postcss`, `autoprefixer`
- `sass` (styles support where needed)

### Backend / API Layer

- Next.js Route Handlers under `app/api/**/route.js`
- Data access:
  - `firebase` (client SDK)
  - `firebase-admin` (admin SDK)

### Authentication & Security

- Firebase Authentication (OAuth + phone OTP):
  - OTP is verified server-side using `bcryptjs` (hash compare) and session management via cookies/JWT.
- Session and tokens:
  - `jsonwebtoken` (JWT creation / verification)
  - `jose` (present in dependencies; used for token-related utilities if referenced elsewhere)
- Crypto utilities:
  - `crypto-js` (AES helpers in `utils/encryption.js`, used across the app)

### External Integrations

- WhatsApp messaging (Meta Graph API):
  - Implemented via direct HTTP calls using `axios` and/or `fetch` from API handlers and some admin/client flows
  - (WhatsApp endpoints use `WHATSAPP_PHONE_NUMBER_ID` + `WHATSAPP_ACCESS_TOKEN`)
- OpenAI (meeting topic generation):
  - `openai` (used by `app/api/generate-topic/route.js`)
  - (`OPENAI_API_KEY`)
- Email:
  - `@emailjs/browser` (used in admin prospect flows)

### Documents / Media Utilities

- PDF generation:
  - `jspdf` (agreement PDFs in `utils/generateAgreementPDF.js`)
- Spreadsheet export:
  - `xlsx` (admin exports to Excel)

### Editor / Rich Text (if used in admin/user flows)

- `@tiptap/react`, `@tiptap/starter-kit` (Tiptap editor)
- `react-quill-new` and `suneditor` / `suneditor-react` (additional rich-text/editor dependencies)

### Dev / Tooling

- Lint:
  - `eslint`, `eslint-config-next`
- Build:
  - `next build`, `next start`

