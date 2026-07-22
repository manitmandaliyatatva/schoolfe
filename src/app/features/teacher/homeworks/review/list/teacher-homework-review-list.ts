import { Component } from '@angular/core';
import { HomeworkReviewList as CommonHomeworkReviewList } from '../../../../common/homeworks/review/list/homework-review-list';

@Component({
  selector: 'app-teacher-homework-review-list',
  imports: [CommonHomeworkReviewList],
  template: `<app-homework-review-list></app-homework-review-list>`,
})
export class TeacherHomeworkReviewList {}

