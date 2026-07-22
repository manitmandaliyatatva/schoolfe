import { inject, Injectable, signal, effect, computed } from '@angular/core';
import { GenericDialogService } from '../../shared/services/generic-dialog.service';
import { Observable } from 'rxjs';
import { ImportDialogComponent } from '../../shared/components/import-dialog/import-dialog';
import { base64DocumentStore } from '../../shared/models/document.model';
import FileHelper from '../../shared/helpers/file.helper';
import { buildGridToolbarButton } from '../../shared/helpers/grid.helper';
import { CommonButtonConfig } from '../../shared/components/button/model/button.model';
import { ToastrHelperService } from './toster-helper.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CommonHelperService } from './common-helper.service';

export interface IExportConfig<T = any> {
  endpoint: string;
  payload?: T;
  defaultFileName?: string;
}

export interface IImportConfig<T = any> {
  title?: string;
  sampleFileEndpoint?: string;
  endpoint: string;
  queryParams?: T;
}

export const ExportConst = {
  SUCCESS: 'File exported successfully.',
  ERROR: 'File export failed.',
  FileName: {
    TeacherList: 'TeacherList.xlsx',
    StudentList: 'StudentList.xlsx',
    Marks: (examName: string) => `Marks-${examName}.xlsx`,
    MonthlyAttendance: (exportType: string, monthName: string, year: number) => `${exportType}Attendance-${monthName}-${year}.xlsx`
  }
};

@UntilDestroy()
@Injectable({
  providedIn: 'root'
})
export class ExportService {
  private readonly exportStore = inject(base64DocumentStore);
  private readonly toastr = inject(ToastrHelperService);
  private readonly genericDialogService = inject(GenericDialogService);
  private readonly commonHelperService = inject(CommonHelperService);
  private readonly activeConfig = signal<IExportConfig | null>(null);

  // Expose reactive status signals to components
  readonly isExporting = computed(() => this.exportStore.isSubmitting() || this.exportStore.isLoading());

  /**
   * Generates a standardized CommonButtonConfig for the Export button.
   * By default, it disables the button when the export is currently running.
   */
  getExportButtonConfig(callback: () => void, customDisableCallback?: () => boolean): CommonButtonConfig {
    return buildGridToolbarButton({
      icon: 'download',
      tooltipText: 'Export',
      callback,
      disableCallBack: customDisableCallback || (() => this.isExporting()),
      isBtnVisible: () => this.commonHelperService.getPermissionByPage().canExport,
      isPrimary: true
    });
  }

  /**
   * Generates a standardized CommonButtonConfig for the Import button.
   */
  getImportButtonConfig(config: () => IImportConfig | null, onSuccess?: () => void): CommonButtonConfig {
    return buildGridToolbarButton({
      icon: 'upload',
      tooltipText: 'Import',
      callback: () => {
        const importConfig = config();
        if (importConfig) {
          this.openImportDialog(importConfig).pipe(untilDestroyed(this)).subscribe(result => {
            if (result && onSuccess) onSuccess();
          });
        }
      },
      disableCallBack: () => false,
      isBtnVisible: () => this.commonHelperService.getPermissionByPage().canImport,
      isPrimary: true
    });
  }

  /**
   * Opens the import dialog and returns an observable with the selected file.
   */
  openImportDialog(config: IImportConfig): Observable<any> {
    return this.genericDialogService.open({
      width: '500px',
      title: config.title || 'Import Data',
      component: ImportDialogComponent,
      disableClose: true,
      data: {
        title: config.title,
        sampleFileEndpoint: config.sampleFileEndpoint,
        endpoint: config.endpoint,
        queryParams: config.queryParams
      }
    }).afterClosed();
  }

  constructor() {
    // Reactive effect for handling successful store responses
    effect(() => {
      if (this.exportStore.isSuccess()) {
        const config = this.activeConfig();
        if (config) {
          const fileData = this.exportStore.data();
          if (fileData && typeof fileData === 'string') {
            const normalizedBase64 = FileHelper.normalizeBase64(fileData);
            if (normalizedBase64) {
              const resolvedFileName = config.defaultFileName || 'Export.xlsx';
              const resolvedContentType = FileHelper.resolveContentType(undefined, resolvedFileName, fileData);
              FileHelper.downloadBase64(normalizedBase64, resolvedFileName, resolvedContentType);
              this.toastr.showSuccessMessage(ExportConst.SUCCESS);
            }
          }
          // Reset local config and store state
          setTimeout(() => {
            this.activeConfig.set(null);
            this.exportStore.resetState();
          });
        }
      }
    });

    // Reactive effect for handling store errors
    effect(() => {
      const errorMsg = this.exportStore.error();
      if (errorMsg && this.activeConfig()) {
        this.toastr.showErrorMessage(ExportConst.ERROR);
        setTimeout(() => {
          this.activeConfig.set(null);
          this.exportStore.resetState();
        });
      }
    });
  }

  /**
   * Triggers the download of an export file from a Base64 API endpoint using base64DocumentStore.
   * Performs a POST request, handles loading state.
   */
  export<T>(config: IExportConfig<T>): void {
    if (this.isExporting()) {
      return;
    }

    const { endpoint, payload } = config;

    this.activeConfig.set(config);
    this.exportStore.resetState();

    this.exportStore.create({
      endpoint: endpoint,
      body: payload as any
    });
  }
}
