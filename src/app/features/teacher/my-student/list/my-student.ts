import { ChangeDetectionStrategy, Component } from '@angular/core';
import { StudentList } from '../../../common/users/student/list/student-list';

@Component({
  selector: 'app-my-student',
  standalone: true,
  imports: [StudentList],
  template: `<common-student-list></common-student-list>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyStudentComponent {}
