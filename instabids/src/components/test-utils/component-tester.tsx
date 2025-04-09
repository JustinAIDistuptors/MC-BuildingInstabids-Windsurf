'use client';

import React, { ComponentType, PropsWithChildren } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

// Fixed type-safe wrapper that handles generic props correctly
export function withReactHookForm<T extends object>(Component: ComponentType<T>): React.ComponentType<T> {
  // Return a properly typed wrapper component
  return function TestWrapper(props: T) {
    const methods = useForm();
    return (
      <FormProvider {...methods}>
        <Component {...props} />
      </FormProvider>
    );
  };
}

// Radix UI component validation utility
export function validateRadixComponentStructure(component: string, componentCode: string): boolean {
  const validationRules = [
    {
      child: 'RadioGroupItem',
      parent: 'RadioGroup',
      errorMessage: 'RadioGroupItem must be used within RadioGroup'
    },
    {
      child: 'SelectItem',
      parent: 'Select',
      errorMessage: 'SelectItem must be used within Select'
    },
    {
      child: 'TabsContent',
      parent: 'Tabs',
      errorMessage: 'TabsContent must be used within Tabs'
    },
    // Add more Radix component validation rules
  ];
  
  for (const rule of validationRules) {
    if (componentCode.includes(rule.child) && !componentCode.includes(rule.parent)) {
      throw new Error(`Component Structure Error in ${component}: ${rule.errorMessage}`);
    }
  }
  
  return true;
}

// Shadcn/UI component validation utility
export function validateShadcnComponentUsage(componentCode: string): void {
  const formComponentChecks = [
    {
      component: 'FormField',
      requirements: ['control', 'name'],
      errorMessage: 'FormField requires both control and name props'
    },
    {
      component: 'FormItem',
      requirements: ['FormLabel', 'FormControl', 'FormMessage'],
      errorMessage: 'FormItem should typically contain FormLabel, FormControl, and FormMessage'
    }
  ];
  
  for (const check of formComponentChecks) {
    if (componentCode.includes(check.component)) {
      const missingRequirements = check.requirements.filter(req => !componentCode.includes(req));
      if (missingRequirements.length > 0) {
        console.warn(`Warning: ${check.errorMessage}. Missing: ${missingRequirements.join(', ')}`);
      }
    }
  }
}
