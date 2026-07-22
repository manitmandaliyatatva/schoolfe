import { Component } from '@angular/core';
import { ExamGroupMarksEditComponent as CommonExamGroupMarksEditComponent } from '../../../../common/examination/exam-group-marks/edit/exam-group-marks-edit.component';

@Component({
  selector: 'app-admin-exam-group-marks-edit',
  standalone: true,
  imports: [CommonExamGroupMarksEditComponent],
  template: `<app-exam-group-marks-edit></app-exam-group-marks-edit>`,
})
export class ExamGroupMarksEditComponent {}
