/**
 * Component Pre-Implementation Checklist
 * Run this before implementing any new component
 */

import fs from 'fs';
import path from 'path';

export interface ComponentCheckResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Shadcn/UI Component Rules
 */
export const SHADCN_COMPONENT_RULES = {
  // Component nesting requirements
  RadioGroupItem: { requiredParent: 'RadioGroup' },
  SelectItem: { requiredParent: 'Select' },
  TabsContent: { requiredParent: 'Tabs' },
  AccordionItem: { requiredParent: 'Accordion' },
  MenubarItem: { requiredParent: 'Menubar' },
  
  // Form component requirements
  FormField: { requiredProps: ['control', 'name'] },
  FormItem: { requiredChildren: ['FormLabel', 'FormControl', 'FormMessage'] },
  
  // Dialog component requirements
  DialogContent: { requiredParent: 'Dialog' },
  
  // Command component requirements
  CommandItem: { requiredParent: 'CommandGroup' },
  
  // Other component requirements
  TooltipContent: { requiredParent: 'Tooltip' },
  DropdownMenuItem: { requiredParent: 'DropdownMenu' },
};

/**
 * Validate component structure based on rules
 */
export function validateComponentStructure(componentCode: string): ComponentCheckResult {
  const result: ComponentCheckResult = {
    passed: true,
    errors: [],
    warnings: [],
  };
  
  // Check for Shadcn/UI component rules
  Object.entries(SHADCN_COMPONENT_RULES).forEach(([component, rules]) => {
    if (componentCode.includes(component)) {
      // Check for required parent
      if (rules.requiredParent && !componentCode.includes(rules.requiredParent)) {
        result.passed = false;
        result.errors.push(`${component} must be used within ${rules.requiredParent}`);
      }
      
      // Check for required props
      if (rules.requiredProps) {
        const missingProps = rules.requiredProps.filter(prop => !componentCode.includes(`${prop}=`));
        if (missingProps.length > 0) {
          result.warnings.push(`${component} should include props: ${missingProps.join(', ')}`);
        }
      }
      
      // Check for required children
      if (rules.requiredChildren) {
        const missingChildren = rules.requiredChildren.filter(child => !componentCode.includes(child));
        if (missingChildren.length > 0) {
          result.warnings.push(`${component} should contain: ${missingChildren.join(', ')}`);
        }
      }
    }
  });
  
  // Check for React Hook Form context
  if (componentCode.includes('useFormContext') && !componentCode.includes('<FormProvider')) {
    result.warnings.push('Component uses useFormContext but might be missing FormProvider wrapper');
  }
  
  // Check for 'use client' directive
  if (componentCode.includes('useEffect') || 
      componentCode.includes('useState') || 
      componentCode.includes('useRef')) {
    if (!componentCode.includes("'use client'")) {
      result.errors.push("Component uses React hooks but is missing 'use client' directive");
      result.passed = false;
    }
  }
  
  return result;
}

/**
 * TypeScript interface validation
 */
export function validateTypeScriptInterfaces(componentCode: string): ComponentCheckResult {
  const result: ComponentCheckResult = {
    passed: true,
    errors: [],
    warnings: [],
  };
  
  // Check for explicit prop interfaces
  if (componentCode.includes('function') && 
      componentCode.includes('Props') && 
      !componentCode.includes('interface') && 
      !componentCode.includes('type')) {
    result.warnings.push('Component might be missing explicit TypeScript interface for props');
  }
  
  // Check for any type
  if (componentCode.includes(': any')) {
    result.warnings.push('Component uses any type which should be avoided');
  }
  
  // Check for proper React imports
  if (!componentCode.includes('import React')) {
    result.warnings.push('Component is missing React import');
  }
  
  return result;
}

/**
 * Run all checks on a component before implementation
 */
export function runComponentPreCheck(componentCode: string): ComponentCheckResult {
  const structureResult = validateComponentStructure(componentCode);
  const typeResult = validateTypeScriptInterfaces(componentCode);
  
  return {
    passed: structureResult.passed && typeResult.passed,
    errors: [...structureResult.errors, ...typeResult.errors],
    warnings: [...structureResult.warnings, ...typeResult.warnings],
  };
}
