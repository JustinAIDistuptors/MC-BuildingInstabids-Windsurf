# Contractor Messaging Component

This component provides a messaging interface for homeowners to communicate with contractors while maintaining contractor anonymity.

## Features

- Group and individual messaging
- Contractor anonymization (Contractor A, B, C, etc.)
- File attachment support
- Real-time message updates
- Error boundary to prevent white screens

## Dependencies

This component requires the following packages:

```bash
# UI Components
@radix-ui/react-avatar
@radix-ui/react-label
@radix-ui/react-select
@radix-ui/react-switch
@radix-ui/react-tabs

# Icons
lucide-react

# State Management
@supabase/auth-helpers-nextjs (for production)
```

## Implementation Notes

1. The component uses a service layer abstraction (`ContractorMessagingService`) that:
   - Currently uses localStorage for development
   - Will be updated to use Supabase in production

2. Error handling is implemented through:
   - Error boundary component to prevent white screens
   - Proper loading and error states
   - Comprehensive error logging

3. Testing:
   - Service layer testing (`/test-service`)
   - Full component testing (`/messaging-test`)
   - Error boundary testing

## Usage

```tsx
import ContractorMessaging from '@/components/messaging/ContractorMessaging';

export default function ProjectPage({ params }) {
  return (
    <div>
      <h1>Project Details</h1>
      <ContractorMessaging 
        projectId={params.id} 
        projectTitle="Project Title" 
      />
    </div>
  );
}
```
