/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: 'chalk',

  extras: $ => [
    /\s/,
    $.comment,
    $.block_comment,
    $.doc_comment,
  ],

  word: $ => $.identifier,

  conflicts: $ => [
    [$.return_statement],
    [$.raise_statement],
    [$.try_expression, $.index_access],
    [$.func_name],
    [$.map_type],
    [$.match_pattern, $.catch_expression],
  ],

  rules: {
    source_file: $ => repeat($._statement),

    // ── Statements ──────────────────────────────────────────────────────────

    _statement: $ => choice(
      $.import_statement,
      $.variable_declaration,
      $.assignment,
      $.func_definition,
      $.struct_definition,
      $.enum_definition,
      $.error_definition,
      $.if_statement,
      $.while_statement,
      $.for_statement,
      $.return_statement,
      $.raise_statement,
      $.expression_statement,
    ),

    // ── Imports ─────────────────────────────────────────────────────────────

    import_statement: $ => seq(
      'import',
      field('path', $.import_path),
      'as',
      field('alias', $.identifier),
    ),

    import_path: $ => seq(
      $.identifier,
      repeat(seq('/', $.identifier)),
    ),

    // ── Variable declarations ────────────────────────────────────────────────

    variable_declaration: $ => seq(
      optional('mut'),
      field('name', $.identifier),
      ':',
      field('type', $.type),
      '=',
      field('value', $.expression),
    ),

    // ── Assignment ──────────────────────────────────────────────────────────

    assignment: $ => seq(
      field('target', $._assignable),
      '=',
      field('value', $.expression),
    ),

    _assignable: $ => choice(
      $.identifier,
      $.field_access,
      $.index_access,
    ),

    // ── Types ────────────────────────────────────────────────────────────────

    type: $ => seq(
      $._base_type,
      optional('?'),
    ),

    _base_type: $ => choice(
      $.builtin_type,
      $.array_type,
      $.map_type,
      $.identifier,
    ),

    builtin_type: $ => choice(
      'int', 'float', 'string', 'bool', 'void',
    ),

    array_type: $ => seq('[', $.type, ']'),

    map_type: $ => seq(
      'Map',
      optional(seq('[', $.type, ',', $.type, ']')),
    ),

    // ── Functions ────────────────────────────────────────────────────────────

    func_definition: $ => seq(
      optional('pub'),
      'func',
      field('name', $.func_name),
      field('params', $.param_list),
      '->',
      field('return_type', $.type),
      repeat($._statement),
      'end',
    ),

    func_name: $ => seq(
      $.identifier,
      optional(choice('!', '?')),
    ),

    param_list: $ => seq(
      '(',
      optional(seq(
        $.param,
        repeat(seq(',', $.param)),
      )),
      ')',
    ),

    param: $ => seq(
      field('name', $.identifier),
      ':',
      field('type', $.type),
    ),

    // ── Structs ──────────────────────────────────────────────────────────────

    struct_definition: $ => seq(
      optional('pub'),
      'struct',
      field('name', $.identifier),
      repeat(choice($.struct_field, $.func_definition)),
      'end',
    ),

    struct_field: $ => seq(
      optional('mut'),
      field('name', $.identifier),
      ':',
      field('type', $.type),
      optional(seq('=', field('default', $.expression))),
    ),

    // ── Enums ────────────────────────────────────────────────────────────────

    enum_definition: $ => choice(
      seq(
        optional('pub'),
        'enum',
        field('name', $.identifier),
        '(',
        $.enum_variant_list,
        ')',
      ),
      seq(
        optional('pub'),
        'enum',
        field('name', $.identifier),
        repeat1($.enum_variant_line),
        'end',
      ),
    ),

    enum_variant_list: $ => seq(
      $.enum_variant,
      repeat(seq(',', $.enum_variant)),
    ),

    enum_variant_line: $ => seq(
      $.enum_variant,
      repeat(seq(',', $.enum_variant)),
    ),

    enum_variant: $ => seq(
      field('name', $.identifier),
      optional(seq(':', field('type', $.type))),
    ),

    // ── Error definitions ────────────────────────────────────────────────────

    error_definition: $ => choice(
      seq(
        optional('pub'),
        'error',
        field('name', $.identifier),
        '(',
        $.enum_variant_list,
        ')',
      ),
      seq(
        optional('pub'),
        'error',
        field('name', $.identifier),
        repeat1($.enum_variant_line),
        'end',
      ),
    ),

    // ── Control flow ─────────────────────────────────────────────────────────

    if_statement: $ => seq(
      'if',
      field('condition', $.expression),
      repeat($._statement),
      optional(seq('else', repeat($._statement))),
      'end',
    ),

    while_statement: $ => seq(
      'while',
      field('condition', $.expression),
      repeat($._statement),
      'end',
    ),

    for_statement: $ => seq(
      'for',
      field('variable', $.identifier),
      'in',
      field('iterable', $.expression),
      repeat($._statement),
      'end',
    ),

    // ── Match ────────────────────────────────────────────────────────────────

    match_arm: $ => seq(
      field('pattern', $.match_pattern),
      '=>',
      field('body', $.expression),
    ),

    match_pattern: $ => choice(
      seq('with', field('binding', $.identifier), 'if', field('guard', $.expression)),
      seq($.expression, 'if', field('guard', $.expression)),
      $.wildcard,
      $.expression,
    ),

    wildcard: $ => '_',

    // ── Return / raise ───────────────────────────────────────────────────────

    return_statement: $ => seq(
      'return',
      optional($.expression),
    ),

    raise_statement: $ => seq(
      'raise',
      field('error', $.expression),
      optional(seq('if', field('condition', $.expression))),
    ),

    expression_statement: $ => $.expression,

    // ── Expressions ──────────────────────────────────────────────────────────

    expression: $ => choice(
      $.binary_expression,
      $.unary_expression,
      $.ternary_expression,
      $.try_expression,
      $.catch_expression,
      $.match_expression,
      $.call_expression,
      $.field_access,
      $.self_field_access,
      $.index_access,
      $.range_expression,
      $.struct_literal,
      $.array_literal,
      $.identifier,
      $.integer_literal,
      $.float_literal,
      $.string_literal,
      $.fstring_literal,
      $.multiline_string_literal,
      $.fmultiline_string_literal,
      $.bool_literal,
      $.nil_literal,
    ),

    binary_expression: $ => choice(
      prec.left(1, seq(field('left', $.expression), field('operator', choice('+', '-')), field('right', $.expression))),
      prec.left(2, seq(field('left', $.expression), field('operator', choice('*', '/')), field('right', $.expression))),
      prec.left(3, seq(field('left', $.expression), field('operator', choice('==', '!=', '<', '<=', '>', '>=')), field('right', $.expression))),
      prec.left(4, seq(field('left', $.expression), field('operator', choice('and', 'or')), field('right', $.expression))),
    ),

    unary_expression: $ => prec(10, seq(
      field('operator', choice('not', '-')),
      field('operand', $.expression),
    )),

    ternary_expression: $ => prec.right(0, seq(
      field('condition', $.expression),
      '?',
      field('then', $.expression),
      ':',
      field('else', $.expression),
    )),

    try_expression: $ => prec(9, seq(
      'try',
      field('expression', $.expression),
    )),

    catch_expression: $ => prec.left(0, choice(
      seq(
        field('expression', $.expression),
        'catch',
        field('default', $.expression),
      ),
      seq(
        field('expression', $.expression),
        'catch',
        repeat1($.match_arm),
        'end',
      ),
    )),

    match_expression: $ => seq(
      'match',
      field('value', $.expression),
      repeat1($.match_arm),
      'end',
    ),

    call_expression: $ => prec(8, seq(
      field('function', choice($.field_access, $.self_field_access, $.identifier, $.call_expression)),
      optional(field('suffix', choice('!', '?'))),
      field('args', $.argument_list),
    )),

    argument_list: $ => seq(
      '(',
      optional(seq(
        $.expression,
        repeat(seq(',', $.expression)),
      )),
      ')',
    ),

    field_access: $ => prec.left(9, seq(
      field('object', choice($.call_expression, $.field_access, $.identifier, $.self_field_access)),
      '.',
      field('field', $.func_name),
    )),

    // Self field access: `.fieldname` (implicit self)
    self_field_access: $ => prec(9, seq(
      '.',
      field('field', $.identifier),
    )),

    index_access: $ => prec(9, seq(
      field('object', $.expression),
      '[',
      field('index', $.expression),
      ']',
    )),

    range_expression: $ => prec.right(5, seq(
      field('start', $.expression),
      choice('..', '..='),
      field('end', $.expression),
    )),

    struct_literal: $ => seq(
      field('type', $.identifier),
      '{',
      optional(seq(
        $.struct_field_init,
        repeat(seq(',', $.struct_field_init)),
        optional(','),
      )),
      '}',
    ),

    struct_field_init: $ => seq(
      field('name', $.identifier),
      ':',
      field('value', $.expression),
    ),

    array_literal: $ => choice(
      seq('[', optional(seq($.expression, repeat(seq(',', $.expression)), optional(','))), ']'),
      seq('[', 'reserve', field('capacity', $.expression), ']'),
    ),

    // ── Literals ─────────────────────────────────────────────────────────────

    integer_literal: $ => token(choice(
      /[0-9][0-9_]*/,
      /0x[0-9a-fA-F][0-9a-fA-F_]*/,
      /0b[01][01_]*/,
      /0o[0-7][0-7_]*/,
    )),

    float_literal: $ => token(
      /[0-9][0-9_]*\.[0-9][0-9_]*([eE][+-]?[0-9]+)?/,
    ),

    string_literal: $ => seq(
      "'",
      repeat(choice(
        $.string_content,
        $.escape_sequence,
      )),
      "'",
    ),

    fstring_literal: $ => seq(
      "f'",
      repeat(choice(
        $.fstring_content,
        $.escape_sequence,
        $.interpolation,
      )),
      "'",
    ),

    multiline_string_literal: $ => seq(
      "'''",
      repeat(choice(
        $.multiline_string_content,
        $.escape_sequence,
      )),
      "'''",
    ),

    fmultiline_string_literal: $ => seq(
      "f'''",
      repeat(choice(
        $.fstring_content,
        $.escape_sequence,
        $.interpolation,
      )),
      "'''",
    ),

    string_content: $ => token.immediate(prec(1, /[^'\\]+/)),

    fstring_content: $ => token(prec(1, /[^'\\{}]+/)),

    multiline_string_content: $ => token.immediate(prec(1, /[^'\\]+/)),

    escape_sequence: $ => token.immediate(seq(
      '\\',
      choice(
        /[ntr\\']/,
        /x[0-9a-fA-F]{2}/,
        /u[0-9a-fA-F]{4}/,
      ),
    )),

    interpolation: $ => seq(
      '{',
      $.expression,
      '}',
    ),

    bool_literal: $ => choice('true', 'false'),

    nil_literal: $ => 'nil',

    // ── Comments ─────────────────────────────────────────────────────────────

    // Longest-match wins: ##[ beats #[ beats # at the same position.
    // No lazy quantifiers in Rust regex — handle terminators manually.

    doc_comment: $ => token(seq(
      '##[',
      repeat(choice(
        /[^\]]/,     // any char except ]
        /\][^#]/,    // ] not followed by #
        /\]#[^#]/,   // ]# not followed by #
      )),
      ']##',
    )),

    block_comment: $ => token(seq(
      '#[',
      repeat(choice(
        /[^\]]/,     // any char except ]
        /\][^#]/,    // ] not followed by #
      )),
      ']#',
    )),

    comment: $ => /#[^\n]*/,

    // ── Identifiers ──────────────────────────────────────────────────────────

    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,
  },
});
