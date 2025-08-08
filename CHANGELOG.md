# Changelog

All notable changes and fixes to this project will be documented in this file.

## [Unreleased]

### Fixed
- Fixed Drizzle/Neon errors by aligning all API and schema field names to match the actual database (snake_case).
- Removed all references to `characters.candles`; now candles are only associated with users.
- Updated all API endpoints to use correct join/select field names for Drizzle ORM.
- Fixed session property mismatch (`user_id` vs `userId`) to ensure authentication works.
- Updated frontend fetch calls to always include credentials for session cookies.
- Fixed route parsing in `api/characters.js` to correctly extract character ID and action, preventing invalid UUID errors.
- Added `.env` variables to enable Drizzle and Neon debug output.
- Ensured all API handlers parse `req.body` for POST/PUT/PATCH requests in serverless environments.
- Cleaned up redundant exports and imports in schema and db files.

### Added
- This `CHANGELOG.md` file to track fixes and major changes.

---

> For each new fix or feature, add a summary here with the date and a short description.
