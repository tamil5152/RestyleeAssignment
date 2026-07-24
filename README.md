# Restylee — Fashion Marketplace Product Listing

Restylee is a product-listing feature for a fashion resale marketplace. Sellers submit a product name, description, and 2–5 images; the backend automatically verifies that every image actually shows a fashion product, contains no embedded text/watermarks, and that the description contains no personal contact information — before the listing is accepted.

**Live demo:**
- Frontend: https://restylee-assignment-61ky.vercel.app/
- Backend API: https://restylee-backend.onrender.com/api/health

> Note: the backend is hosted on Render's free tier, which spins down after ~15 minutes of inactivity. The first request after a period of inactivity can take 30–50 seconds while the server wakes up.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started (Local Setup)](#getting-started-local-setup)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Image Validation Pipeline](#image-validation-pipeline)
- [Known Limitations](#known-limitations)

---

## Features

**Product Listing**
- Product name and description fields, both required
- Upload 2–5 images per listing (drag-and-drop or click-to-upload)
- Live client-side preview and validation feedback before submitting

**Image Verification**
- Detects whether an image actually contains a fashion product (clothing, footwear, bags, accessories) and rejects non-fashion images
- Detects text embedded in images (captions, watermarks, screenshots) via OCR and rejects them
- Blocks submission until every uploaded image passes verification

**Image Validation**
- Accepts JPG, JPEG, and PNG only
- Max 5MB per image
- Max 5 images per listing
- Minimum/maximum dimension checks (200×200 up to 8000×8000)

**Listing Safety**
- Description text is scanned for emails, phone numbers, social media handles, URLs, and ID-like patterns (passport/SSN, etc.) and rejected if found

**Browsing**
- Browse all listed products with an image carousel
- Delete a listing

---

## Tech Stack

### Frontend
- **React 18** + **TypeScript**
- **Vite** — dev server and build tool
- **Tailwind CSS** — styling
- **Axios** — HTTP client
- **react-dropzone** — drag-and-drop image upload
- **react-hot-toast** — toast notifications
- **lucide-react** — icons

### Backend
- **Node.js** + **Express**
- **Multer** — multipart/form-data file upload handling (memory storage)
- **Sharp** — image resizing, format conversion, and pixel-level analysis
- **Tesseract.js** — OCR-based text detection in images
- **express-validator** — request validation
- **Helmet** — security headers
- **cors** — cross-origin request handling
- **express-rate-limit** — basic rate limiting
- **Morgan** — HTTP request logging
- **uuid** — unique ID generation

### Data storage
- Products are stored in an in-memory `Map` (no external database) — simplest option for this scope; **data resets whenever the server restarts.**
- Uploaded images and generated thumbnails are saved to local disk under `backend/uploads/products`.

---

## Project Structure

```
RestyleeAssignment/
├── backend/
│   ├── src/
│   │   ├── server.js              # App entry point
│   │   ├── constants.js           # Centralized config, limits, messages
│   │   ├── routes/                # /api/products, /api/health
│   │   ├── controllers/           # HTTP request handling
│   │   ├── services/              # Business logic + image validation
│   │   ├── middleware/            # Validation rules, error handling
│   │   └── config/                # Multer + in-memory database setup
│   ├── uploads/products/          # Saved product images (gitignored except .gitkeep)
│   └── eng.traineddata            # Bundled Tesseract English language data
│
└── frontend/
    ├── src/
    │   ├── components/            # Reusable UI + product components
    │   ├── pages/                 # ListProduct, BrowseProducts
    │   ├── hooks/                 # useProducts data-fetching hook
    │   ├── services/              # Axios API client
    │   └── types/                 # Shared TypeScript types
    └── index.html
```

---

## Getting Started (Local Setup)

### Prerequisites
- Node.js 18+ and npm
- Git

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd RestyleeAssignment
```

### 2. Backend setup
```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` if needed — the defaults are set up for local development:
```
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
MAX_FILE_SIZE=5242880
MAX_IMAGES_PER_PRODUCT=5
UPLOAD_DIR=uploads/products
ALLOWED_FORMATS=jpg,jpeg,png
MIN_IMAGE_DIMENSIONS=200x200
```

Start the backend:
```bash
npm run dev
```

You should see a startup banner confirming the server is running on port 5000. Verify it's working by visiting `http://localhost:5000/api/health` — it should return a JSON success response.

### 3. Frontend setup
Open a new terminal:
```bash
cd frontend
npm install
cp .env.example .env
```

Make sure `.env` points at your local backend **including `/api`**:
```
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:
```bash
npm run dev
```

Visit the URL Vite prints (typically `http://localhost:5173`).

### 4. Try it out
- Go to **List Item**, fill in a name and description, upload 2–5 clean product photos (no watermarks/text, no screenshots), and submit.
- Go to **Browse** to see your listing.

---

## Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Default |
|---|---|---|
| `PORT` | Port the server listens on | `5000` |
| `NODE_ENV` | `development` or `production` | `development` |
| `CORS_ORIGIN` | The exact origin allowed to call this API (no trailing slash) | — |
| `MAX_FILE_SIZE` | Max upload size per image, in bytes | `5242880` (5MB) |
| `MAX_IMAGES_PER_PRODUCT` | Max images per listing | `5` |
| `UPLOAD_DIR` | Directory to save uploaded images | `uploads/products` |

### Frontend (`frontend/.env`)
| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Full base URL of the backend API, **including `/api`** | falls back to the deployed Render URL if unset |

> **Important:** `CORS_ORIGIN` must exactly match the origin your frontend is served from — including protocol and no trailing slash. A mismatch (even just a trailing `/`) causes the browser to block every request with a CORS error.

---

## API Reference

Base URL: `/api`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/products` | List all products |
| `GET` | `/products/:id` | Get a single product |
| `POST` | `/products` | Create a product (multipart/form-data: `name`, `description`, `images[]`) |
| `DELETE` | `/products/:id` | Delete a product |

**Example: create a product**
```bash
curl -X POST http://localhost:5000/api/products \
  -F "name=Vintage Denim Jacket" \
  -F "description=Great condition, barely worn" \
  -F "images=@photo1.jpg" \
  -F "images=@photo2.jpg"
```

All responses follow this shape:
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": [ /* ... */ ],
  "count": 1
}
```

On validation failure:
```json
{
  "success": false,
  "message": "Product creation failed",
  "errors": [
    "photo1.jpg: Images containing text are not allowed. Please upload clean product images without text overlays, watermarks, or captions.",
    "Please fix all image validation errors before submitting."
  ]
}
```

---

## Image Validation Pipeline

Each uploaded image passes through the following checks, in order — a cheap check failing skips the more expensive ones below it:

1. **File type** — extension and MIME type must be `.jpg`/`.jpeg`/`.png`
2. **File size** — must be ≤ 5MB
3. **Dimensions** — read via Sharp; must be between 200×200 and 8000×8000
4. **Fashion-product detection** — a heuristic that scores color variance, color diversity, edge density, aspect ratio, and resolution to estimate whether the image shows a fashion product. This is a lightweight rule-based stand-in for a trained ML model — in production this would be replaced with a proper vision model or a cloud vision API (e.g. Google Vision, AWS Rekognition label detection).
5. **Text detection (OCR)** — the image is greyscaled, contrast-normalized, and thresholded with Sharp, then run through Tesseract.js OCR. If confident text is detected above a length/confidence threshold, the image is rejected (this catches watermarks, captions, screenshots, and price tags).

If **any** image fails **any** check, the entire submission is rejected with a specific, per-image error message — nothing is saved until every image passes.

Separately, the **description** text is checked against regex patterns for emails, phone numbers, social media handles, URLs, and ID-like strings, and rejected if any are found.

---

## Known Limitations

- **In-memory data store** — all products are lost when the backend restarts or redeploys. A production version would use a real database (Postgres/MongoDB).
- **Local disk image storage** — uploaded images live on the backend server's local filesystem, which doesn't persist across redeploys on most hosting platforms (including Render). A production version would use object storage (S3, Cloudinary) with CDN delivery.
- **Heuristic fashion detection, not ML** — the fashion-product check is rule-based rather than a trained model, so it can occasionally misclassify unusual photos (cluttered backgrounds, extreme close-ups, etc.).
- **Free-tier hosting cold starts** — the deployed backend spins down after inactivity; the first request afterward is noticeably slower.
- **Sequential image processing** — images are validated one at a time rather than in parallel, to keep memory usage predictable on small hosting instances, but this means processing time scales linearly with the number of images uploaded.
