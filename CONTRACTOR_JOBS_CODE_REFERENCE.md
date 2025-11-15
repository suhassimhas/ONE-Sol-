# Contractor Jobs Feature - Code Reference

## Backend Route Implementation

### File: `backend/src/routes/contractorJobs.ts`

```typescript
import { Router, Request, Response } from 'express';
import axios from 'axios';
import { asyncHandler } from '../middleware/errorHandler';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { logger } from '../utils/logger';

const router = Router();

interface ContractorJobsRequest {
  category: string;
}

interface ContractorJobsResponse {
  success: boolean;
  jobs?: any[];
  error?: string;
}

const N8N_WEBHOOK_URL = 'https://uncharitable-unparenthesized-shaunta.ngrok-free.dev/webhook-test/contractor-jobs';

// POST /api/contractor-jobs/search - Get available jobs by category
router.post(
  '/search',
  authMiddleware,
  requireRole('contractor'),
  asyncHandler(async (req: Request, res: Response) => {
    const { category }: ContractorJobsRequest = req.body;

    if (!category || typeof category !== 'string' || category.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Category is required and must be a non-empty string',
      });
    }

    try {
      logger.info(`Fetching contractor jobs for category: ${category}`);

      // Call n8n webhook
      const response = await axios.post<any>(N8N_WEBHOOK_URL, {
        category: category.trim(),
      });

      logger.info(`n8n response received for category ${category}:`, response.data);

      return res.status(200).json({
        success: true,
        jobs: response.data,
      });
    } catch (error: any) {
      logger.error('Error fetching contractor jobs from n8n:', error);

      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch jobs from n8n';

      return res.status(error.response?.status || 500).json({
        success: false,
        error: errorMessage,
      });
    }
  })
);

export default router;
```

---

## Frontend API Service

### File: `services/apiService.ts` (Method Addition)

```typescript
// Add this method to the ApiService class

async searchContractorJobs(category: string) {
  return this.request<{ jobs: any[] }>('/contractor-jobs/search', {
    method: 'POST',
    body: JSON.stringify({ category }),
  });
}
```

---

## Frontend Component - CategorySearch

### File: `screens/dashboards/ContractorDashboard.tsx` (New Component)

```typescript
const CategorySearch: React.FC<{ onJobsFound: (jobs: any[]) => void }> = ({ onJobsFound }) => {
    const [category, setCategory] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!category.trim()) {
            toast.error('Please enter a category');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await apiService.searchContractorJobs(category.trim());
            
            if (response && response.jobs) {
                toast.success(`Found ${response.jobs.length} job(s) in ${category}`);
                onJobsFound(response.jobs);
            } else {
                toast.error('No jobs found for this category');
                onJobsFound([]);
            }
        } catch (err: any) {
            const errorMsg = err.message || 'Failed to search jobs';
            setError(errorMsg);
            toast.error(errorMsg);
            onJobsFound([]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card title="Search Jobs by Category">
            <form onSubmit={handleSearch} className="space-y-4">
                <div>
                    <label htmlFor="category" className="block text-sm font-medium mb-2">
                        What category do you work in?
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            id="category"
                            value={category}
                            onChange={(e) => {
                                setCategory(e.target.value);
                                setError(null);
                            }}
                            placeholder="e.g., Plumbing, Carpentry, Electrical, etc."
                            className="flex-1 px-4 py-2 rounded-lg border border-gray-700 bg-gray-900 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-green-500/90 hover:bg-green-400 disabled:bg-gray-600 text-black font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                    Searching...
                                </>
                            ) : (
                                <>
                                    <Search className="h-4 w-4" />
                                    Search
                                </>
                            )}
                        </button>
                    </div>
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
                <p className="text-xs text-gray-500">Enter your specialization to see available projects that match your skills.</p>
            </form>
        </Card>
    );
};
```

---

## Frontend Component - N8N Jobs Display

### File: `screens/dashboards/ContractorDashboard.tsx` (AvailableProjects Enhancement)

```typescript
// Display N8N Jobs in the render method
{filter === 'n8n' ? (
    // Display N8N Jobs
    n8nJobs.length === 0 ? (
        <p className="text-gray-500">No N8N jobs found. Use the search above to find jobs.</p>
    ) : (
        n8nJobs.map((job, index) => (
            <div key={`n8n-job-${index}`} className="p-4 border border-blue-500/30 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-300 hover:border-blue-500 hover:bg-blue-500/5">
                <div>
                    <div className="flex items-center gap-3">
                        <h4 className="font-bold text-lg text-white">{job.title || job.name || `Job #${index + 1}`}</h4>
                        <span className="text-xs font-bold text-blue-400 bg-blue-400/10 px-2 py-1 rounded-full">N8N</span>
                    </div>
                    <p className="text-sm text-gray-400 truncate max-w-md mt-1">{job.description || job.content || 'No description available'}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm flex-wrap">
                        {job.budget && <span className="flex items-center text-green-400"><DollarSign className="h-4 w-4 mr-1"/> Budget: ${job.budget}</span>}
                        {job.deadline && <span className="flex items-center text-yellow-400"><Clock className="h-4 w-4 mr-1"/> Deadline: {job.deadline}</span>}
                        {job.category && <span className="text-gray-300">Category: {job.category}</span>}
                    </div>
                    {/* Display additional job details as key-value pairs */}
                    {Object.entries(job).filter(([key]) => !['title', 'name', 'description', 'content', 'budget', 'deadline', 'category'].includes(key)).map(([key, value]) => (
                        <p key={key} className="text-xs text-gray-500 mt-1"><span className="font-semibold text-gray-400">{key}:</span> {String(value)}</p>
                    ))}
                </div>
                <button onClick={() => toast.success('This is an N8N job. You can contact the provider for more details.')} className="bg-blue-500/90 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-400 transition-colors whitespace-nowrap">
                    View Details
                </button>
            </div>
        ))
    )
) : (
    // Display Regular Problems
    // ... existing code ...
)}
```

---

## Component Integration

### File: `screens/dashboards/ContractorDashboard.tsx` (Main Component)

```typescript
const ContractorDashboard: React.FC<{ view: string; setView: (view: string) => void }> = ({ view, setView }) => {
  const { user } = useContext(AppContext) as IAppContext;
  const [selectedProject, setSelectedProject] = useState<Problem | null>(null);
  const [n8nJobs, setN8nJobs] = useState<any[]>([]);  // ✨ NEW

  const MainDashboard = () => (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Stats Cards... */}
        </div>
        <CategorySearch onJobsFound={setN8nJobs} />  {/* ✨ NEW */}
        <AvailableProjects onProjectSelect={setSelectedProject} initialN8nJobs={n8nJobs} />  {/* ✨ UPDATED */}
    </div>
  );

  if (selectedProject) {
      return <ProjectDetails problem={selectedProject} onBack={() => setSelectedProject(null)} refreshBids={() => {}} />;
  }

  switch (view) {
    case 'dashboard':
      return <MainDashboard />;
    case 'projects':
      return <AvailableProjects onProjectSelect={setSelectedProject} initialN8nJobs={n8nJobs} />;  {/* ✨ UPDATED */}
    case 'my-bids':
        return <MyBids />
    default:
      return <MainDashboard />;
  }
};
```

---

## API Request/Response Examples

### Request Example

```bash
curl -X POST http://localhost:3001/api/contractor-jobs/search \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"category": "Plumbing"}'
```

### Successful Response (200 OK)

```json
{
  "success": true,
  "jobs": [
    {
      "title": "Emergency Pipe Repair",
      "description": "Urgent plumbing repair needed at residential property",
      "budget": 500,
      "deadline": "2025-11-16T17:00:00Z",
      "category": "Plumbing",
      "priority": "high",
      "location": "Downtown District",
      "estimatedHours": 4,
      "clientRating": 4.8
    },
    {
      "title": "Drain Cleaning Service",
      "description": "Main line cleaning and inspection",
      "budget": 200,
      "deadline": "2025-11-17T10:00:00Z",
      "category": "Plumbing",
      "priority": "medium",
      "location": "Westside",
      "estimatedHours": 2
    }
  ]
}
```

### Error Response (400 Bad Request)

```json
{
  "success": false,
  "error": "Category is required and must be a non-empty string"
}
```

### Error Response (401 Unauthorized)

```json
{
  "success": false,
  "error": "Invalid token"
}
```

### Error Response (403 Forbidden)

```json
{
  "success": false,
  "error": "Insufficient permissions for this resource"
}
```

### Error Response (500 Internal Server Error)

```json
{
  "success": false,
  "error": "Failed to fetch jobs from n8n"
}
```

---

## Environment Configuration

### Backend Environment Variables

No new environment variables are required. The webhook URL is hardcoded:

```typescript
const N8N_WEBHOOK_URL = 'https://uncharitable-unparenthesized-shaunta.ngrok-free.dev/webhook-test/contractor-jobs';
```

**To change the webhook URL**, edit this line in `backend/src/routes/contractorJobs.ts`.

### Frontend Configuration

No new environment variables needed. API base URL is configured in `apiService.ts`:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
```

---

## Imports Required

### Backend (contractorJobs.ts)
```typescript
import { Router, Request, Response } from 'express';
import axios from 'axios';  // Already installed
import { asyncHandler } from '../middleware/errorHandler';  // Existing
import { authMiddleware } from '../middleware/auth';  // Existing
import { requireRole } from '../middleware/rbac';  // Existing
import { logger } from '../utils/logger';  // Existing
```

### Frontend (ContractorDashboard.tsx)
```typescript
import { apiService } from '../../services/apiService';  // NEW import
import { Search, DollarSign, Clock } from 'lucide-react';  // Already imported
```

---

## Key Points Summary

✅ **Authentication:** All requests require valid JWT token
✅ **Authorization:** Only contractors can access
✅ **Error Handling:** Comprehensive error messages and logging
✅ **Dynamic Display:** N8N response can have any JSON structure
✅ **User Feedback:** Toast notifications for success/error
✅ **Responsive:** Works on mobile and desktop
✅ **Performance:** Async/await for non-blocking operations
✅ **Security:** CORS enabled for backend via middleware
✅ **Logging:** All operations logged for debugging

