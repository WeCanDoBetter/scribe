# Scribe Style Guide

Welcome to the Scribe Style Guide. In this guide, we outline the coding
standards used in the Scribe project to maintain readability and consistency
across the codebase. The guide is based on the Deno default linter rules and
further adapted to our project-specific needs.

## General Rules

- **Identifiers**: Use `camelCase` for variable names, `PascalCase` for type
  names, and `UPPERCASE_SNAKE_CASE` for constants.
- **No `var`**: Do not use `var` to declare variables. Always use `let` or
  `const`.
- **Double Quotes**: Use double quotes for strings except to avoid escaping.
- **Trailing commas**: Use trailing commas in multi-line object and array
  literals.
- **Whitespace**: Use 2 spaces for indentation. No trailing whitespace at the
  end of the lines. Leave a space before the opening parenthesis in control
  structures (`if`, `for`, `while`, etc.).
- **Semicolons**: Always end statements with a semicolon.

## Typescript

- **Explicit function return types**: Functions must have explicit return types
  unless they return `void`.
- **No explicit `any`**: Do not use `any` as a type declaration.
- **Interface naming**: Interfaces should not have an `I` prefix.
- **Explicit accessibility**: Every class member (properties/methods) should
  explicitly have `public`, `private`, or `protected`.

## Naming Conventions

- **Avoid abbreviations**: Do not use abbreviations. Write out the full term for
  clarity.
- **Descriptive names**: All identifier names (variables, functions, classes,
  modules, etc.) should be clear, descriptive, and self-explanatory.

## Comments

- **Use JSDoc**: Use JSDoc to document all functions, classes, and types.
- **Clarify complex sections**: Add comments to clarify complex code sections.

## Import / Export

- **Use modules**: Use modules instead of namespaces.
- **Single import per line**: Each import should be on a separate line.
- **Sort imports**: Sort import statements alphabetically.

## Testing and Error Handling

- **Always handle promises**: Always handle promises with `await`, `.catch()`,
  or by returning them to be handled elsewhere.
- **Write tests**: Write tests for all new code if applicable.

## Code Quality

- **No unused variables or arguments**: Do not leave unused variables or
  arguments in the code.
- **No unreachable code**: Avoid writing code that can never be executed.
- **No console.logs**: Do not leave `console.log()` in the code, consider using
  a logger.

Adhering to this style guide ensures that our codebase remains clean,
consistent, and easy to read and maintain. Before submitting your code, make
sure it complies with these guidelines. The Deno linter, along with some
additional rules, will help in maintaining this consistency. Happy coding!
