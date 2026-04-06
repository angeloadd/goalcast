import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
    let service: ToastService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ToastService);
    });

    it('should add a toast on success()', () => {
        service.success('Saved!');
        expect(service.toasts().length).toBe(1);
        expect(service.toasts()[0].type).toBe('success');
        expect(service.toasts()[0].message).toBe('Saved!');
    });

    it('should add a toast on error()', () => {
        service.error('Something went wrong');
        expect(service.toasts().length).toBe(1);
        expect(service.toasts()[0].type).toBe('error');
    });

    it('should auto-dismiss after duration', () => {
        vi.useFakeTimers();
        service.success('Temporary', 1000);
        expect(service.toasts().length).toBe(1);
        vi.advanceTimersByTime(1000);
        expect(service.toasts().length).toBe(0);
        vi.useRealTimers();
    });

    it('should allow manual dismiss', () => {
        service.success('Dismissable');
        const id = service.toasts()[0].id;
        service.dismiss(id);
        expect(service.toasts().length).toBe(0);
    });
});
