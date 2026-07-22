import { ChangeDetectionStrategy, Component } from '@angular/core';
import { StudentView as CommonStudentView } from '../../../../common/users/student/view/student-view';

@Component({
  selector: 'app-student-view',
  standalone: true,
  imports: [CommonStudentView],
  template: `<common-student-view></common-student-view>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentView {}
