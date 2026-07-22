export interface ITextValueOption {
    text: string;
    value: commonType;
    groupId?: string | number;
    hidden?: boolean;
    isFixed?: boolean;
    toolTipText?: string;
    additinalValue?:string;
    mnemonic?: string;
}
export type commonType = number | string | boolean;