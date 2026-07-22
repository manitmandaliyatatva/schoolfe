import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import CommonHelper from '../../../../../core/helpers/common-helper';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { CommonHelperService } from '../../../../../core/services/common-helper.service';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { CommonButtonConfig } from '../../../../../shared/components/button/model/button.model';
import { API } from '../../../../../shared/constants/api-url';
import { getButtonConfig } from '../../../../../shared/functions/config-function';
import { ConfirmationService } from '../../../../../shared/services/dialog.service';
import { GenericDialogService } from '../../../../../shared/services/generic-dialog.service';
import { DialogAction } from '../../../../../shared/components/generic-dialog/models/config/dialog-config';
import { GenericDialog } from '../../../../../shared/components/generic-dialog/generic-dialog';
import { CALENDAR_CONST, eventDocumentBase64Store, calendarStore } from '../models/calendar.model';
import { AuthStore } from '../../../../../core/store/auth.store';

@Component({
  selector: 'common-calendar-view',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    ButtonComponent,
  ],
  templateUrl: './calendar-view.html',
  styleUrl: './calendar-view.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [calendarStore, eventDocumentBase64Store],
})
export class CalendarView implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<any>);
  private readonly dialogData = inject<any>(MAT_DIALOG_DATA);
  protected readonly store = inject(calendarStore);
  protected readonly attachmentStore = inject(eventDocumentBase64Store);
  private readonly commonHelperService = inject(CommonHelperService);
  private readonly confirmService = inject(ConfirmationService);
  private readonly genericDialogService = inject(GenericDialogService);
  private readonly genericDialog = inject(GenericDialog, { optional: true });
  private readonly authStore = inject(AuthStore);

  readonly isPastAcademicYear = computed(() =>
    CommonHelper.isPastAcademicYear(
      this.authStore.iscurrentacademicyear(),
      this.authStore.academicyearenddate()
    )
  );

  readonly event = computed(() => this.store.data());
  readonly permission = computed(() => this.commonHelperService.getPermissionByPage());

  constructor() {
    effect(() => {
      if (this.genericDialog) {
        const actions: DialogAction[] = [this.editBtnConfig(), this.deleteBtnConfig()];
        this.genericDialog.setHeaderActions(actions);
      }
    });

    effect(() => {
      const base64Data = this.attachmentStore.data();
      if (!base64Data) return;

      const event = this.event();
      const fileName = event?.eventFileName || CALENDAR_CONST.EVENT_ATTACHMENT;

      this.genericDialogService.openDocumentViewer(base64Data, fileName);
      this.attachmentStore.resetState();
    });
  }
  readonly CALENDAR_CONST = CALENDAR_CONST;
  readonly SYSTEM_CONST = SYSTEM_CONST;
  readonly attachmentBtnConfig = computed<CommonButtonConfig>(() => ({
    ...getButtonConfig(() => this.onViewAttachment(), 'basic', 'primary', SYSTEM_CONST.ACTION_BUTTONS.VIEW),
    icon: 'visibility',
    cssClasses: ['rounded-pill', 'px-4'],
  }));

  readonly editBtnConfig = computed<DialogAction>(() => ({
    ...getButtonConfig(() => this.onEdit(), 'icon', 'primary', ''),
    icon: 'edit',
    cssClasses: ['action-btn', 'edit-btn'],
    closeOnClick: false,
    visibleCallback: () => {
      if (this.dialogData?.hideActions) return false;
      const event = this.event();
      if (!event || !this.permission().canUpdate || !event.allowToEditDelete) return false;

      return !this.isPastAcademicYear() && CommonHelper.isFutureEvent(event.startDate, event.isAllDay);
    },
  }));

  readonly deleteBtnConfig = computed<DialogAction>(() => ({
    ...getButtonConfig(() => this.onDelete(), 'icon', 'warn', ''),
    icon: 'delete',
    cssClasses: ['action-btn', 'delete-btn'],
    closeOnClick: false,
    visibleCallback: () => {
      if (this.dialogData?.hideActions) return false;
      const event = this.event();
      if (!event || !this.permission().canDelete || !event.allowToEditDelete) return false;

      return !this.isPastAcademicYear() && CommonHelper.isFutureEvent(event.startDate, event.isAllDay);
    },
  }));

  ngOnInit(): void {
    if (this.dialogData?.id) {
      this.store.getById({
        endpoint: API.ADMIN.CALENDAR.EVENTS.GET,
        params: { eventId: this.dialogData.id },
      });
    }
  }

  onEdit(): void {
    this.dialogRef.close({ action: 'edit', id: this.dialogData.id });
  }

  onDelete(): void {
    const event = this.event();
    if (!event) return;

    this.confirmService
      .confirm({
        title: SYSTEM_CONST.ACTION_BUTTONS.DELETE,
        message: SYSTEM_CONST.ACTIONS.CONFIRM_DELETE(event.eventTitle),
        confirmText: SYSTEM_CONST.ACTION_BUTTONS.DELETE,
        cancelText: SYSTEM_CONST.ACTION_BUTTONS.CANCEL,
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.store.remove({
            endpoint: API.ADMIN.CALENDAR.EVENTS.DELETE,
            params: { eventId: event.eventId },
          });
          this.dialogRef.close({ action: 'deleted' });
        }
      });
  }


  onViewAttachment(): void {
    const event = this.event();
    if (!event?.eventId) return;

    this.attachmentStore.getById({
      endpoint: API.ADMIN.CALENDAR.EVENTS.BASE64,
      params: { eventId: event.eventId },
    });
  }
}
