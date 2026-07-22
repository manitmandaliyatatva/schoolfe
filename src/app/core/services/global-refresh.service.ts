import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GlobalRefreshService {
  private readonly _globalRefreshSubject = new Subject<void>();
  readonly globalRefreshObservable = this._globalRefreshSubject.asObservable();

  triggerGlobalRefresh = (): void => {
    this._globalRefreshSubject.next();
  }
}
