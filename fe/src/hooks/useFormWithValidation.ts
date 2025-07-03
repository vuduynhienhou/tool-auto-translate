import { useForm, UseFormProps, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export interface FormWithValidationOptions<T> extends Omit<UseFormProps<T>, 'resolver'> {
  schema: z.ZodSchema<T>;
}

export interface FormWithValidationReturn<T> extends UseFormReturn<T> {
  hasErrors: boolean;
  errorCount: number;
  isSubmitting: boolean;
  isDirty: boolean;
  submitWithToast: (
    onSubmit: (data: T) => Promise<void> | void,
    successMessage?: string,
    errorMessage?: string
  ) => Promise<void>;
}

export function useFormWithValidation<T>({
  schema,
  ...formOptions
}: FormWithValidationOptions<T>): FormWithValidationReturn<T> {
  const form = useForm<T>({
    ...formOptions,
    resolver: zodResolver(schema),
  });

  const { formState, handleSubmit } = form;

  const hasErrors = Object.keys(formState.errors).length > 0;
  const errorCount = Object.keys(formState.errors).length;

  const submitWithToast = async (
    onSubmit: (data: T) => Promise<void> | void,
    successMessage?: string,
    errorMessage?: string
  ) => {
    try {
      await handleSubmit(async (data) => {
        await onSubmit(data);
      })();
    } catch (error) {
      console.error('Form submission error:', error);
      // Toast would be handled by useAsyncOperation if used together
    }
  };

  return {
    ...form,
    hasErrors,
    errorCount,
    isSubmitting: formState.isSubmitting,
    isDirty: formState.isDirty,
    submitWithToast,
  };
}