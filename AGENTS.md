# Repository Guidelines

## Project Structure & Module Organization
- `miniprogram/` is the WeChat Mini Program source root.
  - `app.ts`, `app.json`, `app.wxss` define app logic, config, and global styles.
  - `pages/` contains feature pages (e.g., `pages/index`, `pages/order-form`). Each page folder follows the `.ts` + `.wxml` + `.wxss` + `.json` pattern.
  - `utils/` holds shared helpers.
  - `miniprogram_npm/` is generated output from npm build in WeChat DevTools; avoid manual edits.
- `prototype/` contains static HTML prototypes used for UI reference only.
- Root config: `project.config.json`, `project.private.config.json`, `tsconfig.json`, and `typings/`.

## Build, Test, and Development Commands
- `npm install` installs dependencies (TDesign Mini Program + typings).
- WeChat DevTools: open the repository root and run/preview the app.
- DevTools → Tools → Build npm: generates `miniprogram/miniprogram_npm` for runtime.
- No automated test scripts are configured in `package.json`.

## Coding Style & Naming Conventions
- Languages: TypeScript (`.ts`), WXML templates, WXSS styles, JSON config.
- Indentation: 2 spaces; keep files semicolon-free to match existing style.
- Prefer single quotes in `.ts` unless a key requires quotes (e.g., `"userInfo.nickName"`).
- Page folders are kebab-case (e.g., `order-detail`, `pay-success`).

## Testing Guidelines
- There is no test framework or test directory in the current repo.
- When changing behavior, document manual verification steps in the PR (e.g., “opened `pages/order-form`, submitted, reached `pages/pay-success`”).

## Commit & Pull Request Guidelines
- Git history uses short, single-line messages (e.g., `初始化`). Keep commits concise and descriptive.
- PRs should include: scope summary, manual test steps, and screenshots for UI changes.
- Avoid committing changes to `project.private.config.json` unless explicitly required.

## Security & Configuration Tips
- Do not hardcode secrets or API keys in `.ts` or `.json`.
- Treat `project.private.config.json` as developer-local config; keep project-wide settings in `project.config.json`.
