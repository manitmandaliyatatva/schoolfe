import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { IDecodedToken } from '../models/request.model';
import CommonHelper from '../helpers/common-helper';

@Injectable({ providedIn: 'root' })
export class TokenDecoderService {

    decode(token: string): IDecodedToken | null {
        try {
            return jwtDecode<IDecodedToken>(token);
        } catch (error) {
            console.error('Token decode failed:', error);
            return null;
        }
    }

    isExpired(token: string): boolean {
        const decoded = this.decode(token);
        if (!decoded?.exp) return true;
        // ✅ exp is in seconds
        return new Date() > new Date(decoded.exp * 1000);
    }

    extractUserInfo(token: string) {
        const decoded = this.decode(token);
        if (!decoded) return null;

        return {
            userId: decoded.identifier ?? null,
            entityid: decoded.entityid ?? null,
            email: decoded.email ?? null,
            name: decoded.name ?? null,
            usertype: decoded.usertype ?? null,
            expiryTime: decoded.exp
                ? new Date(decoded.exp * 1000).toISOString()
                : null,
        };
    }
}