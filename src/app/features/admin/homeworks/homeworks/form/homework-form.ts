import { Component } from '@angular/core';
import { HomeworkForm as CommonHomeworkForm } from '../../../../common/homeworks/homeworks/form/homework-form';

@Component({
  selector: 'app-admin-homework-form',
  imports: [CommonHomeworkForm],
  template: `<app-homework-form></app-homework-form>`,
})
export class HomeworkForm {}
