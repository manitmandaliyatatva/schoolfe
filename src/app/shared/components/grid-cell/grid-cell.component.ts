import { Component, input } from '@angular/core';
import { SharedModule } from '../../../core/modules/shared.module';
import { ListDisplayType } from '../../Enums/table.enum';
import { ListColumnConfig } from '../../models/table.model';
import { SYSTEM_CONST } from '../../../core/constants/system.constant';
import { CurrencyFormatPipe } from '../../pipes/currency-format.pipe';
import { PercentageFormatPipe } from '../../pipes/percentage-format.pipe';

@Component({
  selector: 'app-grid-cell',
  standalone: true,
  templateUrl: './grid-cell.component.html',
  imports: [SharedModule, CurrencyFormatPipe, PercentageFormatPipe],
})
export class GridCellComponent {
  type = input<ListDisplayType>(ListDisplayType.Default);
  value = input<any>('-');
  config = input<ListColumnConfig | undefined>();

  ListDisplayType = ListDisplayType;
  protected readonly SYSTEM_CONST = SYSTEM_CONST;

  getBadge() {
    const cfg = this.config();
    const val = this.value();

    return cfg?.badgeConfig?.mappings?.find((m) => m.value === String(val));
  }

  getTextColor(bgColor: string): string {
    if (!bgColor) return '#000';

    const color = bgColor.replace('#', '');

    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);

    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    return brightness > 150 ? '#000' : '#fff';
  }
}
