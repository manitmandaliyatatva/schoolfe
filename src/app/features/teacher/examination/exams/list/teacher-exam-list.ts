import { Component } from '@angular/core';
import { ExamGroupListComponent as CommonExamGroupListComponent } from '../../../../common/examination/exam-groups/list/exam-group-list';

@Component({
  selector: 'app-teacher-exam-list',
  standalone: true,
  imports: [CommonExamGroupListComponent],
  template: `<app-exam-group-list></app-exam-group-list>`,
})
export class TeacherExamList {}
