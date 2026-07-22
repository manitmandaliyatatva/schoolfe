import { Component, computed, inject } from '@angular/core';
import { metaStore, IMetaInformation } from '../../admin/public-site/meta-information/models/meta-information.model';
import { PublicSettingStore } from '../../../core/store/public-setting.store';

@Component({
  selector: 'app-about',
  imports: [],
  templateUrl: './about.html',
  styleUrl: './about.scss',
})
export class About {

  public metaStore = inject(metaStore);
  public settingService = inject(PublicSettingStore);

  aboutUs = computed<IMetaInformation | null>(() => {
    return this.metaStore.list()?.[0] ?? null;
  });
}
