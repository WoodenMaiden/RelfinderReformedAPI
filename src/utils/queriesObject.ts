export default interface QueriesObject {
    [key: string]: any,
    generate: (obj: JSON) => string;
}