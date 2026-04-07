const ERROR_MESSAGES: Record<string, (params?: Record<string, unknown>) => string> = {
    required: () => 'This field is required',
    email: () => 'Please enter a valid email',
    minlength: (p) => `Minimum ${p?.['requiredLength']} characters`,
    maxlength: (p) => `Maximum ${p?.['requiredLength']} characters`,
    pattern: () => 'Invalid format',
};

export function getFirstError(errors: Record<string, unknown> | null): string | null {
    if (!errors) {
        return null;
    }
    const firstKey = Object.keys(errors)[0];
    const messageFn = ERROR_MESSAGES[firstKey];
    return messageFn ? messageFn(errors[firstKey] as Record<string, unknown>) : 'Invalid value';
}
