# Backend Implementation Guide: Bulk Delete Rehearsals by Orchestra

## Overview
This guide provided specifications for implementing a bulk delete endpoint that removes all rehearsals belonging to a specific orchestra/ensemble. 

**✅ IMPLEMENTATION STATUS: COMPLETED**
- Route: `DELETE /api/rehearsals/orchestra/:orchestraId` (rehearsal.route.js:18)
- Controller: `bulkDeleteRehearsalsByOrchestra` (rehearsal.controller.js:222-282)  
- Service: `bulkDeleteRehearsalsByOrchestra` (rehearsal.service.js:456-575)
- All features implemented as specified including auth, validation, transactions, and audit logging.

## API Endpoint Specification

### Route
```
DELETE /api/rehearsals/orchestra/:orchestraId
```

### Parameters
- **orchestraId** (string, required): The unique identifier of the orchestra whose rehearsals should be deleted

### Request Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Response Format

#### Success Response (200 OK)
```json
{
  "deletedCount": 15,
  "message": "Successfully deleted 15 rehearsals for orchestra"
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
  "message": "Insufficient permissions to delete rehearsals"
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
  "message": "Failed to delete rehearsals"
}
```

## Implementation Requirements

### 1. Authentication & Authorization
- Verify JWT token in Authorization header
- Ensure user has admin or conductor role permissions
- Validate user has access to the specific orchestra

### 2. Input Validation
```javascript
// Validate orchestraId parameter
if (!orchestraId || !ObjectId.isValid(orchestraId)) {
  return res.status(400).json({
    error: "Invalid orchestra ID",
    message: "Orchestra ID is required and must be a valid ObjectId"
  });
}
```

### 3. Database Operations
```javascript
// Example implementation (adjust for your database/ORM)
async function deleteRehearsalsByOrchestra(orchestraId) {
  try {
    // 1. Verify orchestra exists
    const orchestra = await Orchestra.findById(orchestraId);
    if (!orchestra) {
      throw new Error('Orchestra not found');
    }

    // 2. Find all rehearsals for this orchestra
    const rehearsals = await Rehearsal.find({ groupId: orchestraId });
    
    // 3. Delete all rehearsals (with cascading deletes if needed)
    const result = await Rehearsal.deleteMany({ groupId: orchestraId });
    
    // 4. Optional: Clean up related data (attendance records, etc.)
    await Attendance.deleteMany({ 
      rehearsalId: { $in: rehearsals.map(r => r._id) }
    });
    
    return {
      deletedCount: result.deletedCount,
      message: `Successfully deleted ${result.deletedCount} rehearsals for orchestra`
    };
  } catch (error) {
    throw error;
  }
}
```

### 4. Transaction Handling (Recommended)
```javascript
// Use database transactions to ensure data consistency
async function deleteRehearsalsByOrchestra(orchestraId) {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      // All database operations within transaction
      const result = await Rehearsal.deleteMany(
        { groupId: orchestraId }, 
        { session }
      );
      
      // Clean up related data
      await Attendance.deleteMany(
        { rehearsalId: { $in: rehearsalIds } },
        { session }
      );
      
      return result;
    });
  } finally {
    await session.endSession();
  }
}
```

### 5. Logging & Auditing
```javascript
// Log important operations for auditing
console.log(`User ${userId} deleted ${deletedCount} rehearsals for orchestra ${orchestraId}`);

// Optional: Create audit log entry
await AuditLog.create({
  userId,
  action: 'BULK_DELETE_REHEARSALS',
  resourceType: 'rehearsal',
  resourceId: orchestraId,
  metadata: { deletedCount },
  timestamp: new Date()
});
```

## Complete Express.js Route Example

```javascript
router.delete('/rehearsals/orchestra/:orchestraId', async (req, res) => {
  try {
    const { orchestraId } = req.params;
    const userId = req.user.id; // From auth middleware
    
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
        message: "Insufficient permissions to delete rehearsals"
      });
    }
    
    // 3. Verify orchestra exists
    const orchestra = await Orchestra.findById(orchestraId);
    if (!orchestra) {
      return res.status(404).json({
        error: "Orchestra not found",
        message: "No orchestra found with the specified ID"
      });
    }
    
    // 4. Get rehearsals for logging/cleanup
    const rehearsals = await Rehearsal.find({ groupId: orchestraId });
    const rehearsalIds = rehearsals.map(r => r._id);
    
    // 5. Delete operations (with transaction)
    const session = await mongoose.startSession();
    let deletedCount = 0;
    
    try {
      await session.withTransaction(async () => {
        // Delete rehearsals
        const result = await Rehearsal.deleteMany(
          { groupId: orchestraId }, 
          { session }
        );
        deletedCount = result.deletedCount;
        
        // Clean up attendance records
        await Attendance.deleteMany(
          { rehearsalId: { $in: rehearsalIds } },
          { session }
        );
      });
    } finally {
      await session.endSession();
    }
    
    // 6. Logging
    console.log(`User ${userId} deleted ${deletedCount} rehearsals for orchestra ${orchestraId}`);
    
    // 7. Success response
    res.status(200).json({
      deletedCount,
      message: `Successfully deleted ${deletedCount} rehearsals for orchestra`
    });
    
  } catch (error) {
    console.error('Error deleting rehearsals by orchestra:', error);
    res.status(500).json({
      error: "Internal server error",
      message: "Failed to delete rehearsals"
    });
  }
});
```

## Testing Considerations

### Unit Tests
- Test with valid orchestra ID
- Test with invalid orchestra ID
- Test with non-existent orchestra
- Test authorization checks
- Test transaction rollback on errors

### Integration Tests
- Test full delete flow with real database
- Verify related data cleanup (attendance, etc.)
- Test concurrent request handling

### Performance Tests
- Test with large numbers of rehearsals
- Monitor database performance during bulk operations

## Database Schema Considerations

Ensure your rehearsal schema includes:
```javascript
{
  _id: ObjectId,
  groupId: ObjectId, // References orchestra/ensemble
  date: Date,
  startTime: String,
  endTime: String,
  location: String,
  notes: String,
  attendance: {
    present: [ObjectId], // Student IDs
    absent: [ObjectId]   // Student IDs
  },
  schoolYearId: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

## Additional Considerations

1. **Soft Delete Option**: Consider implementing soft deletes instead of hard deletes for data recovery
2. **Backup**: Ensure proper backup procedures before bulk operations
3. **Rate Limiting**: Implement rate limiting to prevent abuse
4. **Batch Size**: For very large datasets, consider implementing batch processing
5. **Webhooks**: Consider triggering webhooks/events for other systems that need to know about deletions

## Frontend Integration

The frontend has been updated to:
- ✅ Use the bulk delete endpoint directly (`DELETE /api/rehearsals/orchestra/:orchestraId`)
- ✅ Handle the response format specified above
- ✅ Display appropriate success/error messages to users
- ✅ Remove fallback logic since endpoint is now available

**Integration Complete**: The frontend now uses the optimized bulk delete endpoint instead of individual deletions.