# CLAUDE.md - Guidance for Claude Code

## Project Overview: Repo Template

This is a template repository that serves as an aid to bootstrap other repositories. It is designed to provide a standardized structure that works well with Claude Code for efficient AI-assisted development. The template includes documentation and organization practices that make it easier for Claude to understand the project and provide helpful assistance.

## General Best Practices

### Workflow Recommendations

1. **Research Before Coding**: Always analyze the problem first before jumping into implementation.
   - Understand the existing code structure
   - Research any relevant documentation
   - Plan your approach before writing code

2. **Three-Step Process for Complex Changes**:
   - Step 1: Research the problem and explore the codebase
   - Step 2: Plan the solution with a clear, step-by-step approach
   - Step 3: Implement the solution methodically

3. **Extended Thinking Mode**:
   - Use "think" trigger words when dealing with complex problems
   - Examples: "think harder", "think intensely", "think longer" 
   - For extra deep reasoning, use "ultrathink" for the most complex tasks
   - Use this mode for architectural decisions, challenging bugs, or multi-step implementations

4. **Documentation Generation**:
   - Add clear docstrings to all functions and classes
   - Include module-level docstrings explaining file purpose
   - Add section comments for logical groupings of code
   - Add inline comments for complex logic

### Code Quality Guidelines

1. **Python-Specific Standards**:
   - Follow PEP 8 style guidelines
   - Use type hints for all function signatures
   - Keep functions focused on a single responsibility
   - Use descriptive variable and function names (snake_case)
   - Class names should use CamelCase

2. **Testing Practices**:
   - Use pytest for all unit tests
   - Aim for high test coverage, especially for core functionality
   - Test edge cases thoroughly
   - Mock external dependencies where appropriate

3. **Secure Coding Practices**:
   - Always validate user inputs
   - Handle file operations safely with proper error handling
   - Close file handles properly using context managers
   - Never expose sensitive information in logs or output

### Version Control Guidelines

1. **Commit Best Practices**:
   - Write clear, descriptive commit messages
   - Make frequent, small commits for trackability
   - Follow conventional commit format: `feat/fix/docs/refactor: description`
   - Reference relevant issues in commit messages

2. **PR Creation**:
   - Include clear PR descriptions
   - Explain what changes were made and why
   - Note any potential issues or areas for review
   - Update relevant documentation

## Project-Specific Guidelines

### Documentation Structure

1. **Specifications (specs/ directory)**:
   - Contains detailed technical specifications about functionality
   - Includes information about data structures and algorithms
   - Documents expected behaviors and edge cases
   - Provides comprehensive explanations of how features work

2. **Library Documentation (ai_docs/ directory)**:
   - Contains reference documentation for libraries and tools
   - Provides examples of library usage specific to this project
   - Explains key concepts relevant to the codebase
   - Links to official documentation resources

3. **Source Code Organization**:
   - Main application code should be in the src/ directory
   - Use logical module structure for related functionality
   - Maintain separation of concerns between modules
   - Follow standard Python package structure

### Dependencies

1. **Standard Library**:
   - pandas: For data manipulation and analysis
   - argparse: For command-line argument parsing
   - os: For operating system interfaces
   - re: For regular expression operations

2. **Environment Setup**:
   - Use virtual environments for dependency isolation
   - Document all dependencies in requirements.txt
   - Support Python 3.8+

### Development Workflow

1. **Local Development**:
   - Run tests with: `python -m pytest tests/`
   - Generate coverage report with: `pytest --cov=src tests/`
   - Use linters (flake8, black) to maintain code quality

2. **Implementation Approach**:
   - Follow modular design principles
   - Write code that is easy to understand and maintain
   - Include appropriate error handling
   - Document assumptions and limitations

## Custom Commands

Use slash commands defined in the `.claude/commands/` directory for common tasks. Type `/` to see available commands.
