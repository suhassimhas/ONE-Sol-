# Contractor Jobs Feature - Implementation Summary

## Overview
Added a new feature to the **Contractor Dashboard** that allows contractors to search for available jobs by entering their work category. The category is sent to the n8n webhook at `https://uncharitable-unparenthesized-shaunta.ngrok-free.dev/webhook-test/contractor-jobs`, and the returned JSON results are displayed as available projects.

---

## Changes Made

### 1. **Backend - New Route: `contractorJobs.ts`**
**File:** `backend/src/routes/contractorJobs.ts` (NEW)

**Features:**
- Created a new POST endpoint: `/api/contractor-jobs/search`
- Requires authentication (`authMiddleware`)
- Restricted to contractors (`requireRole('contractor')`)
- Accepts a JSON body with a `category` field (text string)
- Proxies the request to the n8n webhook URL
- Returns the n8n response directly to the frontend

**Example Request:**
```json
POST /api/contractor-jobs/search
{
  "category": "Plumbing"
}
```

**Example Response:**
```json
{
  "success": true,
  "jobs": [
    {
      "title": "Emergency Pipe Repair",
      "description": "Urgent plumbing repair needed",
      "budget": 500,
      "deadline": "2025-11-16",
      "category": "Plumbing"
    }
  ]
}
```

**Error Handling:**
- Validates that category is a non-empty string
- Returns 400 if category is missing or invalid
- Catches and logs n8n errors
- Returns appropriate HTTP status codes

### 2. **Backend - Route Registration**
**File:** `backend/src/routes/index.ts` (MODIFIED)

**Changes:**
- Added import: `import contractorJobsRoutes from './contractorJobs';`
- Registered new route: `router.use('/contractor-jobs', contractorJobsRoutes);`

---

### 3. **Frontend - API Service Method**
**File:** `services/apiService.ts` (MODIFIED)

**New Method:**
```typescript
async searchContractorJobs(category: string) {
  return this.request<{ jobs: any[] }>('/contractor-jobs/search', {
    method: 'POST',
    body: JSON.stringify({ category }),
  });
}
```

This method handles the API call to the backend endpoint with proper authentication and error handling.

---

### 4. **Frontend - Contractor Dashboard Component**
**File:** `screens/dashboards/ContractorDashboard.tsx` (MAJOR CHANGES)

#### New Components:

**a) CategorySearch Component**
- New React component that provides a form for contractors to enter their work category
- Features:
  - Text input field with placeholder "e.g., Plumbing, Carpentry, Electrical, etc."
  - Search button with loading indicator
  - Error message display
  - Calls `apiService.searchContractorJobs(category)` on form submission
  - Shows toast notifications for success/error
  - Disabled during loading to prevent multiple submissions
  - Passes results to parent via `onJobsFound` callback

**b) Enhanced AvailableProjects Component**
- Now accepts `initialN8nJobs` as a prop for displaying n8n results
- Added a third filter tab: "N8N Jobs" (blue colored)
- Displays job count in tab when jobs are found
- Filter types:
  - **Recommended For You**: Shows problems matching contractor's domains
  - **All Projects**: Shows all available local problems
  - **N8N Jobs**: Shows results from n8n webhook search
  
- N8N Jobs Display Features:
  - Blue border and styling to distinguish from regular projects
  - Displays job metadata dynamically (title, description, budget, deadline, etc.)
  - Shows all additional fields returned by n8n as key-value pairs
  - "View Details" button with toast notification
  - Responsive layout matching problem cards

#### Updated MainDashboard:
- Added `CategorySearch` component above available projects
- Passes `n8nJobs` state to both `CategorySearch` and `AvailableProjects`
- State management for n8n jobs through parent component

---

## User Flow

1. **Contractor opens dashboard**
   - Sees the "Search Jobs by Category" form
   - Sees existing available projects (recommended and all)

2. **Contractor enters category**
   - Types their work category (e.g., "Plumbing", "Carpentry")
   - Clicks "Search" button

3. **Backend processes request**
   - Validates category input
   - Calls n8n webhook with the category
   - Returns results to frontend

4. **Results displayed**
   - Jobs appear in a new "N8N Jobs" tab
   - Shows count of jobs found
   - Contractor can view job details
   - Similar interface to regular projects for consistency

---

## Technical Details

### Authentication & Security
- All requests to `/api/contractor-jobs/search` require valid JWT token
- Only users with role `contractor` can access
- CORS is handled by backend

### Error Handling
- Invalid/missing category: Returns 400 error with message
- N8N webhook unreachable: Returns 500 with error details
- Frontend displays user-friendly error messages via toast notifications

### Data Format
- N8N webhook response can have any JSON structure
- Frontend displays all fields dynamically
- Special handling for common fields: `title`, `name`, `description`, `content`, `budget`, `deadline`, `category`

---

## Files Modified/Created

| File | Type | Action |
|------|------|--------|
| `backend/src/routes/contractorJobs.ts` | TypeScript | **CREATE** |
| `backend/src/routes/index.ts` | TypeScript | **MODIFY** |
| `services/apiService.ts` | TypeScript | **MODIFY** |
| `screens/dashboards/ContractorDashboard.tsx` | TSX | **MODIFY** |

---

## Testing Checklist

- [ ] Backend compiles without errors
- [ ] Frontend compiles without errors
- [ ] Contractor can access the category search form
- [ ] Entering a category and clicking search sends POST request to backend
- [ ] Backend calls n8n webhook with correct URL and parameters
- [ ] N8N response is returned to frontend
- [ ] Jobs are displayed in the "N8N Jobs" tab
- [ ] Error messages display correctly if category is empty
- [ ] Error messages display correctly if n8n webhook fails
- [ ] Non-contractors cannot access the endpoint
- [ ] Unauthenticated users cannot access the endpoint
- [ ] Job display formats correctly with all returned fields

---

## API Endpoint Reference

### Create Contractor Jobs Request
```
POST /api/contractor-jobs/search
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "category": "Plumbing"
}
```

### Response
```json
{
  "success": true,
  "jobs": [...]
}
```

### Error Response
```json
{
  "success": false,
  "error": "Category is required and must be a non-empty string"
}
```

---

## Future Enhancements
- Add filtering/sorting for n8n jobs
- Save favorite categories for quick access
- Display job recommendations based on contractor's past bids
- Add pagination for large job lists
- Integrate with contractor profile to auto-fill categories
- Add job notifications/alerts for new matches
