import { MatFormFieldAppearance } from "@angular/material/form-field";
import { InputType } from '../../../Enums/common.enum'
import { ITextValueOption } from '../../../models/common.model'
import { FormControlBaseConfig } from "../../../models/form-control-base.model";

export interface CommonTextboxConfig extends FormControlBaseConfig {
    type?: InputType;
    prefixIcon?: TextBoxIconConfig;
    suffixIcon?: TextBoxIconConfig;
    placeholder?: string;
    hintText?: string;
    imgUrl?: TextBoxIconConfig;
    isSuffixImg?: boolean;
    isPrefixImg?: boolean;
    lableImg?: boolean;
    change?(event?: Event, rowId?: number): void;
    keyup?(event?: KeyboardEvent, rowId?: number): void;
    keypress?(event?: KeyboardEvent, rowId?: number): void;
    prefixIconList?: TextBoxIconConfig[];
    suffixIconList?: TextBoxIconConfig[];
    blur?(event?: FocusEvent, rowId?: number): void;
    appearance?: MatFormFieldAppearance;
    disableCallBack?(rowId?: number): boolean;
    isFloatLabel?: boolean;
    textSuffix?: string;
    value?: string | number;
    textSuffixSelect?: TextBoxSuffixSelectConfig,
    isDisable?: boolean,
    isPlusMinusVisible?: boolean,
    allowFloatValues?: boolean,
    maskingPattern?: string,
    textPrefix?: string,
    maxLength?: number
}

export interface TextBoxIconConfig {
    icon: string;
    click?(event?: any): void
}

export interface TextBoxSuffixSelectConfig {
    options: ITextValueOption[];
    selectedOption?: string;
    change?(event: any): void
}

export const DB_MAX_LENGTHS: Record<string, number> = {
    // Academic Year
    academicYearCode: 50,
    academicYearName: 100,
    // Attendance Status
    attendanceStatusCode: 20,
    attendanceStatusName: 50,
    // Branch
    branchCode: 50,
    branchName: 150,
    city: 100,
    country: 100,
    state: 100,
    // Carousel
    buttonLink: 500,
    buttonText: 100,
    // Class
    category: 50,
    classCode: 50,
    className: 100,
    classSectionName: 20,
    // Document Type
    documentTypeName: 200,
    // Event
    eventFileName: 200,
    eventFilePath: 500,
    eventTitle: 200,
    location: 200,
    eventTypeName: 100,
    // Exam
    examName: 150,
    examGroupName: 200,
    examTypeCode: 50,
    examTypeName: 100,
    // Facility / Holiday / Homework / Notice / News / Carousel
    title: 200,
    description: 500,
    // Fees
    transactionRef: 100,
    // Guardian / Student / Teacher / User
    firstName: 100,
    lastName: 100,
    middleName: 100,
    fullName: 250,
    email: 255,
    // Contact is managed by mask
    // phoneNumber: 50,
    // phoneNo: 200,
    admissionNumber: 20,
    currentAddress: 500,
    permanentAddress: 500,
    address: 500,
    bloodGroup: 10,
    bankAccountNumber: 50,
    bankName: 150,
    ifsccode: 20,
    ifscCode: 20,
    nationalIdentificationNumber: 50,
    previousSchoolAddress: 500,
    previousSchoolName: 200,
    teacherCode: 50,
    workLocation: 100,
    qualification: 50,
    institutionName: 100,
    universityName: 100,
    passingYear: 4,
    // other common / specific fields
    remarks: 255,
    remark: 500,
    subjectCode: 50,
    subjectName: 100,
    sectionCode: 50,
    sectionName: 100,
    settingKey: 100,
    settingLabel: 200,
    groupCode: 50,
    groupName: 100,
    reason: 500,
    pincode: 10,
    addressLine1: 500,
    addressLine2: 500,
    officialEmail: 50,
};

export function getLengthByContext(url: string, controlName: string): number | null {
    const lowercaseUrl = url.toLowerCase();

    if (controlName === 'title') {
        if (lowercaseUrl.includes('/facility')) return 100;
        if (lowercaseUrl.includes('/news-announcement') || lowercaseUrl.includes('/news')) return 100;
        if (lowercaseUrl.includes('/holiday')) return 200;
        if (lowercaseUrl.includes('/homework')) return 200;
        if (lowercaseUrl.includes('/notice')) return 200;
        if (lowercaseUrl.includes('/carousel')) return 200;
    }

    if (controlName === 'email') {
        if (lowercaseUrl.includes('/branch')) return 100;
        if (lowercaseUrl.includes('/user')) return 150;
        if (lowercaseUrl.includes('/contact')) return 250;
        if (lowercaseUrl.includes('/guardian') || lowercaseUrl.includes('/student') || lowercaseUrl.includes('/teacher')) return 255;
    }

    if (controlName === 'phoneNumber') {
        // Handled by contact mask, no need to set max length
    }

    if (controlName === 'remarks' || controlName === 'remark') {
        if (lowercaseUrl.includes('/homework')) return 500;
        return 255;
    }

    if (controlName === 'name') {
        if (lowercaseUrl.includes('/holiday')) return 200;
        if (lowercaseUrl.includes('/fee-type') || lowercaseUrl.includes('/fee')) return 100;
        if (lowercaseUrl.includes('/notice-audience') || lowercaseUrl.includes('/notice')) return 100;
        if (lowercaseUrl.includes('/time-slot') || lowercaseUrl.includes('/timetable')) return 100;
        if (lowercaseUrl.includes('/lookup')) return 50;
        if (lowercaseUrl.includes('/testimonial')) return 150;
    }

    if (controlName === 'city' || controlName === 'state' || controlName === 'country') {
        if (lowercaseUrl.includes('/branch')) return 100;
        if (lowercaseUrl.includes('/meta-information') || lowercaseUrl.includes('/school-meta')) return 500;
    }

    return null;
}