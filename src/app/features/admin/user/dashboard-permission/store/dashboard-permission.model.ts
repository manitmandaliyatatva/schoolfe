export interface DashboardPermissionDto {
    dashboardPermissionId: string;
    roleId: string;
    widgetConfiguration: string;
}

export interface SaveDashboardPermissionDto {
    roleId: string;
    widgetConfiguration: string;
}
