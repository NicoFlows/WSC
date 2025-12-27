# Regular Expressions (re) Module Documentation

## Overview

The `re` module in Python provides support for working with regular expressions (regex). Regular expressions are powerful patterns used for matching and manipulating strings. This document covers key features of the re module and common usage patterns.

## Basic Concepts

A regular expression is a sequence of characters that defines a search pattern. Python's re module implements regular expression functionality similar to Perl's, with a few differences.

## Common Functions

### re.search()

Searches for a pattern anywhere in the string:

```python
import re

result = re.search(r'pattern', 'string to search')
if result:
    print("Pattern found:", result.group())
else:
    print("Pattern not found")
```

### re.match()

Checks if the pattern matches at the beginning of the string:

```python
result = re.match(r'pattern', 'pattern at start')
if result:
    print("Pattern matches at start:", result.group())
```

### re.findall()

Finds all occurrences of the pattern and returns them as a list:

```python
results = re.findall(r'\d+', 'There are 3 apples and 5 oranges')
print(results)  # ['3', '5']
```

### re.finditer()

Like findall(), but returns an iterator of match objects:

```python
for match in re.finditer(r'\d+', 'There are 3 apples and 5 oranges'):
    print(f"Found {match.group()} at position {match.start()}")
```

### re.sub()

Substitutes occurrences of the pattern with a replacement:

```python
result = re.sub(r'old', 'new', 'Replace old with new')
print(result)  # 'Replace new with new'

# With a limit on substitutions
result = re.sub(r'old', 'new', 'old old old', count=2)
print(result)  # 'new new old'

# With a function for dynamic replacements
def double_digits(match):
    return str(int(match.group()) * 2)

result = re.sub(r'\d+', double_digits, 'There are 3 apples')
print(result)  # 'There are 6 apples'
```

### re.split()

Splits the string by occurrences of the pattern:

```python
result = re.split(r'\s+', 'Split on   whitespace')
print(result)  # ['Split', 'on', 'whitespace']

# With a limit on splits
result = re.split(r'\s+', 'Split on   whitespace', maxsplit=1)
print(result)  # ['Split', 'on   whitespace']
```

### re.compile()

Compiles a regular expression pattern for reuse:

```python
pattern = re.compile(r'\d+')

# Now use the compiled pattern
results = pattern.findall('There are 3 apples and 5 oranges')
print(results)  # ['3', '5']

match = pattern.search('There are 3 apples')
if match:
    print(match.group())  # '3'
```

## Pattern Syntax

### Basic Patterns

- `a`, `b`, `c` - Match the exact character
- `.` - Match any character except newline
- `^` - Match start of string
- `$` - Match end of string
- `*` - Match 0 or more repetitions
- `+` - Match 1 or more repetitions
- `?` - Match 0 or 1 repetition
- `{m}` - Match exactly m repetitions
- `{m,n}` - Match from m to n repetitions
- `[abc]` - Match any character in the set
- `[^abc]` - Match any character not in the set
- `|` - Match either pattern (alternation)
- `(...)` - Capture group
- `(?:...)` - Non-capturing group

### Special Character Classes

- `\d` - Match any digit (equivalent to `[0-9]`)
- `\D` - Match any non-digit (equivalent to `[^0-9]`)
- `\s` - Match any whitespace character
- `\S` - Match any non-whitespace character
- `\w` - Match any alphanumeric character (equivalent to `[a-zA-Z0-9_]`)
- `\W` - Match any non-alphanumeric character
- `\b` - Match word boundary
- `\B` - Match non-word boundary

### Examples of Common Patterns

```python
# Email pattern
email_pattern = r'[\w\.-]+@[\w\.-]+'

# URL pattern
url_pattern = r'https?://[^\s]+'

# Date pattern (MM/DD/YYYY)
date_pattern = r'\d{1,2}/\d{1,2}/\d{4}'

# Phone number pattern (US)
phone_pattern = r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'

# IP address pattern
ip_pattern = r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b'
```

## Match Objects

When a match or search is successful, a match object is returned. This object contains information about the match:

```python
match = re.search(r'(\w+) (\w+)', 'John Doe')
if match:
    # Entire match
    print(match.group())  # 'John Doe'
    
    # Specific groups
    print(match.group(1))  # 'John'
    print(match.group(2))  # 'Doe'
    
    # All groups as tuple
    print(match.groups())  # ('John', 'Doe')
    
    # Position of match
    print(match.start())  # 0
    print(match.end())    # 8
    print(match.span())   # (0, 8)
```

## Named Groups

Named groups make it easier to work with captured groups:

```python
match = re.search(r'(?P<first>\w+) (?P<last>\w+)', 'John Doe')
if match:
    print(match.group('first'))  # 'John'
    print(match.group('last'))   # 'Doe'
    
    # Access named groups as a dictionary
    print(match.groupdict())  # {'first': 'John', 'last': 'Doe'}
```

## Flags

Flags modify how the pattern is interpreted:

```python
# Case-insensitive matching
result = re.search(r'pattern', 'PATTERN', re.IGNORECASE)

# Multi-line matching (^ and $ match at line breaks)
result = re.search(r'^line', 'First line\nSecond line', re.MULTILINE)

# Dot matches any character including newline
result = re.search(r'pattern.end', 'pattern\nend', re.DOTALL)

# Combining flags
result = re.search(r'pattern', 'PATTERN\nEND', re.IGNORECASE | re.DOTALL)

# Inline flags
result = re.search(r'(?i)pattern', 'PATTERN')  # Case-insensitive
result = re.search(r'(?m)^line', 'First line\nSecond line')  # Multi-line
```

Common flags:
- `re.IGNORECASE` or `re.I` - Case-insensitive matching
- `re.MULTILINE` or `re.M` - Multi-line matching
- `re.DOTALL` or `re.S` - Dot matches any character including newline
- `re.VERBOSE` or `re.X` - Allow verbose regular expressions with comments
- `re.ASCII` or `re.A` - Make \w, \W, \b, \B, \d, \D match only ASCII characters

## Verbose Regular Expressions

The `re.VERBOSE` flag allows for more readable regular expressions with comments:

```python
pattern = re.compile(r'''
    (\d{3})    # Area code
    [-\s]?     # Optional separator
    (\d{3})    # First 3 digits
    [-\s]?     # Optional separator
    (\d{4})    # Last 4 digits
''', re.VERBOSE)

match = pattern.search('Call me at 123-456-7890')
if match:
    print(match.groups())  # ('123', '456', '7890')
```

## Lookahead and Lookbehind Assertions

Lookahead and lookbehind assertions match patterns without including them in the result:

```python
# Positive lookahead: Match 'word' only if followed by 'next'
result = re.search(r'word(?=next)', 'wordnext')

# Negative lookahead: Match 'word' only if not followed by 'next'
result = re.search(r'word(?!next)', 'wordsomething')

# Positive lookbehind: Match 'word' only if preceded by 'previous'
result = re.search(r'(?<=previous)word', 'previousword')

# Negative lookbehind: Match 'word' only if not preceded by 'previous'
result = re.search(r'(?<!previous)word', 'someword')
```

## Best Practices

1. **Use Raw Strings**: Always use raw strings (prefix with `r`) for regular expressions to avoid unintended escape sequence interpretation:
   ```python
   # Good
   pattern = r'\d+'
   
   # Bad
   pattern = '\d+'  # Interpreted as a single 'd' character
   ```

2. **Compile for Reuse**: Compile patterns that will be used multiple times:
   ```python
   # Good for multiple uses
   pattern = re.compile(r'\d+')
   results1 = pattern.findall(text1)
   results2 = pattern.findall(text2)
   
   # Less efficient for multiple uses
   results1 = re.findall(r'\d+', text1)
   results2 = re.findall(r'\d+', text2)
   ```

3. **Be Specific**: Make patterns as specific as possible to avoid unintended matches:
   ```python
   # Too general
   email_pattern = r'.*@.*'
   
   # More specific
   email_pattern = r'[\w\.-]+@[\w\.-]+\.\w+'
   ```

4. **Use Non-Capturing Groups**: When you don't need to capture a group, use non-capturing groups for better performance:
   ```python
   # Capturing group (slower)
   pattern = r'(http|https)://example\.com'
   
   # Non-capturing group (faster)
   pattern = r'(?:http|https)://example\.com'
   ```

5. **Handle Errors**: Be prepared to handle regex-related errors:
   ```python
   try:
       pattern = re.compile(r'[unclosed bracket')
   except re.error as e:
       print(f"Invalid pattern: {e}")
   ```

## Example: Extracting Information from Text

Here's a complete example that demonstrates several regex concepts:

```python
import re

def extract_contact_info(text):
    """Extract email addresses and phone numbers from text."""
    # Email pattern
    email_pattern = r'[\w\.-]+@[\w\.-]+\.\w+'
    
    # Phone pattern (US format)
    phone_pattern = r'''
        (?:
            \(\d{3}\)      # (123)
            |
            \d{3}          # 123
        )
        [-\s]?             # Optional separator
        \d{3}              # 456
        [-\s]?             # Optional separator
        \d{4}              # 7890
    '''
    
    # Find all emails
    emails = re.findall(email_pattern, text)
    
    # Find all phone numbers
    phone_regex = re.compile(phone_pattern, re.VERBOSE)
    phones = [re.sub(r'\D', '', match) for match in phone_regex.findall(text)]
    
    return {
        'emails': emails,
        'phones': phones
    }

# Example usage
text = """
Contact us at support@example.com or sales@example.com.
Call our customer service at (123) 456-7890 or technical support at 987-654-3210.
"""

info = extract_contact_info(text)
print("Emails:", info['emails'])
print("Phones:", info['phones'])
```

## References

- [Python Documentation: re module](https://docs.python.org/3/library/re.html)
- [Regular Expression HOWTO](https://docs.python.org/3/howto/regex.html)
- [Regex101](https://regex101.com/) - An online tool for testing regular expressions
