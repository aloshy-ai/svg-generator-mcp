# Contributing to SVG Generator MCP Server

Thank you for your interest in contributing to the SVG Generator MCP Server! This document provides guidelines and information for contributors.

## 🤝 Code of Conduct

This project adheres to a code of conduct that we expect all contributors to follow. Please be respectful, inclusive, and constructive in all interactions.

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- Python 3.8 or higher
- Git
- A GitHub account

### Development Setup

1. **Fork the repository**
   ```bash
   # Fork the repo on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/svg-generator-mcp.git
   cd svg-generator-mcp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Python dependencies**
   ```bash
   pip install mflux
   ```

4. **Run tests to ensure everything works**
   ```bash
   npm test
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 📋 Development Workflow

### Branch Naming

Use descriptive branch names with the following prefixes:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test improvements
- `chore/` - Maintenance tasks

Example: `feature/add-new-style-support`

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Types:
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(server): add support for custom model paths
fix(svg-processor): handle edge case in optimization
docs(readme): update installation instructions
test(services): add tests for model service
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode (for development)
npm run dev

# Run specific test file
npm test -- svg-processor.test.ts
```

### Writing Tests

- Write tests for all new features and bug fixes
- Maintain or improve test coverage
- Use descriptive test names that explain what is being tested
- Follow the existing test structure and patterns

Example test structure:
```typescript
describe('ServiceName', () => {
  describe('methodName', () => {
    it('should handle normal case correctly', () => {
      // Test implementation
    });

    it('should throw error when invalid input provided', () => {
      // Error case test
    });
  });
});
```

## 🎯 Code Quality

### Linting and Formatting

```bash
# Run linter
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Format code
npm run format

# Type checking
npm run typecheck
```

### Code Style Guidelines

- Use TypeScript for all new code
- Follow the existing code style and patterns
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions small and focused
- Use async/await instead of Promises where possible

### Architecture Guidelines

- **Separation of Concerns**: Keep business logic separate from MCP protocol handling
- **Error Handling**: Always handle errors gracefully and provide meaningful error messages
- **Logging**: Use the logger utility for all logging, not console.log
- **Type Safety**: Use TypeScript strictly, avoid `any` types
- **Testing**: Write unit tests for services and integration tests for the server

## 📝 Documentation

### Updating Documentation

- Update the README.md if you add new features or change existing ones
- Add JSDoc comments to new public methods and classes
- Update the CHANGELOG.md following [Keep a Changelog](https://keepachangelog.com/) format
- Create or update wiki pages for significant features

### Documentation Standards

- Use clear, concise language
- Include code examples where helpful
- Keep documentation up-to-date with code changes
- Use proper markdown formatting

## 🔧 Adding New Features

### Before Starting

1. Check existing issues and PRs to avoid duplication
2. Create an issue to discuss the feature if it's significant
3. Get feedback from maintainers before starting large changes

### Implementation Guidelines

1. **Follow MCP Protocol**: Ensure new tools follow MCP specifications
2. **Validation**: Add input validation using Zod schemas
3. **Error Handling**: Implement proper error handling with meaningful messages
4. **Testing**: Write comprehensive tests for new functionality
5. **Documentation**: Update documentation and examples

### Example: Adding a New Tool

1. Define the tool schema in `svg-generator-server.ts`
2. Add the tool to the `getTools()` method
3. Implement the handler in `handleToolCall()`
4. Add input validation using Zod
5. Write unit tests
6. Update documentation

## 🐛 Bug Reports

### Before Reporting

1. Check if the bug has already been reported
2. Ensure you're using the latest version
3. Try to reproduce the bug with minimal steps

### Bug Report Format

Include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node.js version, OS, etc.)
- Error messages or logs
- Code examples if applicable

## 🚀 Pull Request Process

### Before Submitting

1. Ensure all tests pass: `npm test`
2. Ensure code is properly formatted: `npm run format`
3. Ensure no linting errors: `npm run lint`
4. Update documentation if needed
5. Add or update tests for your changes

### PR Guidelines

1. **Title**: Use a clear, descriptive title
2. **Description**: Explain what changes you made and why
3. **Testing**: Describe how you tested your changes
4. **Breaking Changes**: Clearly mark any breaking changes
5. **Related Issues**: Link to related issues or discussions

### PR Template

```markdown
## Description
Brief description of the changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Added tests for new functionality
- [ ] Manual testing performed

## Checklist
- [ ] Code follows the project's style guidelines
- [ ] Self-review of code completed
- [ ] Code is commented where necessary
- [ ] Documentation has been updated
- [ ] No breaking changes without version bump
```

## 🏷️ Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Workflow

1. Updates are merged into `main` branch
2. Releases are created using GitHub releases
3. CI/CD automatically publishes to npm
4. Version numbers are managed automatically

## 💬 Getting Help

- **Issues**: [GitHub Issues](https://github.com/aloshy-ai/svg-generator-mcp/issues) for bugs and feature requests
- **Discussions**: [GitHub Discussions](https://github.com/aloshy-ai/svg-generator-mcp/discussions) for questions and community chat
- **Documentation**: Check the [Wiki](https://github.com/aloshy-ai/svg-generator-mcp/wiki) for detailed guides

## 🙏 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- GitHub contributors page

Thank you for contributing to making SVG Generator MCP Server better! 🚀