// C-INJ-05: escape a JSON-LD payload before it is embedded in a
// <script type="application/ld+json"> element.
//
// `JSON.stringify` alone does not escape `</script>` and a few other
// characters that have HTML-script-context semantics. The OWASP
// cheat-sheet rule (and the canonical React/Next escape recipe) is to
// replace:
//   `<` -> \u003c   (closes a `<script>` tag)
//   `>` -> \u003e   (closes a CDATA-like `<script>` content in some parsers)
//   U+2028 line separator      -> \u2028 (legal in JSON, but JS parsers
//                                          treat it as a line terminator
//                                          inside a script body)
//   U+2029 paragraph separator -> \u2029 (same reason as U+2028)
//
// The result is still valid JSON, parses back to the same logical
// value, and is inert inside an HTML <script> block.
//
// This is the non-lossy replacement for the W2-08 stripScriptBreakers
// helper (which used `replace(/[<>]/g, '')` and silently dropped
// legitimate characters from product names like "A < B").
export function escapeJsonLdForScript(payload: string): string {
    if (typeof payload !== 'string' || payload.length === 0) return '';
    return payload
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029');
}
