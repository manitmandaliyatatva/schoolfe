import { ChangeDetectionStrategy, Component, computed, input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import CommonHelper from '../../../core/helpers/common-helper';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonDateFormat } from '../../../core/constants/date-format.constant';

export interface ResultCardData {
  examStudentId?: string;
  examName: string;
  subjectName: string;
  examDate: string | Date;
  startTime: string;
  endTime: string;
  evaluatedByName: string;
  evaluatedDate: string | Date;
  obtainedMarks: number;
  maxMarks: number;
  passingMarks: number;
  percentage: number;
  grade: string;
  isAbsent: boolean;
  remarks?: string;
}

@Component({
  selector: 'app-result-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  templateUrl: './result-card.component.html',
  styleUrl: './result-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultCardComponent {
  readonly CommonDateFormat = CommonDateFormat;
  readonly data = input.required<ResultCardData>();

  @Output() readonly downloadCertificate = new EventEmitter<string>();

  onDownloadCertificate(event: MouseEvent): void {
    event.stopPropagation();
    if (this.data().examStudentId) {
      this.downloadCertificate.emit(this.data().examStudentId);
    }
  }

  readonly letterIcon = computed(() => {
    const subject = this.data().subjectName;
    return subject ? subject.charAt(0).toUpperCase() : 'E';
  });

  readonly isPass = computed(() => {
    const d = this.data();
    if (d.isAbsent) return false;
    return (d.obtainedMarks ?? 0) >= (d.passingMarks ?? 0);
  });

  readonly formattedTimeRange = computed(() => {
    return `${CommonHelper.formatTimeAMPM(this.data().startTime)} – ${CommonHelper.formatTimeAMPM(this.data().endTime)}`;
  });

  readonly circumference = 2 * Math.PI * 26;

  readonly dashoffset = computed(() => {
    const p = this.data().percentage || 0;
    return this.circumference - (p / 100) * this.circumference;
  });

  readonly progressColor = computed(() => {
    const p = this.data().percentage || 0;
    if (p >= 90) return '#00b074';
    if (p >= 75) return '#0284c7';
    if (p >= 50) return '#ff9b00';
    return '#ff5b5b';
  });
}
