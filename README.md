# Repo Template

## Overview

This is a template repository that serves as an aid to bootstrap other repositories. It is designed to provide a standardized structure that works well with Claude Code for efficient AI-assisted development.

## Purpose

This template repository demonstrates best practices for organizing code, documentation, and resources in a way that makes it easy for Claude Code to understand and work with your project. By following this template, you can ensure that your repositories are optimized for AI collaboration.

## Structure

```
repository/
├── .claude/                    # Claude Code configuration
│   ├── commands/               # Custom slash commands
│   └── CLAUDE.md               # Project overview for Claude
├── specs/                      # Detailed specifications
│   ├── functional_specs.md     # Functionality explanations
│   ├── data_structures.md      # Data structures and algorithms
│   └── behavior_specs.md       # Behavior descriptions
├── ai_docs/                    # Library and technical documentation
│   ├── pandas.md               # Documentation for pandas
│   ├── argparse.md             # Documentation for argparse
│   ├── os.md                   # Documentation for os
│   └── re.md                   # Documentation for re
├── src/                        # Source code
├── tests/                      # Test code
└── README.md                   # General project information
```

## Getting Started

1. Clone this repository or copy its structure to start a new project
2. Modify the CLAUDE.md file with your project-specific information
3. Update documentation in specs/ and ai_docs/ directories
4. Add your source code to the src/ directory
5. Use the custom slash commands in .claude/commands/ to interact with Claude Code

## Dependencies

This template includes documentation for the following Python libraries:
- pandas - Data manipulation and analysis
- argparse - Command-line argument parsing
- os - Operating system interfaces
- re - Regular expression operations

## Contributing

Feel free to modify this template to suit your specific project needs. The key is to maintain a structure that provides clear context for Claude Code to understand your codebase.
