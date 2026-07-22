import { Component } from '@angular/core';
import { ExamGroupMarksListComponent as CommonExamGroupMarksListComponent } from '../../../../common/examination/exam-group-marks/list/exam-group-marks-list';

@Component({
  selector: 'app-teacher-marks-list',
  standalone: true,
  imports: [CommonExamGroupMarksListComponent],
  template: `<app-exam-group-marks-list></app-exam-group-marks-list>`,
})
export class TeacherMarksList {}
