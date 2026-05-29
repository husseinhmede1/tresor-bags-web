# Trésor Bags - React Web Application

A modern, feature-rich React application for managing and displaying luxury bags with admin capabilities. Built with React, Axios, and React Router with a beautiful, animated UI.

## Features

### Public Features (`/tresor-bags`)
- **Modern Bag Listing**: Grid view with pagination (12 items per page)
- **Search**: Search by title or description
- **Advanced Filters**:
  - Price range (Min/Max in USD)
  - Height, Width, Weight range (in cm/kg)
  - Color filter
  - Capacity filter
- **View More**: Expandable details for each bag showing all specifications
- **Gallery View**: Click "View Gallery" on any bag to see full image gallery with all images

### Admin Features (`/tresor-bags/admin`)
- **Secure Login**: Password-protected admin panel (demo password: `admin123`)
- **Dashboard**: Admin listing with all public features plus:
  - Edit button for each bag
  - Delete button for each bag
  - "Add New Bag" button
- **Create Bags**: 
  - Upload main image (required)
  - Add up to 10 side images (optional)
  - Set title, description, price, color, capacity, weight, dimensions
- **Edit Bags**:
  - Modify all bag information
  - Change main image (can delete and reupload)
  - Manage side images (add/delete)
- **Delete Bags**: Remove bags from the inventory

## Project Structure

```
src/
├── pages/
│   ├── BagListing.jsx         # Main listing page (public & admin)
│   ├── BagGallery.jsx         # Full image gallery view
│   ├── Login.jsx              # Admin login page
│   ├── AddBag.jsx             # Add new bag page
│   └── EditBag.jsx            # Edit bag page
├── components/
│   ├── BagForm.jsx            # Reusable form for add/edit
│   └── common/
│       └── ProtectedRoute.jsx  # Route protection for admin
├── context/
│   └── AuthContext.jsx        # Authentication state management
├── services/
│   └── bagService.js          # API calls with Axios
├── App.jsx                    # Main app with routing
├── main.jsx                   # React entry point
└── index.css                  # Global styles & animations
```

## Routes

| Route | Component | Access | Description |
|-------|-----------|--------|-------------|
| `/tresor-bags` | BagListing | Public | Public listing page |
| `/tresor-bags/gallery/:id` | BagGallery | Public | Gallery view for a bag |
| `/tresor-bags/admin` | Login | Public | Admin login page |
| `/tresor-bags/admin/dashboard` | BagListing | Admin | Admin dashboard |
| `/tresor-bags/admin/add` | AddBag | Admin | Add new bag form |
| `/tresor-bags/admin/edit/:id` | EditBag | Admin | Edit bag form |

## Setup Instructions

### Prerequisites
- Node.js (v16+)
- npm or yarn

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure API URL**:
   Update the `.env` file:
   ```
   VITE_APP_API_URL=http://localhost:5000
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

## API Integration

The application uses Axios for API calls. All API methods are in `src/services/bagService.js`:

### Available Methods

```javascript
// Get all bags with filters and pagination
getAllBags(params)

// Get single bag by ID
getBagById(id)

// Create a new bag (admin only)
createBag(bagData)

// Update a bag (admin only)
updateBag(id, bagData)

// Delete a bag (admin only)
deleteBag(id)
```

### Query Parameters Example

```javascript
const params = {
  page: 1,
  limit: 12,
  search: "leather",
  minPrice: 100,
  maxPrice: 500,
  minHeight: 20,
  maxHeight: 40,
  minWidth: 15,
  maxWidth: 35,
  minWeight: 0.5,
  maxWeight: 2,
  color: "Black,Brown",
  capacity: "20L,30L"
};

const result = await getAllBags(params);
```

## Styling & Animations

The application features modern animations and transitions:

- **Fade In**: Smooth opacity transitions
- **Slide In**: Content sliding from top/bottom
- **Scale In**: Component scaling on load
- **Hover Effects**: Lift and glow effects on interactive elements
- **Spin Animation**: Loading spinners
- **Smooth Transitions**: All button and input interactions

### CSS Variables Available

Global animation keyframes and transitions are defined in `index.css`:
- `fadeIn`
- `slideInUp`
- `slideInDown`
- `scaleIn`
- `spin`
- `pulse`
- `hover-lift`
- `glow`

## Authentication

### Login Flow
1. User navigates to `/tresor-bags/admin`
2. Enters password (demo: `admin123`)
3. Password is validated and user is logged in
4. User is redirected to `/tresor-bags/admin/dashboard`
5. User session is stored in localStorage

### Logout
- Click logout button to clear session and return to public listing

### Protected Routes
- All admin routes are protected by `ProtectedRoute` component
- Redirects to login page if user is not authenticated

## Form Handling

### Add/Edit Bag Form
- **Image Upload**: Uses FileReader API to handle image uploads
- **Form Validation**: Validates required fields before submission
- **Error Handling**: Displays validation errors for each field
- **Side Images**: Drag & drop or click to add up to 10 additional images

### Form Fields
- **Title** (required): Bag name
- **Description** (required): Detailed description
- **Price** (required): Bag price in USD
- **Color** (required): Bag color
- **Capacity** (optional): Storage capacity (e.g., 20L)
- **Weight** (optional): Weight in kg
- **Dimensions** (optional): Height, Width, Depth in cm
- **Main Image** (required): Primary product image
- **Side Images** (optional): Up to 10 additional images

## Responsive Design

The application is fully responsive and works well on:
- Desktop (1920px+)
- Laptop (1024px - 1919px)
- Tablet (768px - 1023px)
- Mobile (< 768px)

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Environment Variables

```env
VITE_APP_API_URL=http://localhost:5000
```

## Dependencies

- **react**: ^19.2.6 - UI library
- **react-dom**: ^19.2.6 - React DOM renderer
- **react-router-dom**: ^7.15.1 - Client-side routing
- **axios**: ^1.7.x - HTTP client for API calls

## Development

### Linting
```bash
npm run lint
```

### Preview Build
```bash
npm run preview
```

## Notes

- Demo admin password is `admin123` (should be changed in production)
- All image data is handled as base64 strings for simplicity
- For production, implement proper image upload to cloud storage (S3, Cloudinary, etc.)
- Add proper authentication with JWT tokens
- Implement error boundaries for better error handling

## Support

For issues or questions, please contact the development team.
