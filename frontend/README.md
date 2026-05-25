# Campus Lost & Found

Frontend-only Vue 3 web application for Caraga State University. The app uses mock data and localStorage to simulate authentication, CRUD, claims, admin management, and settings.

## Stack

- Vue.js 3 with Composition API
- Vue Router
- Tailwind CSS
- Poppins from Google Fonts
- Lucide Vue icons
- localStorage state persistence
- `ref`, `reactive`, and `provide/inject`

## Logo

The uploaded Campus Connect logo is stored at:

```text
public/campus-connect-logo.png
```

## Run

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173/`.

## Demo Accounts

User:

- Email: `ana@carsu.edu.ph`
- Password: `password`

Admin:

- Email: `admin@carsu.edu.ph`
- Password: `admin123`

## Folder Structure

```text
src/
  App.vue
  main.js
  styles.css
  router/
    index.js
  store/
    appStore.js
  composables/
    useStore.js
  components/shared/
    ActivityFeed.vue
    AdminTable.vue
    AppNavbar.vue
    ClaimModal.vue
    ConfirmDialog.vue
    DashboardCard.vue
    FilterSidebar.vue
    ImageUploader.vue
    ItemCard.vue
    StatusBadge.vue
  views/user/
    LoginRegister.vue
    HomePage.vue
    BrowseFound.vue
    ItemDetail.vue
    ReportLost.vue
    ReportFound.vue
    MyReports.vue
  views/admin/
    AdminLogin.vue
    AdminDashboard.vue
    AdminItems.vue
    AdminLostReports.vue
    AdminClaims.vue
    AdminUsers.vue
    AdminSettings.vue
```

## User Flow

- Login/Register
- Home with hero, CTA cards, search, category chips, found item grid, and stats
- Browse Found Items with filter sidebar
- Item Detail with claim slide-in modal
- Report Lost Item with success reference number
- Report Found Item with thank-you confirmation
- My Reports with read, update, and delete actions

## Admin Flow

- Admin Login
- Dashboard with stat cards, activity feed, and quick actions
- Manage Found Items with full CRUD
- Manage Lost Reports with view, matched, archive, and delete actions
- Claims Management with approve/reject
- User Management with view, suspend, and delete actions
- Settings for locations, categories, office info, and announcement banner

## CRUD Mapping

| Operation | Implemented In |
| --- | --- |
| Create | Register, Report Lost, Report Found, Admin Add Item, Submit Claim |
| Read | Home, Browse, Item Detail, My Reports, Admin Dashboard, Admin Tables |
| Update | Edit report, Approve/Reject claim, Admin Edit Item, Settings, Suspend User |
| Delete | User delete own report, Admin delete item, Admin delete user |

## Backend Readiness

The app is frontend-only as requested. Backend connection later should start in `src/store/appStore.js`, replacing localStorage mutations with API calls while keeping the views and shared components unchanged.
