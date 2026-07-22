import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DynamicFormComponent } from '../dynamic-form/dynamic-form.component';
import { ButtonComponent } from '../button/button.component';
import { CommonButtonConfig } from '../button/model/button.model';
import { DynamicForm } from '../dynamic-form/model/dynamic-form.model';
import { SYSTEM_CONST } from '../../../core/constants/system.constant';

@Component({
  selector: 'app-filter-drawer',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    ReactiveFormsModule,
    DynamicFormComponent,
    ButtonComponent
  ],
  templateUrl: './filter-drawer.component.html',
  styleUrl: './filter-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterDrawerComponent {
  protected readonly SYSTEM_CONST = SYSTEM_CONST;

  @Input() isOpen = false;
  @Input() title = SYSTEM_CONST.ACTION_BUTTONS.FILTER;
  @Input() form!: FormGroup;
  @Input() config!: DynamicForm;
  
  @Input() resetBtnConfig!: CommonButtonConfig;
  @Input() applyBtnConfig!: CommonButtonConfig;

  @Output() close = new EventEmitter<void>();
}
