import { Component } from '@angular/core';
import { ExamGroupMarksViewComponent as CommonExamGroupMarksViewComponent } from '../../../../common/examination/exam-group-marks/view/exam-group-marks-view.component';

@Component({
  selector: 'app-admin-exam-group-marks-view',
  standalone: true,
  imports: [CommonExamGroupMarksViewComponent],
  template: `<app-exam-group-marks-view></app-exam-group-marks-view>`,
})
export class ExamGroupMarksViewComponent {}
