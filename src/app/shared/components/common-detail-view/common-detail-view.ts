import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusChipComponent } from '../status-chip/status-chip.component';
import { CommonDateFormat } from '../../../core/constants/date-format.constant';
import { DetailViewField } from './model/common-detail-view.model';

@Component({
  selector: 'app-common-detail-view',
  standalone: true,
  imports: [CommonModule, StatusChipComponent],
  templateUrl: './common-detail-view.html',
  styleUrl: './common-detail-view.scss'
})
export class CommonDetailViewComponent {
  data = input<any>(null);
  fields = input<DetailViewField[]>([]);

  protected readonly defaultDateFormat = CommonDateFormat.DDMMYYYY_WithSlash;
}
