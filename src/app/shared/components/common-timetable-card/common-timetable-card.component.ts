import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import CommonHelper from '../../../core/helpers/common-helper';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormatTimeTo12Hour } from '../../../core/helpers/datetime.helper';
import { TimetableCardData } from './model/common-timetable-card.model';
import { CommonButtonConfig } from '../button/model/button.model';
import { getButtonConfig } from '../../functions/config-function';
import { ButtonComponent } from '../button/button.component';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'common-timetable-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './common-timetable-card.component.html',
  styleUrl: './common-timetable-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommonTimetableCardComponent {
  readonly data = input<TimetableCardData | null>(null);
  readonly variantIndex = input<number>(0);
  readonly canEdit = input<boolean>(false);
  readonly canDelete = input<boolean>(false);
  readonly canAdd = input<boolean>(false);

  readonly editClicked = output<TimetableCardData>();
  readonly deleteClicked = output<TimetableCardData>();
  readonly addClicked = output<TimetableCardData>();

  readonly headerClass = computed(() => {
    if (this.isHolidayCard()) return 'holiday';
    if (this.isNoScheduleCard()) return 'noschedule';
    if (this.isBreakCard()) return 'break';
    const palette = ['orange', 'blue', 'green', 'red', 'teal', 'amber'];
    return palette[this.variantIndex() % palette.length];
  });

  readonly title = computed(() => {
    if (this.isHolidayCard()) return 'Holiday';
    if (this.isNoScheduleCard()) return 'No Schedule';
    if (this.isBreakCard()) return 'Break';
    if (this.data()?.displayTitle) return this.data()?.displayTitle;
    return `${this.data()?.classSectionName ?? '-'}`;
  });

  readonly timeRange = computed(() => {
    const row = this.data();
    if (!row?.startTime || !row?.endTime) return '-';
    return `${FormatTimeTo12Hour(row.startTime)} - ${FormatTimeTo12Hour(row.endTime)}`;
  });

  readonly roomNo = computed(() => {
    const roomNumber = this.data()?.roomNo;
    return roomNumber === null || roomNumber === undefined ? '-' : String(roomNumber);
  });

  tooltipContent = computed(() => {
    const title = this.title();
    const subject = this.data()?.subjectName;
    const time = this.timeRange(); // adjust to your actual time field

    return [title, subject, time].filter(Boolean).join('\n');
  });

  onEditClick = (): void => {
    const row = this.data();
    if (!row) return;
    this.editClicked.emit(row);
  }

  onDeleteClick = (): void => {
    const row = this.data();
    if (!row) return;
    this.deleteClicked.emit(row);
  }

  onAddClick = (): void => {
    const row = this.data();
    if (!row) return;
    this.addClicked.emit(row);
  }

  isBreakCard = (): boolean => !!this.data()?.isBreak;
  isHolidayCard = (): boolean => !!this.data()?.isHoliday;
  isNoScheduleCard = (): boolean => !!this.data()?.isNoSchedule;
  readonly isSpecialCard = computed(() => this.isHolidayCard() || this.isNoScheduleCard());
  readonly showActions = computed(() =>
    !this.isSpecialCard() && (this.canEdit() || this.canDelete()) && !CommonHelper.isEmpty(this.data()?.timeTableId)
  );
  readonly showAddAction = computed(() =>
    this.isNoScheduleCard() && this.canAdd()
  );

  readonly getEditIcon = signal<CommonButtonConfig>(getButtonConfig(() => this.onEditClick(), 'icon', 'primary', '', null, null, 'edit', null, null, null, ['timetable-card__edit-btn']));
  readonly getDeleteIcon = signal<CommonButtonConfig>(getButtonConfig(() => this.onDeleteClick(), 'icon', 'primary', '', null, null, 'delete', null, null, null, ['timetable-card__edit-btn']));

}
