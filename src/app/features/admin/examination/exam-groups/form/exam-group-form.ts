import { Component } from '@angular/core';
import { ExamGroupForm as CommonExamGroupForm } from '../../../../common/examination/exam-groups/form/exam-group-form';

@Component({
  selector: 'app-admin-exam-group-form',
  standalone: true,
  imports: [CommonExamGroupForm],
  template: `<app-exam-group-form></app-exam-group-form>`,
})
export class ExamGroupForm {}
