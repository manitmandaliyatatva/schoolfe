import { Component } from '@angular/core';
import { HomeworkList as CommonHomeworkList } from '../../../../common/homeworks/homeworks/list/homework-list';

@Component({
  selector: 'app-teacher-homework-list',
  imports: [CommonHomeworkList],
  template: `<app-homework-list></app-homework-list>`,
})
export class TeacherHomeworkList {}

