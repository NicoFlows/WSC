# OS Module Documentation

## Overview

The `os` module in Python provides a way of interacting with the operating system. It includes functions for file and directory operations, process management, environment variables, and more. This document focuses on the most commonly used features in the os module, particularly those related to file system operations.

## File and Directory Operations

### Path Operations

The `os.path` submodule provides functions for working with file paths:

```python
import os

# Join path components
path = os.path.join('directory', 'subdirectory', 'file.txt')

# Expand user directory (~)
user_dir = os.path.expanduser('~/documents')

# Get absolute path
abs_path = os.path.abspath('relative/path')

# Split path into directory and filename
dirname, filename = os.path.split('/path/to/file.txt')

# Split filename into base and extension
basename, extension = os.path.splitext('file.txt')

# Check if path exists
exists = os.path.exists('/path/to/check')

# Check if path is a file
is_file = os.path.isfile('/path/to/check')

# Check if path is a directory
is_dir = os.path.isdir('/path/to/check')

# Get file size
size = os.path.getsize('/path/to/file.txt')

# Get last modification time
mod_time = os.path.getmtime('/path/to/file.txt')
```

### Directory Operations

Functions for working with directories:

```python
# Get current working directory
cwd = os.getcwd()

# Change current working directory
os.chdir('/new/working/directory')

# List directory contents
contents = os.listdir('/path/to/directory')

# Create a directory
os.mkdir('/path/to/new/directory')

# Create a directory and any missing parent directories
os.makedirs('/path/to/new/nested/directory', exist_ok=True)

# Remove a directory
os.rmdir('/path/to/empty/directory')

# Remove a directory tree
import shutil  # Not part of os, but useful with it
shutil.rmtree('/path/to/directory/tree')

# Rename a directory
os.rename('/old/directory', '/new/directory')
```

### File Operations

Functions for working with files:

```python
# Create an empty file (or update timestamp of existing file)
with open('/path/to/file.txt', 'w') as f:
    pass

# Check if file exists
exists = os.path.exists('/path/to/file.txt')

# Remove a file
os.remove('/path/to/file.txt')

# Rename a file
os.rename('/path/to/old_file.txt', '/path/to/new_file.txt')

# Get file stats
stats = os.stat('/path/to/file.txt')
```

### Walking Directory Trees

The `os.walk()` function is useful for recursively traversing directory trees:

```python
for root, dirs, files in os.walk('/path/to/start'):
    # root: Current directory path
    # dirs: List of subdirectories in current directory
    # files: List of files in current directory
    
    for file in files:
        file_path = os.path.join(root, file)
        print(f"Found file: {file_path}")
    
    for dir in dirs:
        dir_path = os.path.join(root, dir)
        print(f"Found directory: {dir_path}")
```

## Environment and Process

### Environment Variables

Functions for working with environment variables:

```python
# Get all environment variables
all_env = os.environ

# Get a specific environment variable
value = os.environ.get('PATH', '')  # Second argument is default value

# Set an environment variable
os.environ['MY_VARIABLE'] = 'value'

# Delete an environment variable
if 'MY_VARIABLE' in os.environ:
    del os.environ['MY_VARIABLE']
```

### Process Management

Functions for working with processes:

```python
# Get current process ID
pid = os.getpid()

# Get parent process ID
ppid = os.getppid()

# Execute a command (returns the exit code)
exit_code = os.system('ls -l')

# Execute a command with more control (returns output)
import subprocess  # Not part of os, but related
result = subprocess.run(['ls', '-l'], capture_output=True, text=True)
stdout = result.stdout
stderr = result.stderr
exit_code = result.returncode
```

## Platform-Specific Information

Functions for getting platform-specific information:

```python
# Get name of operating system
os_name = os.name  # 'posix', 'nt', 'java', etc.

# Check if running on Windows
is_windows = os.name == 'nt'

# Check if running on Unix-like system (Linux, macOS, etc.)
is_unix = os.name == 'posix'

# Get path separator
separator = os.sep  # '/' on Unix, '\' on Windows

# Get line separator
line_sep = os.linesep  # '\n' on Unix, '\r\n' on Windows

# Get environment variable separator
path_sep = os.pathsep  # ':' on Unix, ';' on Windows
```

## File Descriptors

Lower-level functions for working with file descriptors:

```python
# Open a file and get a file descriptor
fd = os.open('/path/to/file.txt', os.O_RDWR | os.O_CREAT)

# Read from a file descriptor
data = os.read(fd, 1024)  # Read up to 1024 bytes

# Write to a file descriptor
bytes_written = os.write(fd, b'data to write')

# Close a file descriptor
os.close(fd)
```

## Error Handling

Many `os` functions can raise `OSError` (or one of its subclasses):

```python
try:
    os.mkdir('/path/that/might/not/be/writable')
except PermissionError:
    print("Permission denied")
except FileExistsError:
    print("Directory already exists")
except OSError as e:
    print(f"OS error: {e}")
```

## Best Practices

1. **Use os.path.join() for Paths**: Always use `os.path.join()` rather than string concatenation to ensure cross-platform compatibility:
   ```python
   # Good
   path = os.path.join('dir', 'file.txt')
   
   # Bad
   path = 'dir' + os.sep + 'file.txt'
   ```

2. **Check Existence Before Operations**: Always check if files or directories exist before performing operations:
   ```python
   if os.path.exists(path):
       # Proceed with operation
   ```

3. **Use context managers for file operations**:
   ```python
   with open('file.txt', 'w') as f:
       f.write('content')
   # File is automatically closed
   ```

4. **Use makedirs() with exist_ok**: When creating directory structures, use `makedirs()` with `exist_ok=True` to avoid race conditions:
   ```python
   os.makedirs('/path/to/directory', exist_ok=True)
   ```

5. **Handle Permissions and Existence**:
   ```python
   try:
       os.makedirs(directory, exist_ok=True)
   except PermissionError:
       print(f"No permission to create {directory}")
   ```

6. **Consider Using pathlib**: For Python 3.4+, consider using the `pathlib` module, which provides an object-oriented approach to file system paths:
   ```python
   from pathlib import Path
   path = Path('directory') / 'file.txt'
   ```

## Example: Working with Files and Directories

Here's a complete example that demonstrates several os functions:

```python
import os
import shutil
from datetime import datetime

def process_directory(directory):
    """Process all text files in a directory and its subdirectories."""
    # Ensure directory exists
    if not os.path.exists(directory):
        print(f"Directory {directory} does not exist.")
        return
    
    # Create output directory
    output_dir = os.path.join(directory, 'processed')
    os.makedirs(output_dir, exist_ok=True)
    
    # Process all text files recursively
    for root, dirs, files in os.walk(directory):
        # Skip the output directory
        if root == output_dir:
            continue
        
        for file in files:
            if file.endswith('.txt'):
                file_path = os.path.join(root, file)
                process_file(file_path, output_dir)

def process_file(file_path, output_dir):
    """Process a single text file."""
    # Get file info
    file_size = os.path.getsize(file_path)
    mod_time = os.path.getmtime(file_path)
    mod_time_str = datetime.fromtimestamp(mod_time).strftime('%Y-%m-%d %H:%M:%S')
    
    # Create output filename
    filename = os.path.basename(file_path)
    output_path = os.path.join(output_dir, f"processed_{filename}")
    
    # Process the file
    print(f"Processing {file_path} ({file_size} bytes, modified {mod_time_str})")
    try:
        with open(file_path, 'r') as in_file, open(output_path, 'w') as out_file:
            content = in_file.read()
            # Simple processing: convert to uppercase
            processed_content = content.upper()
            out_file.write(processed_content)
        print(f"Saved processed file to {output_path}")
    except Exception as e:
        print(f"Error processing {file_path}: {e}")

if __name__ == "__main__":
    # Process the current directory
    process_directory(os.getcwd())
```

## References

- [Python Documentation: os](https://docs.python.org/3/library/os.html)
- [Python Documentation: os.path](https://docs.python.org/3/library/os.path.html)
