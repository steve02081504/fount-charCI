# fount-charCI

CI harness for fount chars. Local run: `fount-charCI <charDir|user/char> [CI-file]`.

## Together / chatReplyRequest

`src/fount.mjs` builds a minimal `chatReplyRequest` for `CI.runInput` / `CI.runOutput`. Keep it aligned with `src/decl/chatLog.ts` (`UserUid` / `CharUid`, `timelines`, `chat_summary`, extra `supported_functions`, chat_log `uid`). Use chat shell `BUILTIN_WORLD` / `BUILTIN_PERSONA` — never `world: null` / `user: null` (`buildPromptStruct` reads `*.interfaces`). Disable `P2P` in server `starts` — CI does not need the node stack.

`runInput` / `runOutput` only need `interfaces.chat` (not `interfaces.config`). Chars without config (e.g. rule-based bots) must still get these helpers.

## CI mock AI source

`default_data/.../serviceGenerators/AI/CI/main.mjs` `StructCall` must `Object.assign(base_result, …)` and honour `replyPreviewUpdater` (same contract as real generators). Import `prompt_struct/index.mjs` (directory module, not `prompt_struct.mjs`).
