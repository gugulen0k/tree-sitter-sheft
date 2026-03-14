; ── Scopes ────────────────────────────────────────────────────────────────────

[
  (func_definition)
  (struct_definition)
  (if_statement)
  (while_statement)
  (for_statement)
  (match_expression)
] @local.scope

; ── Definitions ───────────────────────────────────────────────────────────────

(variable_declaration
  name: (identifier) @local.definition.var)

(param
  name: (identifier) @local.definition.parameter)

(for_statement
  variable: (identifier) @local.definition.var)

(match_pattern
  binding: (identifier) @local.definition.var)

(func_definition
  name: (func_name (identifier) @local.definition.function))

(struct_definition
  name: (identifier) @local.definition.type)

(enum_definition
  name: (identifier) @local.definition.type)

(error_definition
  name: (identifier) @local.definition.type)

; ── References ────────────────────────────────────────────────────────────────

(identifier) @local.reference
