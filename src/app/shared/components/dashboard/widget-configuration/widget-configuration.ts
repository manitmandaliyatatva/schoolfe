import { ChangeDetectionStrategy, Component, inject, OnInit, signal, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { WidgetService } from '../../../../core/services/widget.service';
import { AuthStore } from '../../../../core/store/auth.store';
import { ButtonComponent } from '../../button/button.component';
import { CommonButtonConfig } from '../../button/model/button.model';
import { getButtonConfig } from '../../../functions/config-function';
import { GenericDialog } from '../../generic-dialog/generic-dialog';
import { AdminDashboardWidgets, StudentDashboardWidgets, TeacherDashboardWidgets, WidgetConfigItem, WIDGET_CONFIG_CONST } from './model/widget-configuration.model';
import { SYSTEM_CONST } from '../../../../core/constants/system.constant';

@Component({
  selector: 'app-widget-configuration',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, ButtonComponent],
  templateUrl: './widget-configuration.html',
  styleUrl: './widget-configuration.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetConfiguration implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<GenericDialog, boolean>);
  private readonly authStore = inject(AuthStore);
  private readonly widgetService = inject(WidgetService);

  readonly WIDGET_CONFIG_CONST = WIDGET_CONFIG_CONST;
  widgets: WidgetConfigItem[] = [];
  draftStates = signal<Record<string, boolean>>({});

  saveBtn = signal<CommonButtonConfig>(
    getButtonConfig(() => this.submit(), 'flat', 'primary', SYSTEM_CONST.ACTION_BUTTONS.SAVE, true)
  );

  cancelBtn = signal<CommonButtonConfig>(
    getButtonConfig(() => this.onCancel(), 'stroked', 'basic', SYSTEM_CONST.ACTION_BUTTONS.CANCEL, false)
  );

  constructor() {
    effect(() => {
      const visibility = this.widgetService.visibility();
      const globalVisibility = this.widgetService.globalVisibility();
      if (visibility) {
        untracked(() => {
          this.widgets = this.getWidgetsForRole();
          this.initializeDraftStates();
        });
      }
    });
  }

  ngOnInit(): void {
    this.widgetService.loadWidgetSettings();
    this.widgets = this.getWidgetsForRole();
    this.initializeDraftStates();
  }

  private initializeDraftStates = (): void => {
    const initialDraft: Record<string, boolean> = {};
    for (const widget of this.widgets) {
      initialDraft[widget.key] = this.widgetService.getWidgetState(widget.key);
    }
    this.draftStates.set(initialDraft);
  }

  getWidgetsForRole = (): WidgetConfigItem[] => {
    let allWidgets: WidgetConfigItem[] = [];
    if (this.authStore.isAdmin()) {
      allWidgets = AdminDashboardWidgets;
    } else if (this.authStore.isTeacher()) {
      allWidgets = TeacherDashboardWidgets;
    } else if (this.authStore.isStudent()) {
      allWidgets = StudentDashboardWidgets;
    }

    const globalVisibility = this.widgetService.globalVisibility();
    if (globalVisibility) {
      return allWidgets.filter(w => globalVisibility[w.key as keyof typeof globalVisibility] !== false);
    }
    return allWidgets;
  }

  toggleWidget = (key: string): void => {
    this.draftStates.update(states => ({
      ...states,
      [key]: !states[key]
    }));
  }

  submit = (): void => {
    this.widgetService.updateMultipleWidgets(this.draftStates());
    this.dialogRef.close(true);
  }

  onCancel = (): void => {
    this.dialogRef.close(false);
  }
}
