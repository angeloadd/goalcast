import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
    private _toasts = signal<Toast[]>([]);
    readonly toasts = this._toasts.asReadonly();

    success(message: string, duration = 4000): void {
        this.add('success', message, duration);
    }

    error(message: string, duration = 6000): void {
        this.add('error', message, duration);
    }

    info(message: string, duration = 4000): void {
        this.add('info', message, duration);
    }

    dismiss(id: string): void {
        this._toasts.update((toasts) => toasts.filter((t) => t.id !== id));
    }

    private add(type: ToastType, message: string, duration: number): void {
        const id = crypto.randomUUID();
        this._toasts.update((toasts) => [...toasts, { id, type, message }]);
        setTimeout(() => this.dismiss(id), duration);
    }
}
