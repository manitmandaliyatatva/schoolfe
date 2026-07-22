import { inject, Injectable, effect, untracked } from "@angular/core";
import { patchState } from "@ngrx/signals";
import { API } from "../../shared/constants/api-url";
import { AuthStore } from "./auth.store";
import { createGenericStore } from "./resource.store";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { WeekdaysOff } from "../../features/admin/configuration/weekoff-settings/models/weekoff-setting.model";

const GenericWeeklyOffStore = createGenericStore<WeekdaysOff>();

@UntilDestroy()
@Injectable({ providedIn: 'root' })
export class WeeklyOffLookupStore {
  private store = inject(GenericWeeklyOffStore);

  readonly list = this.store.list;
  readonly isLoading = this.store.isLoading;
  readonly error = this.store.error;
  readonly isSuccess = this.store.isSuccess;

  loadWeeklyOffs = (): void => {
    this.store.getWithResult({ endpoint: API.ADMIN.CONFIGURATION.GENERAL_SETTINGS.WEEKLY_OFF_CONFIG.GET })
      .pipe(untilDestroyed(this)).subscribe();
  }

  setWeeklyOffsData = (data: WeekdaysOff[]): void => {
    patchState(this.store as any, {
      list: data ?? [],
      isLoading: false,
      isSuccess: true,
      error: null
    });
  }

  resetState(): void {
    this.store.resetState();
  }

  constructor() {
    const authStore = inject(AuthStore);
    effect(() => {
      const isLoggedIn = authStore.isLoggedIn();

      untracked(() => {
        if (isLoggedIn) {
          if (!this.isSuccess() && !this.isLoading()) {
            this.loadWeeklyOffs();
          }
        } else {
          this.resetState();
        }
      });
    });
  }
}
