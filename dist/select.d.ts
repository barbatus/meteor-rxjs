import { Observable } from 'rxjs';
export declare function select<T, U>(this: Observable<T>, field: string): Observable<U>;
declare module 'rxjs/Observable' {
    interface Observable<T> {
        select<T, U>(this: Observable<T>, field: string): Observable<U>;
    }
}
