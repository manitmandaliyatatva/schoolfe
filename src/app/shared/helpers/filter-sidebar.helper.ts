import { computed, signal, Signal, WritableSignal } from '@angular/core';
import { SYSTEM_CONST } from '../../core/constants/system.constant';
import { CommonButtonConfig } from '../components/button/model/button.model';
import { buildGridToolbarButton } from './grid.helper';

export interface FilterSidebarController {
  readonly isOpen: WritableSignal<boolean>;
  readonly toggleButtonConfig: Signal<CommonButtonConfig>;
  readonly resetButtonConfig: Signal<CommonButtonConfig>;
  readonly applyButtonConfig: Signal<CommonButtonConfig>;
  toggle(): void;
  open(): void;
  close(): void;
  apply(): void;
  reset(): void;
}

interface CreateFilterSidebarControllerOptions {
  onApply: () => void;
  onReset?: () => void;
  isApplyDisabled?: () => boolean;
}

export const createFilterSidebarController = (
  options: CreateFilterSidebarControllerOptions
): FilterSidebarController => {
  const isOpen = signal(false);

  const close = (): void => {
    isOpen.set(false);
  };

  const toggle = (): void => {
    isOpen.update((value) => !value);
  };

  const apply = (): void => {
    close();
    options.onApply();
  };

  const reset = (): void => {
    options.onReset?.();
    close();
    options.onApply();
  };

  return {
    isOpen,
    toggleButtonConfig: computed<CommonButtonConfig>(() => buildGridToolbarButton({
      icon: 'filter_alt',
      tooltipText: SYSTEM_CONST.ACTION_BUTTONS.FILTER,
      callback: () => toggle(),
      isPrimary: true,
    })),
    resetButtonConfig: computed<CommonButtonConfig>(() => ({
      variant: 'stroked',
      color: 'primary',
      buttonText: SYSTEM_CONST.ACTION_BUTTONS.RESET,
      callback: () => reset(),
    })),
    applyButtonConfig: computed<CommonButtonConfig>(() => ({
      variant: 'flat',
      color: 'primary',
      buttonText: SYSTEM_CONST.ACTION_BUTTONS.APPLY,
      disableCallBack: options.isApplyDisabled,
      callback: () => apply(),
    })),
    toggle,
    open: () => isOpen.set(true),
    close,
    apply,
    reset,
  };
};
