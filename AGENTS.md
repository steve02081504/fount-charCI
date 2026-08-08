# fount-charCI

CI harness for fount chars. Local run: `fount-charCI <charDir|user/char> [CI-file]`.

## Together / chatReplyRequest

`src/fount.mjs` builds a minimal `chatReplyRequest` for `CI.runInput` / `CI.runOutput`. Keep it aligned with `src/decl/chatLog.ts` (`UserUid` / `CharUid`, `timelines`, `chat_summary`, extra `supported_functions`, chat_log `uid`). Disable `P2P` in server `starts` — CI does not need the node stack.

`runInput` / `runOutput` only need `interfaces.chat` (not `interfaces.config`). Chars without config (e.g. rule-based bots) must still get these helpers.
