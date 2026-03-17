/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as bracket from "../bracket.js";
import type * as init from "../init.js";
import type * as leaderboard from "../leaderboard.js";
import type * as prompts from "../prompts.js";
import type * as seedHelpers from "../seedHelpers.js";
import type * as simulate from "../simulate.js";
import type * as tts from "../tts.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  bracket: typeof bracket;
  init: typeof init;
  leaderboard: typeof leaderboard;
  prompts: typeof prompts;
  seedHelpers: typeof seedHelpers;
  simulate: typeof simulate;
  tts: typeof tts;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
