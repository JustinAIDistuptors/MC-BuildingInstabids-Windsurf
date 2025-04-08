/**
 * Declaration file for component modules used in InstaBids
 */

declare module '@/components/ui/button' {
  import { ButtonHTMLAttributes } from 'react';
  import { VariantProps } from 'class-variance-authority';
  
  export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<any> {
    asChild?: boolean;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | string;
  }
  
  export const Button: React.ForwardRefExoticComponent<ButtonProps>;
}

declare module '@/components/ui/card' {
  import { HTMLAttributes } from 'react';
  
  export const Card: React.ForwardRefExoticComponent<HTMLAttributes<HTMLDivElement>>;
  export const CardHeader: React.ForwardRefExoticComponent<HTMLAttributes<HTMLDivElement>>;
  export const CardTitle: React.ForwardRefExoticComponent<HTMLAttributes<HTMLHeadingElement>>;
  export const CardDescription: React.ForwardRefExoticComponent<HTMLAttributes<HTMLParagraphElement>>;
  export const CardContent: React.ForwardRefExoticComponent<HTMLAttributes<HTMLDivElement>>;
  export const CardFooter: React.ForwardRefExoticComponent<HTMLAttributes<HTMLDivElement>>;
}

declare module '@/components/ui/form' {
  import * as React from 'react';
  import { ControllerProps, FieldPath, FieldValues } from 'react-hook-form';
  
  export const Form: React.FC<any>;
  export const FormItem: React.FC<any>;
  export const FormLabel: React.FC<any>;
  export const FormControl: React.FC<any>;
  export const FormDescription: React.FC<any>;
  export const FormMessage: React.FC<any>;
  export const FormField: <
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
  >(
    props: ControllerProps<TFieldValues, TName> & {
      name: TName;
    }
  ) => React.ReactElement;
}

declare module '@/components/ui/input' {
  import { InputHTMLAttributes } from 'react';
  
  export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}
  
  export const Input: React.ForwardRefExoticComponent<InputProps>;
}

declare module '@/components/ui/textarea' {
  import { TextareaHTMLAttributes } from 'react';
  
  export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}
  
  export const Textarea: React.ForwardRefExoticComponent<TextareaProps>;
}

declare module '@/components/ui/select' {
  import * as React from 'react';
  
  export const Select: React.FC<any>;
  export const SelectGroup: React.FC<any>;
  export const SelectValue: React.FC<any>;
  export const SelectTrigger: React.FC<any>;
  export const SelectContent: React.FC<any>;
  export const SelectLabel: React.FC<any>;
  export const SelectItem: React.FC<any>;
  export const SelectSeparator: React.FC<any>;
}

declare module '@/components/ui/badge' {
  import { HTMLAttributes } from 'react';
  import { VariantProps } from 'class-variance-authority';
  
  export interface BadgeProps extends HTMLAttributes<HTMLDivElement>, VariantProps<any> {}
  
  export const Badge: React.ForwardRefExoticComponent<BadgeProps>;
}

declare module '@/components/ui/switch' {
  import * as React from 'react';
  
  export const Switch: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>>;
}

declare module '@/components/ui/slider' {
  import * as React from 'react';
  
  export interface SliderProps extends React.HTMLAttributes<HTMLDivElement> {
    defaultValue?: number[];
    value?: number[];
    min?: number;
    max?: number;
    step?: number;
    onValueChange?: (values: number[]) => void;
  }
  
  export const Slider: React.ForwardRefExoticComponent<SliderProps>;
}

declare module '@/components/ui/progress' {
  import * as React from 'react';
  
  export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
    value?: number;
    max?: number;
  }
  
  export const Progress: React.ForwardRefExoticComponent<ProgressProps>;
}

declare module '@/components/ui/tabs' {
  import * as React from 'react';
  
  export const Tabs: React.FC<any>;
  export const TabsList: React.FC<any>;
  export const TabsTrigger: React.FC<any>;
  export const TabsContent: React.FC<any>;
}

declare module '@/components/ui/tooltip' {
  import * as React from 'react';
  
  export const Tooltip: React.FC<any>;
  export const TooltipTrigger: React.FC<any>;
  export const TooltipContent: React.FC<any>;
  export const TooltipProvider: React.FC<any>;
}

declare module '@/components/ui/popover' {
  import * as React from 'react';
  
  export const Popover: React.FC<any>;
  export const PopoverTrigger: React.FC<any>;
  export const PopoverContent: React.FC<any>;
}

declare module '@/components/ui/separator' {
  import * as React from 'react';
  
  export const Separator: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement>>;
}

declare module '@/components/ui/toast' {
  import * as React from 'react';
  
  export const Toast: React.FC<any>;
  export const ToastAction: React.FC<any>;
  export const ToastClose: React.FC<any>;
  export const ToastDescription: React.FC<any>;
  export const ToastProvider: React.FC<any>;
  export const ToastTitle: React.FC<any>;
  export const ToastViewport: React.FC<any>;
  export const toast: any;
}

declare module '@/components/ui/use-toast' {
  export interface ToastProps {
    title?: string;
    description?: React.ReactNode;
    action?: React.ReactNode;
    variant?: 'default' | 'destructive';
  }
  
  export const toast: {
    (props: ToastProps): void;
    dismiss: (toastId?: string) => void;
    error: (props: ToastProps) => void;
    success: (props: ToastProps) => void;
    warning: (props: ToastProps) => void;
    info: (props: ToastProps) => void;
  };
}

declare module '@/components/ui/toaster' {
  import * as React from 'react';
  
  export const Toaster: React.FC;
}

declare module 'lucide-react' {
  import * as React from 'react';
  
  export interface LucideProps extends React.SVGProps<SVGSVGElement> {
    size?: number | string;
    absoluteStrokeWidth?: boolean;
  }
  
  export type LucideIcon = React.FC<LucideProps>;
  
  export const ArrowLeft: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const Save: LucideIcon;
  export const Check: LucideIcon;
  export const Loader2: LucideIcon;
  export const Upload: LucideIcon;
  export const Image: LucideIcon;
  export const File: LucideIcon;
  export const Trash: LucideIcon;
  export const Info: LucideIcon;
  export const AlertCircle: LucideIcon;
}

// Form step component declarations
declare module './form-steps/ProjectClassificationStep' {
  import React from 'react';
  import { BidCardFormState } from '@/types/bidding';
  
  interface ProjectClassificationStepProps {
    formState: BidCardFormState;
    onUpdate: (updates: Partial<BidCardFormState>) => void;
  }
  
  const ProjectClassificationStep: React.FC<ProjectClassificationStepProps>;
  export default ProjectClassificationStep;
}

declare module './form-steps/ProjectDetailsStep' {
  import React from 'react';
  import { BidCardFormState } from '@/types/bidding';
  
  interface ProjectDetailsStepProps {
    formState: BidCardFormState;
    onUpdate: (updates: Partial<BidCardFormState>) => void;
  }
  
  const ProjectDetailsStep: React.FC<ProjectDetailsStepProps>;
  export default ProjectDetailsStep;
}

declare module './form-steps/LocationTimelineStep' {
  import React from 'react';
  import { BidCardFormState } from '@/types/bidding';
  
  interface LocationTimelineStepProps {
    formState: BidCardFormState;
    onUpdate: (updates: Partial<BidCardFormState>) => void;
  }
  
  const LocationTimelineStep: React.FC<LocationTimelineStepProps>;
  export default LocationTimelineStep;
}

declare module './form-steps/BudgetBiddingStep' {
  import React from 'react';
  import { BidCardFormState } from '@/types/bidding';
  
  interface BudgetBiddingStepProps {
    formState: BidCardFormState;
    onUpdate: (updates: Partial<BidCardFormState>) => void;
  }
  
  const BudgetBiddingStep: React.FC<BudgetBiddingStepProps>;
  export default BudgetBiddingStep;
}

declare module './form-steps/MediaUploadStep' {
  import React from 'react';
  import { BidCardFormState } from '@/types/bidding';
  
  interface MediaUploadStepProps {
    formState: BidCardFormState;
    onUpdate: (updates: Partial<BidCardFormState>) => void;
    onFileAdd: (file: File) => void;
    onFileRemove: (fileIndex: number) => void;
    files: File[];
  }
  
  const MediaUploadStep: React.FC<MediaUploadStepProps>;
  export default MediaUploadStep;
}

declare module './form-steps/ReviewSubmitStep' {
  import React from 'react';
  import { BidCardFormState } from '@/types/bidding';
  
  interface ReviewSubmitStepProps {
    formState: BidCardFormState;
    files: File[];
  }
  
  const ReviewSubmitStep: React.FC<ReviewSubmitStepProps>;
  export default ReviewSubmitStep;
}
