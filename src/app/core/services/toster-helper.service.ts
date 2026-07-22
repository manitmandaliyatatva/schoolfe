import { inject, Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
    providedIn: 'root'
})
export class ToastrHelperService {

    private toastr = inject(ToastrService)

    showSuccessMessage = (message: string, title?: string) => {
        this.showToast('success', message, title);
    }

    showErrorMessage = (message: string, title?: string) =>{
        this.showToast('error', message, title);
    }

    showWarningMessage = (message: string, title?: string) => {
        this.showToast('warning', message, title);
    }

    showInfoMessage = (message: string, title?: string) => {
        this.showToast('info', message, title);
    }

    private showToast = (type: 'success' | 'error' | 'warning' | 'info', message: string, title?: string) => {
        this.tosterConfig();
        this.toastr[type](message, title);
    }
    private tosterConfig = () => {
        this.toastr.toastrConfig.progressBar = true;
        this.toastr.toastrConfig.newestOnTop = true;
        this.toastr.toastrConfig.closeButton = true;
        this.toastr.toastrConfig.autoDismiss = true;
        this.toastr.toastrConfig.timeOut = 3000;
        this.toastr.toastrConfig.tapToDismiss = true;
    }
}