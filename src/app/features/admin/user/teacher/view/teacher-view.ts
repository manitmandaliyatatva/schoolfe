import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TeacherView as CommonTeacherView } from '../../../../common/users/teacher/view/teacher-view';

@Component({
  selector: 'app-teacher-view',
  standalone: true,
  imports: [CommonTeacherView],
  template: `<common-teacher-view></common-teacher-view>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherView {}
