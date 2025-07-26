# Date Status Management Implementation Guide
## Automatic Past Event Handling for Rehearsals & Theory Lessons

## Current State Analysis

### ✅ What's Already Implemented (Partial)
1. **Basic Date Filtering**: Frontend uses `fromDate` to show events from today onwards
2. **Date-based Queries**: Backend supports `fromDate` and `toDate` parameters
3. **Real-time Date Awareness**: Frontend sets default `fromDate` to today's date

### ❌ What's Missing
1. **Event Status Management**: No status field to track past/current/future events
2. **Automatic Status Updates**: No mechanism to update status when dates pass
3. **Past Event Archiving**: Past events are filtered out but not properly archived
4. **Historical Data Access**: No easy way to retrieve past events for analysis

## Recommended Implementation Strategy

This feature requires **BOTH** backend and frontend changes, with the backend handling the core logic.

### Phase 1: Backend Database Schema Enhancement

#### 1.1 Add Status Field to Collections

**Rehearsal Collection Update:**
```javascript
// Add to existing rehearsal schema
{
  // ... existing fields
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled',
    index: true
  },
  statusUpdatedAt: {
    type: Date,
    default: Date.now
  },
  autoStatusUpdate: {
    type: Boolean,
    default: true // Allow manual override for special cases
  }
}
```

**Theory Lesson Collection Update:**
```javascript
// Add to existing theory lesson schema
{
  // ... existing fields
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled',
    index: true
  },
  statusUpdatedAt: {
    type: Date,
    default: Date.now
  },
  autoStatusUpdate: {
    type: Boolean,
    default: true
  }
}
```

#### 1.2 Database Migration Script
```javascript
// Migration script to add status to existing records
db.rehearsals.updateMany(
  { status: { $exists: false } },
  { 
    $set: { 
      status: 'scheduled',
      statusUpdatedAt: new Date(),
      autoStatusUpdate: true
    }
  }
);

db.theoryLessons.updateMany(
  { status: { $exists: false } },
  { 
    $set: { 
      status: 'scheduled', 
      statusUpdatedAt: new Date(),
      autoStatusUpdate: true
    }
  }
);
```

### Phase 2: Backend Automatic Status Management

#### 2.1 Status Update Service
```javascript
// services/statusUpdateService.js
class StatusUpdateService {
  
  async updateEventStatuses() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    try {
      // Update rehearsals
      await this.updateRehearsalStatuses(today);
      
      // Update theory lessons  
      await this.updateTheoryLessonStatuses(today);
      
      console.log(`Status update completed at ${now.toISOString()}`);
    } catch (error) {
      console.error('Status update failed:', error);
    }
  }

  async updateRehearsalStatuses(today) {
    // Find rehearsals that should be marked as completed
    const rehearsalsToComplete = await Rehearsal.find({
      date: { $lt: today },
      status: 'scheduled',
      autoStatusUpdate: true
    });

    if (rehearsalsToComplete.length > 0) {
      const result = await Rehearsal.updateMany(
        {
          date: { $lt: today },
          status: 'scheduled',
          autoStatusUpdate: true
        },
        {
          $set: {
            status: 'completed',
            statusUpdatedAt: new Date()
          }
        }
      );
      
      console.log(`Updated ${result.modifiedCount} rehearsals to completed status`);
    }
  }

  async updateTheoryLessonStatuses(today) {
    // Similar logic for theory lessons
    const lessonsToComplete = await TheoryLesson.find({
      date: { $lt: today },
      status: 'scheduled', 
      autoStatusUpdate: true
    });

    if (lessonsToComplete.length > 0) {
      const result = await TheoryLesson.updateMany(
        {
          date: { $lt: today },
          status: 'scheduled',
          autoStatusUpdate: true
        },
        {
          $set: {
            status: 'completed',
            statusUpdatedAt: new Date()
          }
        }
      );
      
      console.log(`Updated ${result.modifiedCount} theory lessons to completed status`);
    }
  }
  
  // Get events by status for easy filtering
  async getEventsByStatus(model, status, additionalFilters = {}) {
    return model.find({
      status,
      ...additionalFilters
    }).sort({ date: 1 });
  }
}

module.exports = new StatusUpdateService();
```

#### 2.2 Automated Scheduling (Choose One)

**Option A: Cron Job (Recommended)**
```javascript
// config/scheduler.js
const cron = require('node-cron');
const statusUpdateService = require('../services/statusUpdateService');

// Run every day at 1:00 AM
cron.schedule('0 1 * * *', async () => {
  console.log('Running daily status update...');
  await statusUpdateService.updateEventStatuses();
});

// Also run every hour during business hours (8 AM - 6 PM)
cron.schedule('0 8-18 * * *', async () => {
  console.log('Running hourly status update...');
  await statusUpdateService.updateEventStatuses();
});
```

**Option B: Middleware (Real-time)**
```javascript
// middleware/statusUpdateMiddleware.js
const statusUpdateService = require('../services/statusUpdateService');

let lastUpdate = Date.now();
const UPDATE_INTERVAL = 60 * 60 * 1000; // 1 hour

module.exports = async (req, res, next) => {
  const now = Date.now();
  
  // Update statuses if it's been more than an hour
  if (now - lastUpdate > UPDATE_INTERVAL) {
    statusUpdateService.updateEventStatuses().catch(console.error);
    lastUpdate = now;
  }
  
  next();
};
```

### Phase 3: Enhanced API Endpoints

#### 3.1 Update Existing Endpoints
```javascript
// rehearsal.controller.js - Enhanced filtering
async getRehearsals(req, res) {
  try {
    const { 
      groupId, 
      fromDate, 
      toDate, 
      location, 
      status, // NEW
      includeCompleted = false // NEW
    } = req.query;

    let filter = {};
    
    if (groupId) filter.groupId = groupId;
    if (location) filter.location = new RegExp(location, 'i');
    
    // Date filtering
    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = new Date(fromDate);
      if (toDate) filter.date.$lte = new Date(toDate);
    }
    
    // Status filtering - NEW LOGIC
    if (status) {
      filter.status = status;
    } else if (!includeCompleted) {
      // Default behavior: exclude completed unless explicitly requested
      filter.status = { $ne: 'completed' };
    }

    const rehearsals = await Rehearsal.find(filter)
      .populate('groupId')
      .sort({ date: 1, startTime: 1 });

    res.json(rehearsals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

#### 3.2 New Status-Specific Endpoints
```javascript
// GET /api/rehearsal/completed - Get completed rehearsals
async getCompletedRehearsals(req, res) {
  try {
    const { groupId, fromDate, toDate } = req.query;
    
    let filter = { status: 'completed' };
    if (groupId) filter.groupId = groupId;
    
    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = new Date(fromDate);
      if (toDate) filter.date.$lte = new Date(toDate);
    }

    const rehearsals = await Rehearsal.find(filter)
      .populate('groupId')
      .sort({ date: -1 }); // Most recent first

    res.json(rehearsals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// PUT /api/rehearsal/:id/status - Manual status update
async updateRehearsalStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const validStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status',
        validStatuses 
      });
    }

    const rehearsal = await Rehearsal.findByIdAndUpdate(
      id,
      { 
        status,
        statusUpdatedAt: new Date(),
        ...(reason && { statusReason: reason })
      },
      { new: true }
    );

    if (!rehearsal) {
      return res.status(404).json({ error: 'Rehearsal not found' });
    }

    res.json(rehearsal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

### Phase 4: Frontend Integration

#### 4.1 Update TypeScript Interfaces
```typescript
// services/rehearsalService.ts
export interface Rehearsal {
  _id: string;
  groupId: string;
  type: string;
  date: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string;
  notes?: string;
  attendance?: {
    present: string[];
    absent: string[];
  };
  schoolYearId: string;
  // NEW FIELDS
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  statusUpdatedAt: string;
  autoStatusUpdate: boolean;
  statusReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RehearsalFilter {
  groupId?: string;
  fromDate?: string;
  toDate?: string;
  location?: string;
  // NEW FIELDS
  status?: string;
  includeCompleted?: boolean;
}
```

#### 4.2 Enhanced Service Methods
```typescript
// services/rehearsalService.ts
export const rehearsalService = {
  // Enhanced filtering with status
  async getRehearsals(filterBy: RehearsalFilter = {}): Promise<Rehearsal[]> {
    return httpService.get('rehearsal', filterBy);
  },

  // NEW: Get completed rehearsals
  async getCompletedRehearsals(filterBy: Omit<RehearsalFilter, 'status'> = {}): Promise<Rehearsal[]> {
    return httpService.get('rehearsal/completed', filterBy);
  },

  // NEW: Update rehearsal status
  async updateRehearsalStatus(rehearsalId: string, status: string, reason?: string): Promise<Rehearsal> {
    return httpService.put(`rehearsal/${rehearsalId}/status`, { status, reason });
  },

  // NEW: Helper methods
  isRehearsalPast(rehearsal: Rehearsal): boolean {
    const rehearsalDate = new Date(rehearsal.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return rehearsalDate < today;
  },

  getRehearsalStatusColor(status: string): string {
    const colors = {
      scheduled: '#3b82f6', // blue
      in_progress: '#f59e0b', // amber  
      completed: '#10b981', // emerald
      cancelled: '#ef4444' // red
    };
    return colors[status] || colors.scheduled;
  }
};
```

#### 4.3 UI Components Enhancement
```typescript
// cmps/RehearsalPreview.tsx - Add status indicator
interface RehearsalPreviewProps {
  rehearsal: Rehearsal;
  orchestraName: string;
  onView: (rehearsalId: string) => void;
  onEdit?: (rehearsalId: string) => void;
  onRemove?: (rehearsalId: string) => void;
  onRemoveOrchestra?: (orchestraId: string, rehearsalId: string) => void;
  onStatusChange?: (rehearsalId: string, status: string) => void; // NEW
  isToday?: boolean;
}

export function RehearsalPreview({ rehearsal, ...props }: RehearsalPreviewProps) {
  const statusColor = rehearsalService.getRehearsalStatusColor(rehearsal.status);
  const isPast = rehearsalService.isRehearsalPast(rehearsal);

  return (
    <div className={`rehearsal-preview ${rehearsal.status} ${isPast ? 'past' : ''}`}>
      {/* Status badge */}
      <div 
        className="status-badge" 
        style={{ backgroundColor: statusColor }}
      >
        {getStatusLabel(rehearsal.status)}
      </div>
      
      {/* Existing content */}
      {/* ... */}
    </div>
  );
}
```

### Phase 5: Implementation Priority & Complexity

#### Complexity Assessment: **MEDIUM** ⭐⭐⭐☆☆

**Why it's Medium Complexity:**
- ✅ **Schema changes**: Straightforward field additions
- ✅ **Business logic**: Clear date-based rules
- ⚠️ **Migration**: Need to handle existing data carefully
- ⚠️ **Scheduling**: Requires cron job or middleware setup
- ⚠️ **Testing**: Need to test edge cases and timezone handling

#### Implementation Phases (Recommended Order):

1. **Phase 1** (1-2 days): Database schema + migration
2. **Phase 2** (2-3 days): Backend status service + scheduling  
3. **Phase 3** (1-2 days): API endpoint enhancements
4. **Phase 4** (2-3 days): Frontend integration
5. **Phase 5** (1 day): Testing & refinement

**Total Estimated Time: 7-11 days**

### Phase 6: Additional Considerations

#### 6.1 Timezone Handling
```javascript
// Important: Handle timezone correctly
const getLocalMidnight = (timezone = 'Asia/Jerusalem') => {
  return new Date().toLocaleString('en-US', { 
    timeZone: timezone 
  });
};
```

#### 6.2 Performance Optimization
```javascript
// Add database indexes for efficient queries
db.rehearsals.createIndex({ "status": 1, "date": 1 });
db.rehearsals.createIndex({ "date": 1, "status": 1 });
db.theoryLessons.createIndex({ "status": 1, "date": 1 });
```

#### 6.3 Configuration Options
```javascript
// config/statusUpdate.js
module.exports = {
  enabled: process.env.NODE_ENV === 'production',
  cronSchedule: '0 1 * * *', // Daily at 1 AM
  timezone: 'Asia/Jerusalem',
  gracePeriodHours: 2, // Don't mark as completed until 2 hours after end time
  batchSize: 100 // Process in batches for large datasets
};
```

## Summary

This feature is **definitely worth implementing** and will greatly improve data management. It's primarily a **backend responsibility** with frontend UI enhancements.

**Key Benefits:**
- ✅ Automatic data organization
- ✅ Better historical tracking  
- ✅ Cleaner UI (past events properly handled)
- ✅ Enhanced reporting capabilities
- ✅ Improved system reliability

**Recommendation:** Start with Phase 1 (database changes) and Phase 2 (backend logic) first, then move to frontend integration. This will provide immediate value even before the UI changes are complete.