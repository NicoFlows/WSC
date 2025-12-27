# Argparse Module Documentation

## Overview

The `argparse` module is a standard library package in Python that makes it easy to write user-friendly command-line interfaces. It handles parsing command-line arguments and generating help and usage messages automatically. This document outlines key features and usage patterns for the argparse module.

## Basic Usage

The typical workflow for using argparse involves:

1. Create an ArgumentParser object
2. Add arguments to the parser
3. Parse the arguments from the command line
4. Access the parsed arguments

```python
import argparse

# Create parser
parser = argparse.ArgumentParser(description="Description of your program")

# Add arguments
parser.add_argument("--input", required=True, help="Input file path")
parser.add_argument("--output", help="Output file path")
parser.add_argument("--verbose", action="store_true", help="Enable verbose output")

# Parse arguments
args = parser.parse_args()

# Access arguments
input_file = args.input
output_file = args.output
is_verbose = args.verbose
```

## Creating an ArgumentParser

The `ArgumentParser` constructor accepts several parameters:

```python
parser = argparse.ArgumentParser(
    prog="program_name",  # Program name for help messages
    description="A description of what the program does",  # Description for help message
    epilog="Additional text at the end of help",  # Text at the end of help message
    formatter_class=argparse.ArgumentDefaultsHelpFormatter,  # Controls help formatting
    add_help=True  # Add -h/--help option
)
```

## Adding Arguments

Arguments are added using the `add_argument()` method:

```python
# Positional argument
parser.add_argument("filename", help="The file to process")

# Optional argument (short and long form)
parser.add_argument("-v", "--verbose", help="Increase output verbosity")

# Flag (boolean switch)
parser.add_argument("-q", "--quiet", action="store_true", help="Suppress output")

# Argument with choices
parser.add_argument("--mode", choices=["simple", "advanced"], default="simple", help="Operating mode")

# Argument with type conversion
parser.add_argument("--count", type=int, default=1, help="Number of iterations")

# Required named argument
parser.add_argument("--name", required=True, help="Your name")
```

## Argument Actions

The `action` parameter controls what happens when an argument is encountered:

```python
# Store a value (default)
parser.add_argument("--name", action="store", help="Your name")

# Store True if the option is specified
parser.add_argument("--verbose", action="store_true", help="Enable verbose output")

# Store False if the option is specified
parser.add_argument("--quiet", action="store_false", dest="verbose", help="Disable verbose output")

# Count occurrences (e.g., -vvv for verbosity level 3)
parser.add_argument("-v", "--verbose", action="count", default=0, help="Verbosity level")

# Append values to a list
parser.add_argument("--file", action="append", help="Input files (can be specified multiple times)")

# Store a constant value
parser.add_argument("--debug", action="store_const", const=True, help="Enable debug mode")
```

## Argument Groups

Arguments can be organized into groups for better help output:

```python
# Create argument groups
input_group = parser.add_argument_group("Input options")
output_group = parser.add_argument_group("Output options")

# Add arguments to groups
input_group.add_argument("--input", help="Input file")
output_group.add_argument("--output", help="Output file")
```

## Mutually Exclusive Groups

Mutually exclusive arguments can be defined:

```python
# Create a mutually exclusive group
group = parser.add_mutually_exclusive_group()

# Add mutually exclusive arguments
group.add_argument("--quiet", action="store_true", help="Suppress output")
group.add_argument("--verbose", action="store_true", help="Enable verbose output")
```

## Subcommands

Complex command-line interfaces often use subcommands:

```python
# Create main parser
parser = argparse.ArgumentParser(description="Command with subcommands")
subparsers = parser.add_subparsers(dest="command", help="Subcommand to run")

# Create parser for the "add" subcommand
add_parser = subparsers.add_parser("add", help="Add a record")
add_parser.add_argument("name", help="Name of the record")
add_parser.add_argument("--value", type=int, help="Value of the record")

# Create parser for the "delete" subcommand
delete_parser = subparsers.add_parser("delete", help="Delete a record")
delete_parser.add_argument("id", help="ID of the record to delete")

# Parse arguments
args = parser.parse_args()

# Handle subcommands
if args.command == "add":
    # Handle add command
    print(f"Adding {args.name} with value {args.value}")
elif args.command == "delete":
    # Handle delete command
    print(f"Deleting record with ID {args.id}")
```

## Handling Help and Errors

Argparse automatically generates help messages and error messages:

```python
try:
    args = parser.parse_args()
except SystemExit:
    # This catches the system exit triggered by --help or errors
    pass  # You can customize error handling here
```

## Best Practices

1. **Descriptive Help**: Always provide clear help text for all arguments
2. **Default Values**: Specify sensible default values when appropriate
3. **Type Conversion**: Use type parameters to convert arguments to appropriate types
4. **Error Handling**: Validate argument values after parsing
5. **Clear Structure**: Use argument groups and subcommands for complex CLIs
6. **Validation Logic**: Add custom validation after parsing:

```python
args = parser.parse_args()

# Custom validation
if args.input and not os.path.exists(args.input):
    parser.error(f"Input file '{args.input}' does not exist")
```

## Example Application

Here's a complete example of a simple command-line application:

```python
import argparse
import sys

def main():
    # Create parser
    parser = argparse.ArgumentParser(
        description="Process data files with various options",
        epilog="Example: program.py --input data.csv --output results.txt"
    )
    
    # Add arguments
    parser.add_argument("--input", required=True, help="Input file path")
    parser.add_argument("--output", help="Output file path (default: stdout)")
    parser.add_argument("--format", choices=["csv", "json", "txt"], default="csv",
                        help="Output format (default: %(default)s)")
    parser.add_argument("--verbose", "-v", action="count", default=0,
                        help="Increase verbosity level")
    
    # Parse arguments
    args = parser.parse_args()
    
    # Custom validation
    if args.input and not args.input.endswith((".csv", ".json", ".txt")):
        parser.error("Input file must be CSV, JSON, or TXT")
    
    # Process based on arguments
    if args.verbose >= 2:
        print(f"Debug: Processing {args.input} in {args.format} format")
    elif args.verbose == 1:
        print(f"Processing {args.input}...")
    
    # Main processing logic would go here
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
```

## References

- [Python Documentation: argparse](https://docs.python.org/3/library/argparse.html)
- [argparse Tutorial](https://docs.python.org/3/howto/argparse.html)
