# Trésor Bags - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure API
Update `.env` file:
```
VITE_APP_API_URL=http://localhost:5000
```

### Step 3: Start Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Step 4: Test the Application

#### Public Access
- Visit `http://localhost:5173/tresor-bags`
- See the bag listing (will show errors if backend isn't running)
- Try searching and filtering

#### Admin Access
- Visit `http://localhost:5173/tresor-bags/admin`
- Login with password: `admin123`
- You'll be redirected to the dashboard at `/tresor-bags/admin/dashboard`

## 🔧 What You Need

### Backend Requirements
Your Node.js backend should have:

1. **API Endpoints**:
   ```
   GET    /api/bags                    - Get all bags (with filters)
   GET    /api/bags/:id                - Get single bag
   POST   /api/bags                    - Create bag (admin)
   PUT    /api/bags/:id                - Update bag (admin)
   DELETE /api/bags/:id                - Delete bag (admin)
   ```

2. **Bag Model Structure**:
   ```javascript
   {
     _id: ObjectId,
     title: String (required),
     description: String (required),
     price: Number (required),
     color: String (required),
     capacity: String (optional),
     weight: Number (optional),
     dimensions: {
       height: Number (optional),
       width: Number (optional),
       depth: Number (optional)
     },
     mainImage: String (required),
     sideImages: [String] (optional, max 10),
     createdAt: Date,
     updatedAt: Date
   }
   ```

3. **Query Parameters Supported**:
   - `page`: Page number (default: 1)
   - `limit`: Items per page (default: 12)
   - `search`: Search in title/description
   - `minPrice`, `maxPrice`: Price range
   - `minHeight`, `maxHeight`: Height range
   - `minWidth`, `maxWidth`: Width range
   - `minWeight`, `maxWeight`: Weight range
   - `color`: Color filter
   - `capacity`: Capacity filter
   - `sortBy`: Field to sort by
   - `order`: 'asc' or 'desc'

## 📱 Project Routes

| URL | Type | Description |
|-----|------|-------------|
| `/tresor-bags` | Public | Main bag listing page |
| `/tresor-bags/gallery/:id` | Public | Full gallery view for a bag |
| `/tresor-bags/admin` | Public | Admin login page |
| `/tresor-bags/admin/dashboard` | Private | Admin dashboard |
| `/tresor-bags/admin/add` | Private | Add new bag form |
| `/tresor-bags/admin/edit/:id` | Private | Edit existing bag |

## 🔐 Authentication

### Demo Credentials
- **URL**: `/tresor-bags/admin`
- **Password**: `admin123`
- Session stored in: `localStorage.isAdmin`

### To Implement Real Authentication
Edit `src/context/AuthContext.jsx`:
```javascript
// Replace the hardcoded password check with API call
const response = await fetch('/api/admin/login', {
  method: 'POST',
  body: JSON.stringify({ password })
});
```

## 📝 Key Files Overview

```
src/
├── App.jsx                    # Routes setup
├── context/AuthContext.jsx    # Login state
├── services/bagService.js     # API calls (axios)
├── components/BagForm.jsx     # Add/Edit form
├── pages/
│   ├── BagListing.jsx        # Main listing & admin dashboard
│   ├── BagGallery.jsx        # Gallery view
│   ├── Login.jsx             # Login page
│   ├── AddBag.jsx            # Add bag page
│   └── EditBag.jsx           # Edit bag page
└── index.css                  # Animations & styles
```

## 🎨 Customization

### Change Brand Name
Edit these files:
- `src/pages/Login.jsx` - Line with "TRÉSOR BAGS"
- `src/pages/BagListing.jsx` - Header logo
- `src/pages/BagGallery.jsx` - Header title

### Change Colors
Edit `src/index.css` or individual component styles

### Change Admin Password
Edit `src/context/AuthContext.jsx`:
```javascript
if (password === "YOUR_PASSWORD_HERE") {
```

## 📦 Build for Production

### Create Production Build
```bash
npm run build
```

Output will be in `dist/` folder

### Preview Production Build
```bash
npm run preview
```

## 🐛 Troubleshooting

### API Connection Issues
1. Check if backend is running on port 5000
2. Verify `.env` has correct API_URL
3. Check browser console for CORS errors
4. Ensure backend allows requests from your frontend URL

### Login Not Working
1. Verify password is `admin123`
2. Check `localStorage.isAdmin` in DevTools
3. Ensure AuthContext.jsx has correct logic

### Images Not Loading
1. Check image URLs in database
2. Verify images are accessible
3. For base64, ensure proper formatting

### Filters Not Working
1. Check API endpoint supports query parameters
2. Verify filter values are correct
3. Check network tab in DevTools

## 💡 Tips

1. **Use React DevTools**: Browser extension to inspect components
2. **Use Network Tab**: Check API requests and responses
3. **Use Console**: See error messages and logs
4. **Use localStorage**: Clear storage if session issues
5. **Reload Hard**: Ctrl+Shift+R to clear cache

## 🔒 Security Checklist for Production

- [ ] Replace demo password with real authentication
- [ ] Implement JWT tokens
- [ ] Use HTTPS/SSL
- [ ] Add CORS headers properly
- [ ] Validate all inputs
- [ ] Implement rate limiting
- [ ] Add error logging
- [ ] Use environment variables for secrets
- [ ] Implement proper image upload (S3/Cloudinary)
- [ ] Add user roles and permissions
- [ ] Implement refresh tokens
- [ ] Add audit logging

## 📞 Support

For issues, check:
1. PROJECT_GUIDE.md - Full documentation
2. IMPLEMENTATION_SUMMARY.md - Technical details
3. FEATURES_CHECKLIST.md - Feature status
4. Browser console for error messages
5. Network tab for API issues

## 🎯 Next Steps

1. ✅ Start the dev server: `npm run dev`
2. ✅ Test public features
3. ✅ Test admin features
4. ✅ Connect to your Node.js backend
5. ✅ Deploy to production

---

**Happy coding! 🎉**
