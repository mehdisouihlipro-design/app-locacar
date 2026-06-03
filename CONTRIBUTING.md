# Contributing Guidelines

Thank you for considering contributing to LocaCar! Please read and follow these guidelines.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the issue, not the person

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/locacar.git`
3. Create a branch: `git checkout -b feature/your-feature`
4. Install dependencies: `npm install`
5. Setup environment: `cp .env.example .env`

## Development Process

1. Create a feature branch from `develop`
2. Make your changes
3. Write tests for new functionality
4. Ensure all tests pass: `npm run test`
5. Run linting: `npm run lint`
6. Run type checking: `npm run type-check`
7. Commit with descriptive messages
8. Push to your fork
9. Create a Pull Request against `develop`

## Commit Messages

Follow conventional commits:
```
type(scope): description

[optional body]

[optional footer]
```

Types: feat, fix, docs, style, refactor, test, chore

Example:
```
feat(contracts): add GPS tracking to rentals

Add GPS tracking capability to active rental contracts.
Users can now view real-time vehicle location.

Fixes #123
```

## Code Style

- TypeScript for type safety
- Use ESLint and Prettier (configured)
- Follow existing code patterns
- Write self-documenting code
- Add comments for complex logic

## Testing

- Write tests for all new features
- Maintain > 80% code coverage
- Test both happy path and error cases
- Use descriptive test names

```typescript
describe('ContractService', () => {
  describe('createContract', () => {
    it('should create a contract with valid data', () => {
      // Test implementation
    });

    it('should throw error when vehicle is unavailable', () => {
      // Test implementation
    });
  });
});
```

## Database Changes

1. Create migration file with timestamp
2. Write up and down migrations
3. Test migration rollback
4. Document schema changes

```typescript
// migrations/20260505_create_vehicles_table.ts
export async function up(db: Database): Promise<void> {
  // Migration up code
}

export async function down(db: Database): Promise<void> {
  // Migration down code
}
```

## Pull Request Process

1. Fill out the PR template completely
2. Link related issues
3. Provide clear description of changes
4. Include screenshots/videos for UI changes
5. Ensure CI/CD passes
6. Respond to review comments

## PR Template

```markdown
## Description
Brief description of changes

## Related Issues
Fixes #123

## Changes Made
- Change 1
- Change 2

## Screenshots (if applicable)
[Screenshots here]

## Testing
- [ ] Manual tested on dev
- [ ] Tests added/updated
- [ ] No breaking changes

## Checklist
- [ ] Code follows style guide
- [ ] Self-reviewed changes
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings
```

## Reporting Issues

### Bug Report

```markdown
## Description
Clear description of the bug

## Steps to Reproduce
1. Step 1
2. Step 2
3. ...

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g., Windows 10]
- Node version: [e.g., 18.0.0]
- Browser: [if applicable]

## Screenshots
[If applicable]
```

### Feature Request

```markdown
## Description
Clear description of the feature

## Motivation
Why is this feature needed?

## Proposed Solution
How should this work?

## Additional Context
[Any other context]
```

## Documentation

- Update README.md for user-facing changes
- Update docs/ for technical documentation
- Add/update JSDoc comments
- Document breaking changes in CHANGELOG

## Performance

- Benchmark before/after for performance changes
- Avoid unnecessary dependencies
- Use efficient algorithms
- Consider memory usage

## Security

- Never commit secrets or credentials
- Validate and sanitize inputs
- Use parameterized queries
- Keep dependencies updated
- Report security issues privately

## Questions?

- Open a discussion in GitHub Discussions
- Email: dev@locacar.com
- Check existing issues first

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

Thank you for contributing! 🎉
