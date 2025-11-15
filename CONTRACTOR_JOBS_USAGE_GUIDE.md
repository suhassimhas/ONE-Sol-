# Contractor Jobs Feature - Visual Flow & Usage Guide

## User Interface Flow

```
┌─────────────────────────────────────────────────────────┐
│         CONTRACTOR DASHBOARD                             │
├─────────────────────────────────────────────────────────┤
│  [Performance Metrics] [Active Contracts] [Earnings]    │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │   🔍 SEARCH JOBS BY CATEGORY                     │  │
│  ├──────────────────────────────────────────────────┤  │
│  │                                                   │  │
│  │  What category do you work in?                   │  │
│  │  ┌──────────────────────────────────────────┐   │  │
│  │  │ e.g., Plumbing, Carpentry, Electrical... │   │  │
│  │  └──────────────────────────────────────────┘   │  │
│  │                     [🔍 SEARCH]                  │  │
│  │                                                   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                           │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  AVAILABLE PROJECTS BOARD                               │
│  [Recommended] [All Projects] [N8N Jobs(5)]             │
│                                                           │
│  When "N8N Jobs" tab is clicked:                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Emergency Pipe Repair          [View Details]    │  │
│  │ Description: Urgent plumbing repair needed       │  │
│  │ Budget: $500 | Deadline: 2025-11-16             │  │
│  │ Category: Plumbing                               │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Roof Leak Assessment           [View Details]    │  │
│  │ Description: Water damage assessment...          │  │
│  │ Budget: $300 | Deadline: 2025-11-20             │  │
│  │ Category: Roofing                                │  │
│  └──────────────────────────────────────────────────┘  │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
FRONTEND (React)
│
├─ Contractor enters category: "Plumbing"
│
├─ Calls: apiService.searchContractorJobs("Plumbing")
│         (POST request with JWT token)
│
▼
────────────────────────────────────────────────────

BACKEND (Express.js)
│
├─ Route: POST /api/contractor-jobs/search
│
├─ Middleware:
│  ├─ authMiddleware (validates JWT)
│  ├─ requireRole('contractor') (checks user role)
│
├─ Route Handler:
│  ├─ Validates category input
│  │
│  ├─ Calls axios.post() to n8n webhook:
│  │  URL: https://uncharitable-unparenthesized-shaunta.ngrok-free.dev/webhook-test/contractor-jobs
│  │  Body: { category: "Plumbing" }
│  │
│  ├─ Catches response or error
│  │
│  ├─ Returns JSON to frontend:
│  │  {
│  │    "success": true,
│  │    "jobs": [...]
│  │  }
│
▼
────────────────────────────────────────────────────

N8N WEBHOOK
│
├─ Receives: { category: "Plumbing" }
│
├─ Processing:
│  ├─ Query database/service for matching jobs
│  ├─ Filter by category
│  ├─ Apply any business logic
│
├─ Returns JSON array of jobs with metadata:
│  [
│    {
│      "title": "Emergency Pipe Repair",
│      "description": "Urgent plumbing repair needed",
│      "budget": 500,
│      "deadline": "2025-11-16",
│      "category": "Plumbing",
│      ... (any other fields)
│    }
│  ]
│
▼
────────────────────────────────────────────────────

FRONTEND (React) - Display Results
│
├─ Receives jobs array from backend
│
├─ Switches to "N8N Jobs" tab
│
├─ Maps through jobs array and renders each job:
│  ├─ Title
│  ├─ Description
│  ├─ Budget
│  ├─ Deadline
│  ├─ All other fields (dynamic display)
│  ├─ "View Details" button
│
├─ Shows toast: "Found 5 job(s) in Plumbing"
│
▼

USER SEES: List of available N8N jobs for their category
```

---

## Component Hierarchy

```
ContractorDashboard
│
├─ MainDashboard
│  │
│  ├─ Grid: Performance Cards
│  │  ├─ AI Performance Score
│  │  ├─ Active Contracts
│  │  └─ Total Earnings
│  │
│  ├─ CategorySearch ✨ NEW
│  │  ├─ Text input for category
│  │  ├─ Search button
│  │  └─ Calls onJobsFound callback
│  │
│  └─ AvailableProjects (Enhanced)
│     ├─ Filter tabs: [Recommended] [All] [N8N Jobs]
│     ├─ Regular projects (from local storage)
│     └─ N8N jobs (from webhook response)
│
├─ ProjectDetails
│  ├─ Problem details
│  └─ Bid submission form
│
└─ MyBids
   ├─ User's submitted bids
   └─ AI evaluation scores
```

---

## State Management

```
ContractorDashboard (Parent)
│
├─ State: selectedProject
│  └─ Used to show ProjectDetails view
│
└─ State: n8nJobs ✨ NEW
   ├─ Stores array of jobs from n8n webhook
   ├─ Updated by CategorySearch component
   └─ Passed to AvailableProjects component
      
AvailableProjects
│
├─ State: allProjects (from local storage)
├─ State: n8nJobs (from parent prop)
├─ State: filteredProjects (based on filter)
├─ State: filter ('recommended' | 'all' | 'n8n')
└─ State: loading
```

---

## Step-by-Step Usage Example

### Scenario: Contractor looking for plumbing jobs

**Step 1:** Contractor logs in and sees dashboard
```
✓ Dashboard loads
✓ Sees "Search Jobs by Category" form
✓ Sees existing available projects
```

**Step 2:** Contractor enters their category
```
Input: "Plumbing"
```

**Step 3:** Contractor clicks Search
```
✓ Button shows loading spinner
✓ Frontend sends: POST /api/contractor-jobs/search
✓ Body: { "category": "Plumbing" }
✓ Headers: Authorization: Bearer <token>
```

**Step 4:** Backend processes request
```
✓ Validates authentication
✓ Validates category input
✓ Calls n8n webhook with category
✓ Receives response from n8n
✓ Returns to frontend: { success: true, jobs: [...] }
```

**Step 5:** Frontend displays results
```
✓ Updates n8nJobs state
✓ Shows toast: "Found 5 job(s) in Plumbing"
✓ Automatically switches to "N8N Jobs" tab
✓ Displays jobs with all metadata
✓ Shows "N8N Jobs (5)" in tab
```

**Step 6:** Contractor views job details
```
✓ Clicks "View Details" on a job
✓ Toast shows: "This is an N8N job. You can contact the provider..."
```

---

## Error Handling Scenarios

### Scenario 1: Empty Category Input
```
User Input: "" (empty or whitespace)
↓
Frontend Validation: "Please enter a category"
↓
Toast Error: "Please enter a category"
```

### Scenario 2: N8N Webhook Unreachable
```
Request to n8n webhook fails
↓
Backend catches error
↓
Returns: {
  "success": false,
  "error": "Failed to fetch jobs from n8n"
}
↓
Frontend shows error toast
↓
onJobsFound([]) called - clears any previous jobs
```

### Scenario 3: Unauthenticated User
```
No valid JWT token
↓
Backend authMiddleware rejects request
↓
Returns: 401 Unauthorized
↓
Frontend shows auth error
```

### Scenario 4: Non-Contractor User
```
User role is not 'contractor'
↓
Backend requireRole('contractor') fails
↓
Returns: 403 Forbidden
↓
Frontend shows permission error
```

---

## Job Display Format

Each job card displays:

```
┌─────────────────────────────────────────────────┐
│ [🔵 N8N] Job Title                              │
├─────────────────────────────────────────────────┤
│ Description text here...                        │
│                                                  │
│ $ Budget: $500    ⏱ Deadline: 2025-11-16      │
│ Category: Plumbing                             │
│                                                  │
│ [Dynamic Fields]                                │
│ • field1: value1                                │
│ • field2: value2                                │
│ • field3: value3                                │
│                      [View Details]             │
└─────────────────────────────────────────────────┘
```

---

## Configuration

### N8N Webhook URL
```
WEBHOOK_URL = "https://uncharitable-unparenthesized-shaunta.ngrok-free.dev/webhook-test/contractor-jobs"
```

**Location:** `backend/src/routes/contractorJobs.ts` (Line 20)

**Note:** To change the webhook URL, modify the `N8N_WEBHOOK_URL` constant in the route file.

---

## Response Format Examples

### N8N Returns Multiple Jobs
```json
[
  {
    "title": "Emergency Pipe Repair",
    "description": "Urgent plumbing repair needed",
    "budget": 500,
    "deadline": "2025-11-16",
    "category": "Plumbing",
    "priority": "high",
    "location": "Downtown"
  },
  {
    "title": "Drain Cleaning",
    "description": "Main line cleaning",
    "budget": 200,
    "deadline": "2025-11-17",
    "category": "Plumbing",
    "priority": "medium"
  }
]
```

### N8N Returns Custom Fields
```json
[
  {
    "jobId": "PLM-001",
    "title": "Fixture Installation",
    "client": "John Smith",
    "address": "123 Main St",
    "estimatedHours": 3,
    "toolsRequired": ["wrench", "caulk", "tape"],
    "notes": "New bathroom sink installation"
  }
]
```

### Frontend Displays Dynamically
```
All fields are shown automatically, including custom ones.
Special fields like "title", "description", "budget", 
"deadline" are displayed prominently.
All other fields are shown as a list below.
```

---

## Testing the Feature

### Manual Testing Steps

1. **Login as Contractor**
   - Navigate to contractor dashboard
   
2. **Test Valid Search**
   - Enter "Plumbing" in category field
   - Click Search
   - Verify jobs appear in N8N Jobs tab
   
3. **Test Empty Input**
   - Leave category field empty
   - Click Search
   - Verify error message appears
   
4. **Test Multiple Searches**
   - Search for "Carpentry"
   - Verify previous results are replaced
   - Switch back to "Recommended" tab
   - Verify regular projects still show
   
5. **Test Non-Contractor Access**
   - Login as non-contractor user
   - Verify endpoint returns 403 error
   
6. **Test Invalid Category**
   - Enter special characters or very long string
   - Verify backend handles gracefully

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| "Jobs not showing" | N8N webhook not returning data | Check n8n webhook URL and ensure it's running |
| "401 Unauthorized" | Invalid or expired JWT token | Login again to get new token |
| "403 Forbidden" | User role is not 'contractor' | Login with a contractor account |
| "Network error" | Backend not running | Start backend: `npm run dev` |
| "Empty results" | N8N returned empty array | N8N webhook may have no matching jobs |

