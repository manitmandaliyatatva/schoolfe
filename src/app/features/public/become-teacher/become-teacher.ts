import { Component, inject } from '@angular/core';
import { PublicSettingStore } from '../../../core/store/public-setting.store';

@Component({
  selector: 'app-become-teacher',
  imports: [],
  templateUrl: './become-teacher.html',
  styleUrl: './become-teacher.scss',
})
export class BecomeTeacher {
  public settingService = inject(PublicSettingStore);
}
