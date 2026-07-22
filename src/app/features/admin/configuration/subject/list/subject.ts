import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SubjectList as CommonSubjectList } from '../../../../common/configuration/subjects/list/subject-list';

@Component({
  selector: 'app-subject',
  imports: [CommonSubjectList],
  template: `<common-subject-list></common-subject-list>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Subject {}
