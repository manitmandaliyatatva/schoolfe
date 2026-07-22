export interface StatusChipConfig {
  /**
   * Function that returns a boolean to evaluate for active/inactive state.
   */
  value: () => boolean;

  /**
   * Label shown when status is active. Defaults to 'Active'.
   */
  activeText?: string;

  /**
   * Label shown when status is inactive. Defaults to 'Inactive'.
   */
  inactiveText?: string;

  /**
   * Function that returns a boolean to control chip visibility.
   */
  isHidden?: () => boolean;
}
