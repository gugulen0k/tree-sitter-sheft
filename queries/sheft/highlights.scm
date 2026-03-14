; ── Keywords ──────────────────────────────────────────────────────────────────

[
  "import" "as"
  "pub"
  "func"
  "struct"
  "enum"
  "error"
  "mut"
  "return"
  "if" "else"
  "while"
  "for" "in"
  "match" "with" "end"
  "raise"
  "try" "catch"
  "reserve"
  "and" "or" "not"
] @keyword

; ── Literals ──────────────────────────────────────────────────────────────────

(bool_literal) @boolean
(nil_literal) @constant.builtin
(integer_literal) @number
(float_literal) @number.float

; ── Strings ───────────────────────────────────────────────────────────────────

(string_literal) @string
(multiline_string_literal) @string
(fstring_literal) @string
(fmultiline_string_literal) @string
(escape_sequence) @string.escape
(interpolation
  "{" @punctuation.special
  "}" @punctuation.special) @embedded

; ── Comments ──────────────────────────────────────────────────────────────────

(comment) @comment
(block_comment) @comment
(doc_comment) @comment.documentation

; ── Built-in types ────────────────────────────────────────────────────────────

(builtin_type) @type.builtin

; ── Type annotations ──────────────────────────────────────────────────────────

(variable_declaration
  type: (type) @type)

(param
  type: (type) @type)

(struct_field
  type: (type) @type)

(func_definition
  return_type: (type) @type)

(enum_variant
  type: (type) @type)

; ── Struct / enum / error definitions ────────────────────────────────────────

(struct_definition
  name: (identifier) @type)

(enum_definition
  name: (identifier) @type)

(error_definition
  name: (identifier) @type)

; ── Enum variant definitions ──────────────────────────────────────────────────

(enum_variant
  name: (identifier) @constant)

; ── Variable declarations ─────────────────────────────────────────────────────

(variable_declaration
  name: (identifier) @variable)

; ── Struct fields ─────────────────────────────────────────────────────────────

(struct_field
  name: (identifier) @variable.member)

(struct_field_init
  name: (identifier) @variable.member)

; ── Import paths ──────────────────────────────────────────────────────────────

(import_statement
  path: (import_path) @module)

(import_statement
  alias: (identifier) @module)

"::" @punctuation.delimiter

; ── Import items — import std::io::{ read_file!, Token } ──────────────────────

(import_item name: (identifier) @function)
(import_item suffix: "!" @function)
(import_item suffix: "?" @function)

; Type imports come last — override @function for capitalized names
(import_item
  name: (identifier) @type
  (#lua-match? @type "^[A-Z]"))

; ── Match ─────────────────────────────────────────────────────────────────────

(wildcard) @constant.builtin

(match_pattern
  "with" @keyword.special)

; ── Interpolation expressions ─────────────────────────────────────────────────

(interpolation (expression (identifier) @variable))
(interpolation (expression (binary_expression (expression (identifier) @variable))))

; ── Function definitions ──────────────────────────────────────────────────────

(func_definition
  name: (func_name (identifier) @function))

; ── Function calls ────────────────────────────────────────────────────────────

(call_expression
  function: (identifier) @function.call)

; ── Field access ──────────────────────────────────────────────────────────────

; Default: struct/module field access
(field_access
  field: (func_name (identifier) @variable.member))

(self_field_access
  "." @punctuation.delimiter
  field: (identifier) @variable.member)

; Lowercase object (e.g. `tokens` in `tokens.len()`) — highlight as @variable
; Needed so identifiers inside f-string interpolations don't inherit @string color.
(field_access
  object: (identifier) @variable
  (#lua-match? @variable "^[a-z_]"))

; Enum/error variant access: Type.Variant — capitalized object → @type
; Uses #lua-match? (nvim-treesitter Lua predicate). In the tree-sitter CLI,
; unknown predicates are treated as true so all field accesses match here,
; but the method call pattern below is LATER (higher priority) and overrides.

(field_access
  object: (identifier) @_obj
  field: (func_name (identifier) @type)
  (#lua-match? @_obj "^[A-Z]"))

; Method calls — overrides both patterns above (later = higher priority)

(call_expression
  function: (field_access
    field: (func_name (identifier) @function.method)))

; ── Operators ─────────────────────────────────────────────────────────────────

(binary_expression operator: "+" @operator)
(binary_expression operator: "-" @operator)
(binary_expression operator: "*" @operator)
(binary_expression operator: "/" @operator)
(binary_expression operator: "==" @operator)
(binary_expression operator: "!=" @operator)
(binary_expression operator: "<" @operator)
(binary_expression operator: "<=" @operator)
(binary_expression operator: ">" @operator)
(binary_expression operator: ">=" @operator)
(binary_expression operator: "and" @keyword.operator)
(binary_expression operator: "or" @keyword.operator)

(unary_expression operator: "not" @keyword.operator)
(unary_expression operator: "-" @operator)

"=>" @operator
"->" @operator
":" @punctuation.delimiter
"," @punctuation.delimiter
"." @punctuation.delimiter
".." @operator
"..=" @operator

; ── Punctuation ───────────────────────────────────────────────────────────────

"(" @punctuation.bracket
")" @punctuation.bracket
"[" @punctuation.bracket
"]" @punctuation.bracket
"{" @punctuation.bracket
"}" @punctuation.bracket

; ── Context-specific "?" and "!" ──────────────────────────────────────────────
; No bare "?" @operator — handle each context explicitly so suffix and type ?
; get the right color and function-name ? can be colored as @function.

; Ternary operator
(ternary_expression "?" @operator)

; Nilable type suffix — same color as the type
(type "?" @type)

; Call suffix !? — same color as the function call
(call_expression suffix: "!" @function.call)
(call_expression suffix: "?" @function.call)

; Function definition name suffix — same color as the function name
; Must come after call suffix rules so they apply to their own contexts.
(func_definition name: (func_name "!" @function))
(func_definition name: (func_name "?" @function))

; Enum variant constructor in match pattern — e.g. Shape.Circle(r)
; Must come before the keyword fallback below.
(match_pattern
  (expression
    (call_expression
      function: (field_access
        field: (func_name (identifier) @type)))))

; ── Keyword fallback (MUST BE LAST — highest priority) ────────────────────────
; During error recovery, tree-sitter may parse reserved keywords as (identifier)
; nodes instead of anonymous keyword nodes. This rule overrides any prior capture
; (e.g. @type, @variable) so keywords always render as @keyword.
((identifier) @keyword
  (#any-of? @keyword
    "end" "func" "struct" "enum" "error"
    "if" "else" "while" "for" "match"
    "return" "raise" "try" "catch"
    "import" "pub" "mut" "in" "with"
    "and" "or" "not" "nil" "true" "false"))
