import { Component } from '@angular/core';
import { HomeworkReviewDetail as CommonHomeworkReviewDetail } from '../../../../common/homeworks/review/detail/homework-review-detail';

@Component({
  selector: 'app-admin-homework-review-detail',
  imports: [CommonHomeworkReviewDetail],
  template: `<app-homework-review-detail></app-homework-review-detail>`,
})
export class HomeworkReviewDetail {}
