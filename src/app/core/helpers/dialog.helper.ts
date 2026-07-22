import { MatDialogConfig } from '@angular/material/dialog';

export function getDefaultDialogConfig<T>(
  data: T
): MatDialogConfig<T> {
  return {
    width: '800px',
    maxWidth: 'fit-content',
    disableClose: true,
    data
  };
}
