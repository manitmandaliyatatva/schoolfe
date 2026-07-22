export interface ExistedType {
  email: string;
  existedUserTypes: string[];
}

export interface EmailConfirmation {
  isEmailExists?: boolean;
  isConfirmed?: boolean;
  existedTypesList?: ExistedType[];
}

export interface BaseSaveResponse extends EmailConfirmation {
  data: string;
}

export const EMAIL_VALIDATION_CONST = {
  DIALOG_TITLE: 'Email Already Exists',
  DIALOG_MESSAGE_PREFIX: 'The following emails already exist:',
  DIALOG_MESSAGE_SUFFIX: 'Do you want to continue?',
};
