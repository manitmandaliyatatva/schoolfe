import { Component } from '@angular/core';
import { SYSTEM_CONST } from '../../core/constants/system.constant';

@Component({
  selector: 'app-not-found',
  imports: [],
  templateUrl: './not-found.html',
  styleUrl: './not-found.scss',
})
export class NotFound {
  SystemConst = SYSTEM_CONST;
}
