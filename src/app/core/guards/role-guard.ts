import { ActivatedRouteSnapshot, CanActivateChildFn, Router } from "@angular/router";
import { AuthStore } from "../store/auth.store";
import { inject } from "@angular/core";
import { Role } from "../../features/auth/auth.model";

const ROUTE_ROLE_MAP: Record<string, Role> = {
    "admin": 'Admin',
    "student": 'Student',
    "teacher": 'Teacher',
    "superadmin" : 'Super Admin'
};

export const roleGuard: CanActivateChildFn = (route: ActivatedRouteSnapshot) => {
    const auth = inject(AuthStore);
    const router = inject(Router);

    const segments: string[] = [];
    let current: ActivatedRouteSnapshot | null = route;

    while (current) {
        current.url.forEach(u => segments.unshift(u.path));
        current = current.parent;
    }

    let roleSegment = segments.find(s => ROUTE_ROLE_MAP[s]);

    if (!roleSegment) {
        return true;
    }
    
    if(auth.isSuperAdmin()){
        roleSegment = 'superadmin'
    }

    const requiredRole = ROUTE_ROLE_MAP[roleSegment];
    const userRole = auth.usertype();

    if (userRole && userRole === requiredRole) {
        return true;
    }

    router.navigate(['/unauthorized']);
    return false;
};