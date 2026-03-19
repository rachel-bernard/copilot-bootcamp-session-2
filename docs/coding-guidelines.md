# Coding Guidelines

This project values readability, consistency, and maintainability over clever or overly complex code. Code should be easy for any team member to understand, review, test, and extend.

## Style and Formatting

Use consistent formatting throughout the codebase so diffs stay clean and code reviews can focus on behavior instead of style. Keep functions focused, prefer clear naming, and avoid deeply nested logic where possible. Use meaningful whitespace and structure files so related logic is grouped together.

## Import Organization

Organize imports in a predictable order to improve scanability. Group and separate imports by type: external dependencies first, then internal modules, then local relative imports. Remove unused imports and avoid circular dependencies. Keep import statements explicit and easy to trace.

## Linting and Static Quality Checks

Use the configured linter as a required quality gate, not an optional step. Address lint warnings and errors before merging changes. Prefer fixing root causes over suppressing rules. If a lint rule needs to be bypassed, document the reason clearly and keep the scope of the bypass minimal.

## Reusability and DRY Principle

Follow the DRY (Don't Repeat Yourself) principle by extracting repeated logic into shared functions, utilities, or components. Reuse existing abstractions before introducing new ones, and avoid duplication across frontend and backend when patterns can be standardized.

## Maintainability Best Practices

Write small, focused modules with clear responsibilities. Keep public interfaces stable and predictable. Add or update tests when behavior changes. Favor straightforward implementations that are easy to debug and maintain over highly abstract patterns that add cognitive overhead.

## Review and Collaboration Expectations

Treat code reviews as a quality checkpoint for correctness, clarity, and long-term maintainability. Changes should include enough context in naming, structure, and tests so reviewers can understand intent quickly. Every contribution should leave the codebase a little cleaner than before.
