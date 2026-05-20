# Implementation Plan - App Language & AI Localization Support

Add multi-language selection support (English and French) to the NutriTwins application. The user will be able to select their preferred language inside the Profile page, which will translate key sections of the app interface and instruct the AI (both recipe suggestions and food analysis) to respond in that specific language.

## User Review Required

> [!IMPORTANT]
> The chosen language setting is persisted locally in the client's `localStorage` and sent with every API request via a custom HTTP header `x-app-language`. This avoids changing backend route schema signatures or database properties, ensuring a clean and backward-compatible integration.

## Proposed Changes

---

### Component: Frontend UI & Internationalization

#### [NEW] [i18n.ts](file:///c:/Users/suzoe/Documents/Github/nutritwins-frontend/src/lib/i18n.ts)
* Add a simple internationalization helper function `t(key, defaultVal)` and a dictionary with translations for English (`en`) and French (`fr`).

#### [MODIFY] [api.ts](file:///c:/Users/suzoe/Documents/Github/nutritwins-frontend/src/lib/api.ts)
* Update `apiFetch` default headers to dynamically include the header `"x-app-language"` pointing to the current stored language value.

#### [MODIFY] [Navbar.tsx](file:///c:/Users/suzoe/Documents/Github/nutritwins-frontend/src/components/Navbar.tsx)
* Translate the navigation links using the `t()` helper.

#### [MODIFY] [DashboardPage.tsx](file:///c:/Users/suzoe/Documents/Github/nutritwins-frontend/src/pages/DashboardPage.tsx)
* Translate greetings, calorie labels, macronutrient labels, and feed titles.

#### [MODIFY] [LogFoodPage.tsx](file:///c:/Users/suzoe/Documents/Github/nutritwins-frontend/src/pages/LogFoodPage.tsx)
* Translate scan card actions, upload buttons, inputs, and analysis loader text.

#### [MODIFY] [ProfilePage.tsx](file:///c:/Users/suzoe/Documents/Github/nutritwins-frontend/src/pages/ProfilePage.tsx)
* Add a **Language Selector Card** at the bottom of the profile settings. Switching the language will save to local storage and trigger a page refresh. Translate profile titles and button labels.

---

### Component: Backend API & AI Services

#### [MODIFY] [food-entry.routes.ts](file:///C:/Users/suzoe/Documents/Github/nutritwins-backend/src/modules/food-entry/food-entry.routes.ts)
* Extract the `"x-app-language"` request header and pass it as the `language` parameter to `FoodEntryService.analyzeFood`.

#### [MODIFY] [food-entry.service.ts](file:///C:/Users/suzoe/Documents/Github/nutritwins-backend/src/modules/food-entry/food-entry.service.ts)
* Accept `language` in `analyzeFood`. Map it to a language name (e.g. French, English) and inject it into the AI vision prompt to ensure all generated JSON text fields are written in the requested language. Translate static service errors accordingly.

#### [MODIFY] [recipes.routes.ts](file:///C:/Users/suzoe/Documents/Github/nutritwins-backend/src/modules/recipes/recipes.routes.ts)
* Extract the `"x-app-language"` request header and pass it to `RecipesService.getSuggestions`.

#### [MODIFY] [recipes.service.ts](file:///C:/Users/suzoe/Documents/Github/nutritwins-backend/src/modules/recipes/recipes.service.ts)
* Accept `language` in `getSuggestions`. Map it to a language name and inject it into the recipe prompt to dictate the output language for instructions, titles, ingredients, and warning fields.

---

## Verification Plan

### Automated Tests
* Run `npm run build` on both **nutritwins-frontend** and **nutritwins-backend** to guarantee type safety and successful compilation.

### Manual Verification
1. Open the Profile page.
2. Select **Français** from the language settings.
3. Verify that the UI titles and headers translate immediately.
4. Go to **Recettes** and verify that recommended recipes are in French.
5. Upload/Scan a food image or describe a meal in French and verify that the AI analysis outputs are generated in French.
6. Switch back to **English** and verify that all suggestions revert back.
