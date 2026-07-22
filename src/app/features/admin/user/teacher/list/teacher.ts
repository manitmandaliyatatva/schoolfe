import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TeacherList } from '../../../../common/users/teacher/list/teacher-list';

@Component({
  selector: 'app-teacher-list',
  imports: [TeacherList],
  template: `<common-teacher-list></common-teacher-list>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherComponent {}
