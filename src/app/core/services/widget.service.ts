import { inject, Injectable, signal, effect, untracked } from "@angular/core";
import { API } from "../../shared/constants/api-url";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import {
  GenericWidgetStore,
  WidgetConfig,
  DashboardWidgetsVisibility,
  defaultDashboardVisibility
} from "../../shared/components/dashboard/widget-configuration/model/widget-configuration.model";
import { AuthStore } from "../store/auth.store";

@UntilDestroy()
@Injectable({ providedIn: 'root' })
export class WidgetService {

  private store = inject(GenericWidgetStore);
  private authStore = inject(AuthStore);
  readonly visibility = signal<DashboardWidgetsVisibility | null>(null);
  readonly globalVisibility = signal<DashboardWidgetsVisibility | null>(null);
  private isLoaded = false;
  private isLoading = false;

  constructor() {
    effect(() => {
      const isLoggedIn = this.authStore.isLoggedIn();
      if (isLoggedIn) {
        untracked(() => this.loadWidgetSettings());
      } else {
        untracked(() => {
          this.visibility.set(null);
          this.globalVisibility.set(null);
          this.isLoaded = false;
        });
      }
    });
  }

  loadWidgetSettings = (force: boolean = false): void => {
    if ((this.isLoaded || this.isLoading) && !force) return;
    this.isLoading = true;
    this.store.getWithResult({ endpoint: API.WIDGET_CONFIG.GET })
      .pipe(untilDestroyed(this)).subscribe({
        next: () => {
          this.isLoaded = true;
          this.isLoading = false;
          this.updateVisibilitySignals();
        },
        error: () => {
          this.isLoaded = true;
          this.isLoading = false;
          this.updateVisibilitySignals();
        }
      });
  }

  getWidgetState = (key: string): boolean => {
    return this.visibility()?.[key as keyof DashboardWidgetsVisibility] ?? true;
  }

  private updateVisibilitySignals = (): void => {
    const configStr = this.store.data()?.dashboardConfig || '';
    const globalConfigStr = this.store.data()?.globalConfig || '';

    let settings: any = {};
    if (configStr) {
      try {
        settings = JSON.parse(configStr) ?? {};
      } catch (e) { }
    }

    let globalSettings: any = {};
    if (globalConfigStr) {
      try {
        globalSettings = JSON.parse(globalConfigStr) ?? {};
      } catch (e) { }
    }

    const getVal = (key: string, source: any): boolean => {
      if (source[key] !== undefined) {
        const val = source[key];
        return !(val === false || val === 'false' || val === 0 || val === '0');
      }
      return true; // Active by default
    };

    const mapVisibility = <T extends object>(defaultVal: T, source: any): T => {
      const result = {} as any;
      for (const key of Object.keys(defaultVal)) {
        result[key] = getVal(key, source);
      }
      return result as T;
    };

    this.visibility.set(mapVisibility(defaultDashboardVisibility, settings));
    this.globalVisibility.set(mapVisibility(defaultDashboardVisibility, globalSettings));

    // Wait for the next tick / DOM update to let charts adapt to changed grid classes
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 250);
  }

  private getSerializedConfig = (updates: Record<string, boolean> = {}): string => {
    const combined: Record<string, boolean> = {
      ...(this.visibility() || {}),
      ...updates
    };

    // Filter combined object to only keep keys that have false values
    const onlyFalse: Record<string, boolean> = {};
    for (const [key, val] of Object.entries(combined)) {
      if (val === false) {
        onlyFalse[key] = false;
      }
    }

    return JSON.stringify(onlyFalse);
  }

  updateWidgetVisibility = (key: string, isVisible: boolean): void => {
    const jsonStr = this.getSerializedConfig({ [key]: isVisible });
    const newConfig: WidgetConfig = { dashboardConfig: jsonStr };
    this.store.setData(newConfig);
    this.updateVisibilitySignals();

    this.store.create({
      endpoint: API.WIDGET_CONFIG.SAVE,
      body: newConfig as any
    });
  }

  updateMultipleWidgets = (updates: Record<string, boolean>): void => {
    const jsonStr = this.getSerializedConfig(updates);
    const newConfig: WidgetConfig = { dashboardConfig: jsonStr };
    this.store.setData(newConfig);
    this.updateVisibilitySignals();

    this.store.create({
      endpoint: API.WIDGET_CONFIG.SAVE,
      body: newConfig as any
    });
  }
}
