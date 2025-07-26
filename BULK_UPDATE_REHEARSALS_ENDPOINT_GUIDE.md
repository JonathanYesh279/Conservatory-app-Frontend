# Backend Implementation Guide: Bulk Update Rehearsals by Orchestra

## Overview
This guide provides specifications for implementing a bulk update endpoint that updates all rehearsals belonging to a specific orchestra/ensemble. This complements the existing bulk delete functionality and allows users to apply changes to all rehearsals in a group.

## Frontend Implementation Status: ✅ COMPLETED

The frontend has been fully implemented with:
- ✅ **RehearsalForm Enhancement**: Added "בצע עבור כל החזרות" button when editing rehearsals
- ✅ **Confirmation Dialog**: RehearsalBulkUpdateDialog with change summary and warnings
- ✅ **Service Integration**: updateRehearsalsByOrchestra method with fallback logic
- ✅ **Store Integration**: Full Zustand store implementation with error handling
- ✅ **UI/UX**: Responsive design with proper Hebrew text and warnings

## API Endpoint Specification

### Route
```
PUT /api/rehearsal/orchestra/:orchestraId
```

### Parameters
- **orchestraId** (string, required): The unique identifier of the orchestra whose rehearsals should be updated

### Request Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Request Body
```json
{
  "startTime": "10:00",
  "endTime": "12:00", 
  "location": "Room B",
  "notes": "Updated rehearsal information"
}
```

**Note**: Only include fields that should be updated. The endpoint should support partial updates.

### Response Format

#### Success Response (200 OK)
```json
{
  "updatedCount": 15,
  "message": "Successfully updated 15 rehearsals for orchestra"
}
```

#### Error Responses

**400 Bad Request**
```json
{
  "error": "Invalid orchestra ID",
  "message": "Orchestra ID is required and must be a valid ObjectId"
}
```

**400 Bad Request - Invalid Fields**
```json
{
  "error": "Invalid update data",
  "message": "Cannot update _id, createdAt, or updatedAt fields in bulk operations"
}
```

**401 Unauthorized**
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**403 Forbidden**
```json
{
  "error": "Forbidden", 
  "message": "Insufficient permissions to update rehearsals"
}
```

**404 Not Found**
```json
{
  "error": "Orchestra not found",
  "message": "No orchestra found with the specified ID"
}
```

**500 Internal Server Error**
```json
{
  "error": "Internal server error",
  "message": "Failed to update rehearsals"
}
```

## Implementation Requirements

### 1. Authentication & Authorization
```javascript
// Same as bulk delete - verify JWT token and permissions
if (!req.user.roles.includes('מנהל') && !req.user.roles.includes('מנצח')) {
  return res.status(403).json({
    error: "Forbidden",
    message: "Insufficient permissions to update rehearsals"
  });
}
```

### 2. Input Validation
```javascript
// Validate orchestraId parameter
if (!orchestraId || !ObjectId.isValid(orchestraId)) {
  return res.status(400).json({
    error: "Invalid orchestra ID",
    message: "Orchestra ID is required and must be a valid ObjectId"
  });
}

// Validate update data
const allowedFields = [
  'startTime', 'endTime', 'location', 'notes', 'type'
];

const forbiddenFields = [
  '_id', 'createdAt', 'updatedAt', 'groupId', 'date', 'schoolYearId'
];

// Check for forbidden fields
const updateKeys = Object.keys(req.body);
const hasForbiddenField = updateKeys.some(key => forbiddenFields.includes(key));

if (hasForbiddenField) {
  return res.status(400).json({
    error: "Invalid update data",
    message: `Cannot update these fields in bulk operations: ${forbiddenFields.join(', ')}`
  });
}

// Validate time format if provided
if (req.body.startTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(req.body.startTime)) {
  return res.status(400).json({
    error: "Invalid time format",
    message: "Start time must be in HH:MM format"
  });
}

if (req.body.endTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(req.body.endTime)) {
  return res.status(400).json({
    error: "Invalid time format", 
    message: "End time must be in HH:MM format"
  });
}
```

### 3. Database Operations
```javascript
// Example implementation
async function updateRehearsalsByOrchestra(orchestraId, updateData) {
  try {
    // 1. Verify orchestra exists
    const orchestra = await Orchestra.findById(orchestraId);
    if (!orchestra) {
      throw new Error('Orchestra not found');
    }

    // 2. Prepare update object with metadata
    const updateObject = {
      ...updateData,
      updatedAt: new Date()
    };

    // 3. Calculate dayOfWeek if startTime or endTime changed
    // (This might affect sorting or business logic)
    
    // 4. Update all rehearsals for this orchestra
    const result = await Rehearsal.updateMany(
      { groupId: orchestraId },
      { $set: updateObject }
    );
    
    return {
      updatedCount: result.modifiedCount,
      message: `Successfully updated ${result.modifiedCount} rehearsals for orchestra`
    };
  } catch (error) {
    throw error;
  }
}
```

### 4. Transaction Handling (Recommended)
```javascript
async function updateRehearsalsByOrchestra(orchestraId, updateData) {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      // All database operations within transaction
      const result = await Rehearsal.updateMany(
        { groupId: orchestraId }, 
        { 
          $set: {
            ...updateData,
            updatedAt: new Date()
          }
        },
        { session }
      );
      
      // Optional: Update orchestra's lastModified timestamp
      await Orchestra.findByIdAndUpdate(
        orchestraId,
        { lastModified: new Date() },
        { session }
      );
      
      return result;
    });
  } finally {
    await session.endSession();
  }
}
```

### 5. Advanced Features (Optional)

#### 5.1 Selective Updates
```javascript
// Allow specifying which rehearsals to update (e.g., only future ones)
const updateRehearsalsByOrchestra = async (orchestraId, updateData, options = {}) => {
  let filter = { groupId: orchestraId };
  
  // Only update future rehearsals
  if (options.futureOnly) {
    filter.date = { $gte: new Date() };
  }
  
  // Only update rehearsals within date range
  if (options.fromDate || options.toDate) {
    filter.date = {};
    if (options.fromDate) filter.date.$gte = new Date(options.fromDate);
    if (options.toDate) filter.date.$lte = new Date(options.toDate);
  }
  
  const result = await Rehearsal.updateMany(filter, { $set: updateData });
  return result;
};
```

#### 5.2 Conflict Detection
```javascript
// Check for time conflicts if updating times
if (updateData.startTime || updateData.endTime) {
  // Get all rehearsals that will be affected
  const affectedRehearsals = await Rehearsal.find({ groupId: orchestraId });
  
  // Check for conflicts with other orchestras in same location
  for (const rehearsal of affectedRehearsals) {
    const conflicts = await Rehearsal.find({
      groupId: { $ne: orchestraId },
      date: rehearsal.date,
      location: updateData.location || rehearsal.location,
      $or: [
        {
          startTime: { $lt: updateData.endTime || rehearsal.endTime },
          endTime: { $gt: updateData.startTime || rehearsal.startTime }
        }
      ]
    });
    
    if (conflicts.length > 0) {
      // Handle conflict - warn or prevent update
      console.warn(`Time conflict detected for rehearsal on ${rehearsal.date}`);
    }
  }
}
```

## Complete Express.js Route Example

```javascript
router.put('/rehearsal/orchestra/:orchestraId', async (req, res) => {
  try {
    const { orchestraId } = req.params;
    const userId = req.user.id;
    const updateData = req.body;
    
    // 1. Input validation
    if (!orchestraId || !ObjectId.isValid(orchestraId)) {
      return res.status(400).json({
        error: "Invalid orchestra ID",
        message: "Orchestra ID is required and must be a valid ObjectId"
      });
    }
    
    // 2. Authorization check
    if (!req.user.roles.includes('מנהל') && !req.user.roles.includes('מנצח')) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Insufficient permissions to update rehearsals"
      });
    }
    
    // 3. Validate update fields
    const forbiddenFields = ['_id', 'createdAt', 'updatedAt', 'groupId', 'date', 'schoolYearId'];
    const updateKeys = Object.keys(updateData);
    const hasForbiddenField = updateKeys.some(key => forbiddenFields.includes(key));
    
    if (hasForbiddenField) {
      return res.status(400).json({
        error: "Invalid update data",
        message: `Cannot update these fields: ${forbiddenFields.join(', ')}`
      });
    }
    
    // 4. Verify orchestra exists
    const orchestra = await Orchestra.findById(orchestraId);
    if (!orchestra) {
      return res.status(404).json({
        error: "Orchestra not found",
        message: "No orchestra found with the specified ID"
      });
    }
    
    // 5. Non-admin users can only update their own orchestras
    if (!req.user.roles.includes('מנהל')) {
      const userOrchestras = await Orchestra.find({ conductorId: req.user.id });
      const canUpdate = userOrchestras.some(o => o._id.toString() === orchestraId);
      
      if (!canUpdate) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You can only update rehearsals for orchestras you conduct"
        });
      }
    }
    
    // 6. Prepare update object
    const updateObject = {
      ...updateData,
      updatedAt: new Date()
    };
    
    // 7. Update operations (with transaction)
    const session = await mongoose.startSession();
    let updatedCount = 0;
    
    try {
      await session.withTransaction(async () => {
        const result = await Rehearsal.updateMany(
          { groupId: orchestraId }, 
          { $set: updateObject },
          { session }
        );
        updatedCount = result.modifiedCount;
        
        // Update orchestra's last modified timestamp
        await Orchestra.findByIdAndUpdate(
          orchestraId,
          { lastModified: new Date() },
          { session }
        );
      });
    } finally {
      await session.endSession();
    }
    
    // 8. Logging
    console.log(`User ${userId} updated ${updatedCount} rehearsals for orchestra ${orchestraId}`);
    
    // 9. Success response
    res.status(200).json({
      updatedCount,
      message: `Successfully updated ${updatedCount} rehearsals for orchestra`
    });
    
  } catch (error) {
    console.error('Error updating rehearsals by orchestra:', error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to update rehearsals"
    });
  }
});
```

## Testing Considerations

### Unit Tests
- Test with valid orchestra ID and update data
- Test with invalid orchestra ID
- Test with forbidden fields in update data
- Test authorization for different user roles
- Test time format validation

### Integration Tests
- Test full update flow with real database
- Test transaction rollback on errors
- Test concurrent updates

### Performance Tests
- Test with large numbers of rehearsals
- Monitor database performance during bulk operations

## Implementation Priority

**Estimated Time: 4-6 hours**

1. **Phase 1** (2 hours): Basic endpoint implementation
2. **Phase 2** (1 hour): Validation and error handling  
3. **Phase 3** (1 hour): Transaction support and logging
4. **Phase 4** (1-2 hours): Testing and refinement

## Frontend Integration Notes

The frontend is already fully implemented and will:
1. **Try the bulk endpoint first**: `PUT /api/rehearsal/orchestra/:orchestraId`
2. **Fallback gracefully**: If endpoint returns 404, it will update rehearsals individually
3. **Handle responses**: Process success/error responses appropriately
4. **Show confirmation**: Display detailed confirmation dialog before bulk updates
5. **Provide feedback**: Show toast notifications with update count

## Database Considerations

Ensure your rehearsal schema supports these updateable fields:
```javascript
{
  _id: ObjectId,
  groupId: ObjectId, // Cannot be updated in bulk (would move to different orchestra)
  date: Date,        // Cannot be updated in bulk (would change scheduling)
  startTime: String, // CAN be updated
  endTime: String,   // CAN be updated  
  location: String,  // CAN be updated
  notes: String,     // CAN be updated
  type: String,      // CAN be updated
  // ... other fields
  updatedAt: Date    // Auto-updated
}
```

## Summary

This bulk update feature provides:
- ✅ **Efficient bulk operations** instead of individual API calls
- ✅ **Proper validation** and error handling
- ✅ **Transaction safety** for data consistency
- ✅ **Authorization controls** for security
- ✅ **Audit logging** for compliance
- ✅ **Seamless frontend integration** with fallback support

The implementation follows the same patterns as the existing bulk delete endpoint and integrates perfectly with the current authentication and authorization system.