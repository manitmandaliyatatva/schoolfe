import { Injectable, OnDestroy } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PendingChangesService implements OnDestroy {
  private boundBeforeUnload: (e: BeforeUnloadEvent) => void;

  constructor() {
    this.boundBeforeUnload = this.onBeforeUnload.bind(this);
    window.addEventListener('beforeunload', this.boundBeforeUnload);
  }

  ngOnDestroy() {
    window.removeEventListener('beforeunload', this.boundBeforeUnload);
  }

  private onBeforeUnload(e: BeforeUnloadEvent) {
    // Generically check if there are any dirty forms in the DOM
    // Angular automatically adds .ng-dirty to interacted forms.
    // It adds .ng-submitted when forms are submitted via ngSubmit.
    // We only want to warn if there's a dirty form that hasn't been submitted yet.
    // However, some forms are saved via manual click handlers without ngSubmit.
    // In beforeunload, if they are actively saving, closing the tab SHOULD warn them anyway,
    // because the save network request will be aborted if the tab is closed.
    
    const dirtyForms = document.querySelectorAll('form.ng-dirty');
    
    if (dirtyForms.length > 0) {
      // Browsers require preventDefault and setting returnValue to show the prompt
      e.preventDefault();
      e.returnValue = '';
    }
  }
}
