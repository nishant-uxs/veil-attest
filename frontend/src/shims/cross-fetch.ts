const fetchFn = globalThis.fetch.bind(globalThis);
export default fetchFn;
export { fetchFn as fetch };
export const Headers = globalThis.Headers;
export const Request = globalThis.Request;
export const Response = globalThis.Response;
