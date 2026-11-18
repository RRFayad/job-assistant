// API contract shared by the backend and the frontend: one file per feature.
// The backend attaches the schemas to routes (request/response validation and
// Swagger docs); the frontend uses the inferred types. Add a line per new
// feature.
export * from "./common.schema";
export * from "./profile.schema";
