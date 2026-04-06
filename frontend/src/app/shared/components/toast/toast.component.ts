import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
    bootstrapCheckCircle,
    bootstrapExclamationTriangle,
    bootstrapInfoCircle,
    bootstrapX,
} from '@ng-icons/bootstrap-icons';

@Component({
    selector: 'fb-toaster',
    imports: [NgIcon],
    viewProviders: [
        provideIcons({
            bootstrapCheckCircle,
            bootstrapExclamationTriangle,
            bootstrapInfoCircle,
            bootstrapX,
        }),
    ],
    templateUrl: './toast.component.html',
})
export class ToasterComponent {
    toastService = inject(ToastService);
}
