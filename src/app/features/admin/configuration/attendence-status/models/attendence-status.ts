import { IPaginationRequest } from "../../../../../core/models/request.model";
import { createGenericStore } from "../../../../../core/store/resource.store"

export interface IAttendenceStatus {
    attendanceStatusId: string
    attendanceStatusName: string
    attendanceStatusCode: string
    isActive: boolean
    isDeleted: boolean
    colorCode : string;
    backgroundColorCode : string;
}

export interface IAttendanceStatusListRequest extends IPaginationRequest {
    isFromAttendanceStatus?: boolean;
}

export const attendenceStatusStore = createGenericStore<IAttendenceStatus>();

export const ATTENDENCE_STATUS = {
    NAME: 'Attendance Status Name',
    CODE : 'Attendance Status Code',
    ISDELETE: 'IsDelete',
    STATUSDISPLAY : 'Status Display'
}