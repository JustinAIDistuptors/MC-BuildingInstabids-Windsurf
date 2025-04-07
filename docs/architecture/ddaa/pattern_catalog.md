# DDAA Pattern Catalog

This document defines the core architectural patterns enforced by the Domain-Driven Agent Architecture. These patterns represent fundamental rules that ensure system integrity, security, and maintainability.

## Core Patterns

### 1. Authentication Pattern

**Description**: Ensures operations are authorized for the authenticated user.

**Rule**: User ID must match resource owner ID for access, or have explicit permission.

**Implementation**:
```typescript
// In Guard Layer
function enforceAuthPattern(userId: string, resourceId: string): void {
  if (!userId) {
    throw new Error('Authentication required');
  }
  
  // Check if user owns the resource or has explicit permission
  const isAuthorized = this.checkOwnership(userId, resourceId) || 
                       this.checkPermission(userId, resourceId);
  
  if (!isAuthorized) {
    throw new Error('Unauthorized access');
  }
}
```

**Violation Examples**:
- Accessing another user's private data
- Modifying projects without ownership
- Bypassing permission checks

### 2. Domain Boundary Pattern

**Description**: Enforces clean separation between different domain contexts.

**Rule**: A domain can only directly access data within its own boundaries.

**Implementation**:
```typescript
// In Guard Layer
function enforceDomainBoundaryPattern(sourceDomain: string, targetDomain: string, operation: string): void {
  if (sourceDomain !== targetDomain) {
    // Check if this cross-domain operation is explicitly allowed
    const isAllowed = this.crossDomainRegistry.isAllowed(sourceDomain, targetDomain, operation);
    
    if (!isAllowed) {
      throw new Error(`Domain boundary violation: ${sourceDomain} cannot access ${targetDomain}`);
    }
  }
}
```

**Violation Examples**:
- Bidding domain directly querying messaging tables
- Payment domain modifying user profile data
- Direct cross-domain references in code

### 3. Data Validation Pattern

**Description**: Ensures data meets domain-specific validation rules before persistence.

**Rule**: All data must pass validation rules specific to its domain before being stored.

**Implementation**:
```typescript
// In Guard Layer
function enforceDataValidationPattern<T>(data: T, schemaName: string): void {
  const validationSchema = this.schemaRegistry.get(schemaName);
  
  if (!validationSchema) {
    throw new Error(`Unknown schema: ${schemaName}`);
  }
  
  const validationResult = validationSchema.validate(data);
  
  if (!validationResult.valid) {
    throw new Error(`Validation error: ${validationResult.errors.join(', ')}`);
  }
}
```

**Violation Examples**:
- Storing incomplete bid data
- Adding a user with invalid contact information
- Bypassing validation checks

### 4. Relationship Integrity Pattern

**Description**: Maintains referential integrity across related entities.

**Rule**: References to other entities must point to existing records.

**Implementation**:
```typescript
// In Guard Layer
async function enforceRelationshipIntegrityPattern(foreignKey: string, referencedTable: string): Promise<void> {
  if (!foreignKey) {
    return; // Null references might be allowed
  }
  
  const exists = await this.dataInterface.exists(referencedTable, foreignKey);
  
  if (!exists) {
    throw new Error(`Relationship integrity violation: ${referencedTable} with ID ${foreignKey} does not exist`);
  }
}
```

**Violation Examples**:
- Assigning a bid to a non-existent project
- Referencing deleted user accounts
- Creating orphaned records

### 5. Event Propagation Pattern

**Description**: Manages how changes in one domain affect other domains.

**Rule**: Cross-domain effects must be handled through explicit events rather than direct manipulation.

**Implementation**:
```typescript
// In Domain Layer
async function propagateEvent(eventType: string, payload: any): Promise<void> {
  // Record the event
  await this.eventStore.record(eventType, payload);
  
  // Publish to event bus for other domains to consume
  await this.eventBus.publish(eventType, payload);
}

// Example usage
async function acceptBid(bidId: string): Promise<void> {
  // Update bid status
  await this.dataInterface.update('bids', bidId, { status: 'accepted' });
  
  // Propagate event to other domains
  await this.propagateEvent('bid.accepted', { bidId });
}
```

**Violation Examples**:
- Directly updating data in another domain
- Bypassing the event system for cross-domain effects
- Tightly coupling domains with direct dependencies

## Secondary Patterns

### 6. Idempotency Pattern

**Description**: Ensures operations can be safely retried without causing duplicate effects.

**Rule**: Operations must produce the same result regardless of how many times they're executed.

### 7. Audit Trail Pattern

**Description**: Maintains a record of all significant system changes.

**Rule**: All state-changing operations must be logged with user information and timestamps.

### 8. Error Handling Pattern

**Description**: Standardizes error reporting and handling.

**Rule**: Errors must be caught, logged, and transformed into appropriate responses.

### 9. Pagination Pattern

**Description**: Standardizes how large result sets are handled.

**Rule**: Operations returning potentially large result sets must support pagination.

### 10. Soft Delete Pattern

**Description**: Preserves data while marking it as deleted.

**Rule**: Records should be marked as deleted rather than physically removed when appropriate.
