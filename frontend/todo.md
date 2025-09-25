# Vehicle Management System Enhancement TODO

## Current Analysis
- Project uses localStorage for data persistence (mock API)
- Has basic vehicle, repair, and user management
- Uses shadcn-ui with TypeScript and Tailwind CSS
- Backend structure exists but frontend uses localStorage

## Required Enhancements

### 1. Vehicle Table Updates
- Add `index_debut_mois` (monthly start kilometer index)
- Add `index_fin_mois` (monthly end kilometer index)
- Add `total_carburant_prix` (total fuel price)
- Add `total_maintenance_prix` (total maintenance price)

### 2. Database Schema Updates
- Update Vehicle interface and API
- Add fuel tracking functionality
- Add maintenance cost tracking

### 3. History Page (Admin Only)
- Create RepairHistory component
- Admin-only access control
- Show all repairs for all vehicles
- Filter by vehicle name
- Filter by month and year
- Show fuel costs per month/year per vehicle

### 4. Direct Database Insertion
- Add parts/pieces insertion functionality
- Update repair creation to include parts

### 5. Enhanced Filtering
- Monthly/yearly repair history
- Monthly/yearly fuel costs per vehicle
- Vehicle-specific filtering

## Implementation Files
1. Update src/types/index.ts - Add new interfaces
2. Update src/lib/api.ts - Add new API functions
3. Update src/components/VehicleList.tsx - Add new fields
4. Create src/components/RepairHistory.tsx - Admin history page
5. Create src/components/FuelTracking.tsx - Fuel management
6. Create src/components/PartsManagement.tsx - Parts insertion
7. Update src/pages/Index.tsx - Add new tabs and routing
8. Update src/components/RepairList.tsx - Enhanced with parts

## Success Criteria
- All new fields visible in vehicle management
- Admin can access comprehensive history page
- Filtering works for repairs and fuel costs
- Parts can be inserted directly to database
- Monthly/yearly tracking functional