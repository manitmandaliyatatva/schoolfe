import { ITextValueOption } from "../models/common.model";

export const UserTypeConst = {
    Admin: "dc119b92-5265-4b02-9bb1-5bce8be213bf",
    Teacher: "3ffd971e-544d-44bd-a454-34547083e543",
    Student: "cd89f1bf-fdf9-433b-aa38-6562b8b96179",
    Parent: "131e8ac5-124f-4e42-a658-984e82b36edc",
    SuperAdmin: "92fbc2c4-b9fd-413a-8b53-6ac7074645b8"
};


export interface UserType {
    userTypeId: number,
    userTypeName: string
}
export const compareUserType = (userTypeId: string, role: string) => userTypeId.toLowerCase() == UserTypeConst[role];

export const getUserType = (userTypeId: string) =>
    UserTypeOptions.find(option => option.value === userTypeId.toLowerCase())?.text || '-';

export const UserTypeOptions: ITextValueOption[] = Object.entries(UserTypeConst).map(([key, value]) => ({
    value: value,
    text: key,
}));