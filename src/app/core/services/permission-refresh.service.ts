import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Injectable({ providedIn: 'root' })
export class PermissionRefreshService {
  private readonly _refreshPermissionSubject = new BehaviorSubject<number>(0);
  readonly refreshPermission$ = this._refreshPermissionSubject.asObservable();
  
  readonly refreshSignal = toSignal(this._refreshPermissionSubject, { initialValue: 0 });

  triggerRefreshPermission = (): void => {
    this._refreshPermissionSubject.next(this._refreshPermissionSubject.value + 1);
  }
}
