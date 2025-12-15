# Copilot / AI Agent Instructions — effortlesshrmapp

Purpose: help an AI coding agent be productive quickly in this React Native (Expo) TypeScript codebase.

Quick setup
- Install dependencies: `npm install` (project uses Expo and TypeScript).
- Start dev server: `npm start` (alias for `expo start`). Use `npm run android` / `npm run ios` / `npm run web` to open specific targets.
- Debugging: the repo includes `react-native-debugger`; run Expo with remote JS debugging when needed.

Big-picture architecture
- Expo React Native app (root App.tsx). Navigation lives under `src/navigation` (AppNavigator, AuthNavigator, MainNavigator).
- UI: reusable components in `src/components/common` (e.g. `Card`, `Button`, `Input`, `Loading`) and modal components under `src/components/modals`.
- Screens are domain-organized under `src/screens/*` (e.g. `dashboard`, `attendance`, `tasks`, `interview`). Inspect `src/screens/dashboard/AdminDashboardScreen.tsx` for common patterns (service calls, local loading state, and format helpers).
- State: Redux Toolkit slices under `src/store/slices`, wired in `src/store/index.ts`. Use typed hooks from `src/store/hooks.ts` (`useAppDispatch`, `useAppSelector`).
- Services/API: HTTP and business logic live in `src/services/*` and central `src/services/api.ts` (axios). Service functions follow the `resourceService.method(...)` pattern (e.g. `dashboardService.getHoursWorked(userId, date)`).
- Types and theme: `src/types/index.ts` for shared TypeScript types and `src/theme/index.ts` for design tokens.

Common patterns & conventions
- Async flows: screens call service methods (async) and set local `loading` state; they then update local state or dispatch slice actions. Example: `loadDashboardData()` in `AdminDashboardScreen.tsx` uses `Promise.all([...])` to parallelize requests.
- Dates: Services expect ISO `YYYY-MM-DD` strings (see `selectedDate.toISOString().split('T')[0]` in `AdminDashboardScreen.tsx`). Keep date normalization before sending to services.
- Time formatting: helpers like `formatTime`, `formatHoursAndMinutes`, `formatMinutesToHoursAndMinutes` live inline in screens — reuse them or move to `src/utils` if needed.
- Dropdowns & charts: UI uses `react-native-element-dropdown` and `react-native-chart-kit` — follow existing prop patterns (data mapping to `label/value`, PieChart `accessor='population'`).
- Project-level lists: screens typically map arrays from services to UI; guard against empty arrays and show empty state components (see `emptyState` usage in `AdminDashboardScreen.tsx`).

Editing tips
- When adding new API calls, add a function in `src/services/*Service.ts` and keep naming consistent (`getX`, `createX`, `updateX`, `deleteX`). Update relevant slice under `src/store/slices` if store-managed.
- When adding state to Redux, add a new slice file under `src/store/slices`, export actions/selectors, and register the reducer in `src/store/index.ts`.
- Use `useAppDispatch()` / `useAppSelector()` (typed) rather than raw `useDispatch`/`useSelector`.

Files to inspect first (rapid orientation)
- App entry: `App.tsx`
- Navigation root: `src/navigation/AppNavigator.tsx`
- Example screen and patterns: `src/screens/dashboard/AdminDashboardScreen.tsx`
- Services & API: `src/services/api.ts`, `src/services/dashboardService.ts`
- Store wiring: `src/store/index.ts`, typed hooks `src/store/hooks.ts`, slices in `src/store/slices`
- Shared types: `src/types/index.ts`
- Theme & tokens: `src/theme/index.ts`

Build & runtime notes
- Uses Expo (see `package.json` scripts). Use `expo doctor` if native issues occur.
- Native modules in `package.json` (DateTimePicker, Picker, ImagePicker, SecureStore). When adding native-only packages, prefer the Expo-compatible variant or eject only when necessary.

What the AI should *not* assume
- There is no explicit test harness or CI config in repo root; do not add test scaffolding without asking.
- Do not change global TypeScript or Expo SDK versions without discussion.

If you change state or API shapes
- Update `src/types/index.ts` first, then services and consuming screens/slices.

Feedback request
If anything above is unclear or you want more detail (example PRs, slice templates, or a small code change), tell me which area and I will expand.
