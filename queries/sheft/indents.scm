; ── Block constructs — increase indent for their body ─────────────────────────

[
  (func_definition)
  (struct_definition)
  (enum_definition)
  (error_definition)
  (if_statement)
  (while_statement)
  (for_statement)
  (match_expression)
  (catch_expression)
] @indent.begin

; ── `end` — return to outer indent level ──────────────────────────────────────

"end" @indent.end

; ── `else` — branch at the same level as `if` ────────────────────────────────

"else" @indent.branch
