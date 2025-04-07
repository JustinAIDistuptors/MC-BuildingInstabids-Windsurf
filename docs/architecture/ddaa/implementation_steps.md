# DDAA Implementation Steps for InstaBids

This document outlines the practical steps to implement the Domain-Driven Agent Architecture (DDAA) for the InstaBids platform.

## Step 1: Setup Project Structure

```
instabids/
  ├── src/
  │   ├── domains/              # Each domain in its own directory
  │   │   ├── user-management/  # User Management domain
  │   │   ├── project/          # Project Management domain
  │   │   ├── bidding/          # Bidding domain
  │   │   ├── messaging/        # Messaging domain
  │   │   ├── payment/          # Payment domain
  │   │   ├── ai-outreach/      # AI Outreach domain
  │   │   └── community/        # Community domain
  │   │
  │   ├── core/                 # Core framework components
  │   │   ├── guard/            # Guard layer components
  │   │   ├── domain/           # Domain layer base classes
  │   │   ├── persistence/      # Persistence layer components
  │   │   ├── patterns/         # Pattern implementations
  │   │   └── events/           # Event propagation system
  │   │
  │   ├── integration/          # Integration with external systems
  │   ├── api/                  # API endpoints
  │   └── utils/                # Utility functions
  │
  ├── tests/                    # Tests for all components
  ├── scripts/                  # Build and deployment scripts
  └── docs/                     # Documentation
```

## Step 2: Implement Core Framework

### 2.1 Create Base Classes

Start by implementing the base classes that each domain will extend:

```typescript
// src/core/domain/domain-agent.ts
export abstract class DomainAgent {
  constructor(
    protected guardLayer: any,
    protected dataInterface: any,
    protected currentUser: { id: string; role: string }
  ) {}
  
  abstract fulfillIntent(intent: string, params: any): Promise<any>;
}

// src/core/guard/guard-layer.ts
export abstract class GuardLayer {
  abstract enforcePatterns(context: {
    operation: string;
    domain: string;
    resourceId: string;
    userId: string;
    [key: string]: any;
  }): Promise<void>;
}

// src/core/persistence/data-interface.ts
export abstract class DataInterface {
  abstract query(entity: string, criteria: any): Promise<any[]>;
  abstract get(entity: string, id: string): Promise<any>;
  abstract create(entity: string, data: any): Promise<any>;
  abstract update(entity: string, id: string, data: any): Promise<any>;
  abstract delete(entity: string, id: string): Promise<void>;
}
```

### 2.2 Implement Pattern Registry

Create a pattern registry to manage architectural patterns:

```typescript
// src/core/patterns/pattern-registry.ts
export type PatternValidator = (context: any) => Promise<void>;

export class PatternRegistry {
  private patterns: Map<string, PatternValidator> = new Map();
  
  register(patternName: string, validator: PatternValidator): void {
    this.patterns.set(patternName, validator);
  }
  
  async validate(patternName: string, context: any): Promise<void> {
    const validator = this.patterns.get(patternName);
    
    if (!validator) {
      throw new Error(`Unknown pattern: ${patternName}`);
    }
    
    await validator(context);
  }
  
  async validateAll(patterns: string[], context: any): Promise<void> {
    for (const pattern of patterns) {
      await this.validate(pattern, context);
    }
  }
}
```

### 2.3 Implement Event Bus

Create an event system for cross-domain communication:

```typescript
// src/core/events/event-bus.ts
export type EventHandler = (eventType: string, payload: any) => Promise<void>;

export class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();
  
  subscribe(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    
    this.handlers.get(eventType)?.push(handler);
  }
  
  async publish(eventType: string, payload: any): Promise<void> {
    const handlers = this.handlers.get(eventType) || [];
    
    await Promise.all(
      handlers.map(handler => handler(eventType, payload))
    );
  }
}
```

## Step 3: Implement Domain Agents

Implement domain agents one by one, starting with the most critical domains:

### 3.1 User Management Domain

```typescript
// src/domains/user-management/user-management-agent.ts
import { DomainAgent } from '../../core/domain/domain-agent';

export class UserManagementAgent extends DomainAgent {
  async fulfillIntent(intent: string, params: any): Promise<any> {
    switch (intent) {
      case 'createUser':
        return this.createUser(params.userData);
      
      case 'getUserProfile':
        return this.getUserProfile(params.userId);
      
      case 'updateUserProfile':
        return this.updateUserProfile(params.userId, params.profileData);
      
      // Other intents...
      
      default:
        throw new Error(`Unknown intent: ${intent}`);
    }
  }
  
  private async createUser(userData: any): Promise<any> {
    await this.guardLayer.enforcePatterns({
      operation: 'create',
      domain: 'user-management',
      resourceId: null,
      userId: this.currentUser.id,
      data: userData
    });
    
    return this.dataInterface.create('users', userData);
  }
  
  // Other implementation methods...
}
```

### 3.2 Project Management Domain

```typescript
// src/domains/project/project-management-agent.ts
import { DomainAgent } from '../../core/domain/domain-agent';

export class ProjectManagementAgent extends DomainAgent {
  async fulfillIntent(intent: string, params: any): Promise<any> {
    switch (intent) {
      case 'createProject':
        return this.createProject(params.projectData);
      
      case 'getProjectDetails':
        return this.getProjectDetails(params.projectId);
      
      case 'updateProjectStatus':
        return this.updateProjectStatus(params.projectId, params.status);
      
      // Other intents...
      
      default:
        throw new Error(`Unknown intent: ${intent}`);
    }
  }
  
  // Implementation methods...
}
```

### 3.3 Bidding Domain

```typescript
// src/domains/bidding/bidding-agent.ts
import { DomainAgent } from '../../core/domain/domain-agent';

export class BiddingAgent extends DomainAgent {
  async fulfillIntent(intent: string, params: any): Promise<any> {
    switch (intent) {
      case 'submitBid':
        return this.submitBid(params.projectId, params.bidData);
      
      case 'getProjectBids':
        return this.getProjectBids(params.projectId);
      
      case 'acceptBid':
        return this.acceptBid(params.bidId);
      
      // Other intents...
      
      default:
        throw new Error(`Unknown intent: ${intent}`);
    }
  }
  
  private async acceptBid(bidId: string): Promise<any> {
    // Enforce patterns
    await this.guardLayer.enforcePatterns({
      operation: 'update',
      domain: 'bidding',
      resourceId: bidId,
      userId: this.currentUser.id
    });
    
    // Update bid status
    const bid = await this.dataInterface.update('bids', bidId, { 
      status: 'accepted',
      acceptedAt: new Date()
    });
    
    // Publish event for cross-domain effects
    await this.eventBus.publish('bid.accepted', { 
      bidId,
      projectId: bid.projectId,
      contractorId: bid.contractorId
    });
    
    return bid;
  }
  
  // Other implementation methods...
}
```

## Step 4: Implement API Layer

Create API endpoints that use the domain agents:

```typescript
// src/api/bidding-api.ts
import { BiddingAgent } from '../domains/bidding/bidding-agent';
import { Request, Response } from 'express';

export class BiddingAPI {
  constructor(private biddingAgentFactory: (userId: string, role: string) => BiddingAgent) {}
  
  async submitBid(req: Request, res: Response): Promise<void> {
    try {
      const { projectId, bidData } = req.body;
      const { id: userId, role } = req.user; // From auth middleware
      
      const biddingAgent = this.biddingAgentFactory(userId, role);
      
      const bid = await biddingAgent.fulfillIntent('submitBid', { 
        projectId, 
        bidData 
      });
      
      res.status(201).json(bid);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
  
  // Other API endpoints...
}
```

## Step 5: Setup Cross-Domain Communication

Configure event handlers for cross-domain operations:

```typescript
// src/domains/project/project-event-handlers.ts
import { EventBus } from '../../core/events/event-bus';
import { ProjectManagementAgent } from './project-management-agent';

export function setupProjectEventHandlers(
  eventBus: EventBus,
  projectAgentFactory: (userId: string, role: string) => ProjectManagementAgent
): void {
  // When a bid is accepted, update the project status
  eventBus.subscribe('bid.accepted', async (eventType, payload) => {
    const { projectId, contractorId } = payload;
    
    // Use system user for cross-domain operations
    const projectAgent = projectAgentFactory('system', 'system');
    
    await projectAgent.fulfillIntent('updateProjectStatus', {
      projectId,
      status: 'in-progress',
      contractorId
    });
    
    // Could trigger further events if needed
  });
  
  // Other event handlers...
}
```

## Step 6: Implement Database Access

Create the persistence layer for each domain:

```typescript
// src/domains/bidding/bidding-data-interface.ts
import { DataInterface } from '../../core/persistence/data-interface';
import { Database } from '../../core/persistence/database';

export class BiddingDataInterface implements DataInterface {
  constructor(private db: Database) {}
  
  async query(entity: string, criteria: any): Promise<any[]> {
    // Map entity names to table names
    const tableMapping = {
      'bids': 'bidding.bids',
      'group_bids': 'bidding.group_bids'
    };
    
    const tableName = tableMapping[entity] || entity;
    
    // Implement query logic
    return this.db.query(tableName, criteria);
  }
  
  // Other methods...
}
```

## Step 7: Implement Testing

Create comprehensive tests for each component:

```typescript
// tests/domains/bidding/bidding-agent.test.ts
import { BiddingAgent } from '../../../src/domains/bidding/bidding-agent';
import { MockGuardLayer } from '../../mocks/mock-guard-layer';
import { MockDataInterface } from '../../mocks/mock-data-interface';
import { MockEventBus } from '../../mocks/mock-event-bus';

describe('BiddingAgent', () => {
  let biddingAgent: BiddingAgent;
  let mockGuardLayer: MockGuardLayer;
  let mockDataInterface: MockDataInterface;
  let mockEventBus: MockEventBus;
  
  beforeEach(() => {
    mockGuardLayer = new MockGuardLayer();
    mockDataInterface = new MockDataInterface();
    mockEventBus = new MockEventBus();
    
    biddingAgent = new BiddingAgent(
      mockGuardLayer,
      mockDataInterface,
      mockEventBus,
      { id: 'test-user', role: 'contractor' }
    );
  });
  
  describe('fulfillIntent', () => {
    it('should submit a bid for a project', async () => {
      // Test logic
    });
    
    it('should enforce authentication pattern when submitting a bid', async () => {
      // Test logic
    });
    
    // Other tests...
  });
});
```

## Step 8: Deploy and Scale

1. **Initial Deployment**: Deploy the core domains as a monolith
2. **Scaling Strategy**: Use horizontal scaling as user base grows
3. **Monitoring**: Implement monitoring for each domain
4. **Continuous Improvement**: Refine patterns and interfaces based on usage

By following these steps, we can implement the DDAA approach for InstaBids in a methodical, domain-by-domain manner.
