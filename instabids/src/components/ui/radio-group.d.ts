import * as React from "react";

export interface RadioGroupProps extends React.ComponentPropsWithoutRef<'div'> {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  className?: string;
}

export interface RadioGroupItemProps extends React.ComponentPropsWithoutRef<'button'> {
  value: string;
  id?: string;
  className?: string;
}

export const RadioGroup: React.ForwardRefExoticComponent<
  RadioGroupProps & React.RefAttributes<HTMLDivElement>
>;

export const RadioGroupItem: React.ForwardRefExoticComponent<
  RadioGroupItemProps & React.RefAttributes<HTMLButtonElement>
>;
