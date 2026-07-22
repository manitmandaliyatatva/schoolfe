import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { examGroupStore, EXAM_CONST } from '../../models/exam-group.model';
import { API } from '../../../../../../shared/constants/api-url';
import { SYSTEM_CONST } from '../../../../../../core/constants/system.constant';
import CommonHelper from '../../../../../../core/helpers/common-helper';
import { CommonDateFormat } from '../../../../../../core/constants/date-format.constant';

@Component({
  selector: 'app-exam-group-detail-view',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  providers: [examGroupStore],
  templateUrl: './exam-group-detail-view.component.html',
  styleUrl: './exam-group-detail-view.component.scss',
})
export class ExamGroupDetailViewComponent implements OnInit {
  private readonly dialogData = inject<any>(MAT_DIALOG_DATA, { optional: true });
  protected readonly store = inject(examGroupStore);

  protected readonly examGroup = this.store.data;
  protected readonly isLoading = this.store.isLoading;

  protected readonly EXAM_CONST = EXAM_CONST;
  protected readonly SYSTEM_CONST = SYSTEM_CONST;
  protected readonly CommonDateFormat = CommonDateFormat;

  protected readonly blendedExams = computed(() => {
    const group = this.examGroup();
    if (!group) return [];

    const examsList: any[] = (group.exams ?? []).map((exam: any) => ({
      ...exam,
      isHoliday: false
    }));

    const holidayDates = group.holidayDates;
    if (holidayDates) {
      const datesArray = holidayDates
        .split(',')
        .map((d: string) => d.trim())
        .filter((d: string) => !!d);

      datesArray.forEach((dateStr: string) => {
        examsList.push({
          subjectName: EXAM_CONST.HOLIDAY,
          examDate: dateStr,
          startTime: '',
          endTime: '',
          maxMarks: null,
          passingMarks: null,
          isHoliday: true
        });
      });
    }

    // Sort chronologically by date
    return examsList.sort((a, b) => {
      const dateA = new Date(a.examDate).getTime();
      const dateB = new Date(b.examDate).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return (a.isHoliday ? 1 : 0) - (b.isHoliday ? 1 : 0);
    });
  });

  ngOnInit(): void {
    if (!this.dialogData) return;

    this.fetchExamGroup(this.dialogData);
  }

  private fetchExamGroup(id: string): void {
    this.store.getById({
      endpoint: API.ADMIN.EXAMINATION.EXAM_GROUP.GET,
      params: { examGroupId: id }
    });
  }

  protected formatTime(time: string): string {
    if (!time) return '-';
    return CommonHelper.formatTimeAMPM(time);
  }
}
