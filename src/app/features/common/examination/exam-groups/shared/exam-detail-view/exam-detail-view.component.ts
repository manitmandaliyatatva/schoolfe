import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Exam, EXAM_CONST } from '../../models/exam-group.model';
import { SYSTEM_CONST } from '../../../../../../core/constants/system.constant';
import { AuthStore } from '../../../../../../core/store/auth.store';
import CommonHelper from '../../../../../../core/helpers/common-helper';
import { CommonDateFormat } from '../../../../../../core/constants/date-format.constant';

@Component({
  selector: 'app-exam-detail-view',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './exam-detail-view.component.html',
  styleUrl: './exam-detail-view.component.scss',
})
export class ExamDetailViewComponent {
  protected readonly data = inject<Exam | null>(MAT_DIALOG_DATA, { optional: true });
  protected readonly EXAM_CONST = EXAM_CONST;
  protected readonly SYSTEM_CONST = SYSTEM_CONST;
  protected readonly CommonDateFormat = CommonDateFormat;
  private readonly authStore = inject(AuthStore);

  protected readonly isStudent = this.authStore.isStudent;

  protected formatTime(time: string): string {
    if (!time) return '-';
    return CommonHelper.formatTimeAMPM(time);
  }
}
