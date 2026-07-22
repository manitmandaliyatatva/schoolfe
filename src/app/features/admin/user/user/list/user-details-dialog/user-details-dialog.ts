import { CommonModule } from '@angular/common';
import { Component, inject, signal, ViewChild, TemplateRef } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { User, UserRole } from '../../models/user.model';
import { SYSTEM_CONST } from '../../../../../../core/constants/system.constant';
import { ContactFormatPipe } from '../../../../../../shared/pipes/contact-format.pipe';
import CommonHelper from '../../../../../../core/helpers/common-helper';
import { CommonDetailViewComponent } from '../../../../../../shared/components/common-detail-view/common-detail-view';
import { DetailViewField } from '../../../../../../shared/components/common-detail-view/model/common-detail-view.model';

@Component({
  selector: 'app-user-details-dialog',
  imports: [CommonModule, ContactFormatPipe, CommonDetailViewComponent],
  templateUrl: './user-details-dialog.html',
  styleUrl: './user-details-dialog.scss',
})
export class UserDetailsDialog {
  private readonly dialogData = inject<User | null>(MAT_DIALOG_DATA, { optional: true });
  readonly user = this.dialogData;
  readonly labels = signal(SYSTEM_CONST);

  @ViewChild('phoneTemplate', { static: true }) phoneTemplate!: TemplateRef<any>;
  @ViewChild('userTypeTemplate', { static: true }) userTypeTemplate!: TemplateRef<any>;

  protected get userDetailFields(): DetailViewField[] {
    return [
      { label: this.labels().LABELS.COMMON.FIRST_NAME, key: 'firstName', span: 2 },
      { label: this.labels().LABELS.COMMON.MIDDLE_NAME, key: 'middleName', span: 2 },
      { label: this.labels().LABELS.COMMON.LAST_NAME, key: 'lastName', span: 2 },
      { label: this.labels().LABELS.COMMON.EMAIL, key: 'email', span: 3, cssClass: 'contact-value' },
      { label: this.labels().LABELS.COMMON.PHONE_NUMBER, key: 'phoneNumber', span: 3, type: 'custom', customTemplate: this.phoneTemplate },
      { label: this.labels().LABELS.USER.USER_TYPE, key: 'userRoleList', span: 3, type: 'custom', customTemplate: this.userTypeTemplate },
      { label: this.labels().LABELS.COMMON.STATUS, key: 'isActive', span: 3, type: 'status-chip' }
    ];
  }

  getValue = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined || value === '') return '-';
    return String(value);
  };

  getUserTypeText = (userRoleList: UserRole[]): string => {
    if (!CommonHelper.isNotEmptyArray(userRoleList)) return '-';
    return userRoleList.map(role => role.userTypeName).filter(name => !!name).join(', ');
  };
}

