/// <reference types="zone.js" />
import { Observable } from 'rxjs';
export declare function forkRxJsZone(): {
    name: string;
    parent: any;
    run(func: Function): any;
    fork(spec: any): any;
    get(key: string): any;
};
export declare function zone<T>(zone?: Zone): Observable<T>;
export interface ZoneSignature<T> {
    (zone?: Zone): Observable<T>;
}
declare module 'rxjs/Observable' {
    interface Observable<T> {
        zone: ZoneSignature<T>;
    }
}
