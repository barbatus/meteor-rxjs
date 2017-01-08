import { Observable } from 'rxjs';
export declare function select<T, U>(field: string): Observable<U>;
export interface SelectSignature<T> {
    (field: string): Observable<T>;
}
declare module 'rxjs/Observable' {
    interface Observable<T> {
        select: SelectSignature<T>;
    }
}
