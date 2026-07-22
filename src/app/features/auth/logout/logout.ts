import { Component } from '@angular/core';
import { LOGIN_CONST } from '../auth.model';

@Component({
  selector: 'app-logout',
  imports: [],
  templateUrl: './logout.html',
  styleUrl: './logout.scss',
})
export class Logout {
  readonly LOGIN_CONST = LOGIN_CONST;
}
