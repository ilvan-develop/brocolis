"use client";

import { cn } from "@brocolis/ui/lib/utils";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type {
  Control,
  ControllerFieldState,
  ControllerProps,
  ControllerRenderProps,
  FieldPath,
  FieldPathValue,
  FieldValues,
  UseFormStateReturn,
} from "react-hook-form";
import { useController } from "react-hook-form";

type FormProps<T extends FieldValues> = ComponentPropsWithoutRef<"form">;

function Form<T extends FieldValues>({ className, ...props }: FormProps<T>) {
  return <form data-slot="form" className={cn("", className)} {...props} />;
}

type FormItemProps = ComponentPropsWithoutRef<"div">;

function FormItem({ className, ...props }: FormItemProps) {
  return <div data-slot="form-item" className={cn("", className)} {...props} />;
}

type FormLabelProps = ComponentPropsWithoutRef<"label">;

function FormLabel({ className, htmlFor, ...props }: FormLabelProps) {
  return (
    <label
      data-slot="form-label"
      htmlFor={htmlFor}
      className={cn(
        "text-foreground text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

type FormControlProps = ComponentPropsWithoutRef<"div">;

function FormControl({ className, ...props }: FormControlProps) {
  return (
    <div data-slot="form-control" className={cn("", className)} {...props} />
  );
}

type FormMessageProps = ComponentPropsWithoutRef<"p">;

function FormMessage({ className, ...props }: FormMessageProps) {
  return (
    <p
      data-slot="form-message"
      className={cn("text-destructive text-sm", className)}
      {...props}
    />
  );
}

type FormDescriptionProps = ComponentPropsWithoutRef<"p">;

function FormDescription({ className, ...props }: FormDescriptionProps) {
  return (
    <p
      data-slot="form-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

type FormFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = Omit<ControllerProps<TFieldValues, TName>, "render"> & {
  render: (args: {
    field: ControllerRenderProps<TFieldValues, TName>;
    fieldState: ControllerFieldState;
    formState: UseFormStateReturn<TFieldValues>;
  }) => ReactNode;
};

function FormField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({ control, name, render, ...props }: FormFieldProps<TFieldValues, TName>) {
  const { field, fieldState, formState } = useController({
    control: control as Control<TFieldValues>,
    name,
    ...props,
  } as unknown as ControllerProps<TFieldValues, TName>);

  return <>{render({ field, fieldState, formState })}</>;
}

export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
};
