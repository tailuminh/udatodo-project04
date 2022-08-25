export interface KeyItem {
    alg: string,
    kty: string,
    n: string,
    e: string,
    kid: string,
    x5t: string,
    x5c: Array<string>
}