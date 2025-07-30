# Changelog

All notable changes to the SVG Generator MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial implementation of SVG Generator MCP Server
- Support for MFLUX image generation with Vector SVG Laser LoRA
- Three distinct styles: vector, laser, and colorful illustrations
- SVG optimization with configurable compression levels
- Model management and status reporting
- Generation history tracking
- Comprehensive test suite with >80% coverage
- Professional CI/CD pipeline with automated testing and publishing

### Features
- **generate_svg_illustration**: Generate high-quality SVG illustrations with customizable parameters
- **optimize_svg**: Optimize SVG files for better performance and smaller file sizes
- **list_available_models**: Get information about available models and their download status
- **get_generation_history**: Retrieve the history of recent SVG generations

### Technical
- TypeScript implementation with strict type checking
- Zod schema validation for all inputs
- Structured logging with configurable levels
- Error handling with meaningful error messages
- Professional documentation and contributing guidelines

## [1.0.0] - 2024-XX-XX

### Added
- Initial release of SVG Generator MCP Server
- Full MCP protocol compliance
- Integration with MFLUX for high-quality image generation
- Support for Vector SVG Laser LoRA and FluxxxMix Checkpoint models
- Professional architecture with comprehensive testing
- Ready for submission to Smithery.ai

### Infrastructure
- Automated CI/CD pipeline with GitHub Actions
- Comprehensive test suite using Vitest
- ESLint and Prettier configuration
- Security scanning and dependency auditing
- Automated npm publishing on releases

### Documentation
- Complete README with usage examples
- Contributing guidelines and code of conduct
- MIT license
- Changelog following Keep a Changelog format

---

## Release Notes Template

When creating releases, use this template:

### 🚀 Features
- List new features and enhancements

### 🐛 Bug Fixes
- List bug fixes

### 🔧 Technical Improvements
- List technical improvements, refactoring, etc.

### 📚 Documentation
- List documentation updates

### ⚠️ Breaking Changes
- List any breaking changes

### 🙏 Contributors
- Thank contributors

---

## Version History

This project follows semantic versioning:
- **Major version**: Breaking changes
- **Minor version**: New features (backward compatible)
- **Patch version**: Bug fixes (backward compatible)

Each release is tagged in Git and published to npm automatically through the CI/CD pipeline.