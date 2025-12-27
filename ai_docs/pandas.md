# Pandas Library Documentation

## Overview

Pandas is a powerful Python library for data manipulation and analysis. It offers data structures and operations for manipulating numerical tables and time series data. This document provides a summary of key pandas features and usage patterns relevant to projects built using this template.

## Key Data Structures

### DataFrame

The primary pandas data structure is the DataFrame, a two-dimensional labeled data structure with columns of potentially different types:

```python
import pandas as pd

# Create a DataFrame
df = pd.DataFrame({
    'A': [1, 2, 3],
    'B': ['a', 'b', 'c'],
    'C': [1.1, 2.2, 3.3]
})
```

### Series

A Series is a one-dimensional labeled array capable of holding any data type:

```python
# Create a Series
s = pd.Series([1, 2, 3, 4], index=['a', 'b', 'c', 'd'])
```

## Common Operations

### Reading Data

Pandas provides functions to read data from various file formats:

```python
# Read from CSV
df_csv = pd.read_csv('filename.csv')

# Read from Excel
df_excel = pd.read_excel('filename.xlsx', sheet_name='Sheet1')

# Read from JSON
df_json = pd.read_json('filename.json')

# Read from SQL query
import sqlite3
conn = sqlite3.connect('database.db')
df_sql = pd.read_sql_query("SELECT * FROM table", conn)
```

### Data Exploration

Pandas offers methods for exploring data:

```python
# View first few rows
df.head()

# View summary statistics
df.describe()

# Get information about DataFrame
df.info()

# Check for missing values
df.isna().sum()
```

### Data Selection

Pandas provides various ways to select data:

```python
# Select a column
df['A']

# Select multiple columns
df[['A', 'B']]

# Select rows by index
df.loc[0:2]

# Select rows by condition
df[df['A'] > 1]

# Select rows and columns
df.loc[0:2, ['A', 'B']]

# Select by integer position
df.iloc[0:2, 0:2]
```

### Data Manipulation

Pandas provides methods for manipulating data:

```python
# Add a new column
df['D'] = df['A'] * 2

# Apply a function to a column
df['E'] = df['A'].apply(lambda x: x**2)

# Group by a column and calculate statistics
df.groupby('B')['A'].mean()

# Pivot the DataFrame
pivot_df = df.pivot(index='A', columns='B', values='C')

# Melt the DataFrame (unpivot)
melted_df = pd.melt(df, id_vars=['A'], value_vars=['B', 'C'])
```

### Handling Missing Data

Pandas provides methods for handling missing data:

```python
# Drop rows with missing values
df.dropna()

# Fill missing values
df.fillna(0)

# Forward fill
df.fillna(method='ffill')

# Backward fill
df.fillna(method='bfill')
```

### Combining DataFrames

Pandas provides methods for combining DataFrames:

```python
# Concatenate DataFrames
combined_df = pd.concat([df1, df2])

# Merge DataFrames (SQL-like join)
merged_df = pd.merge(df1, df2, on='key_column')

# Join DataFrames on index
joined_df = df1.join(df2)
```

### Time Series Operations

Pandas has excellent support for time series data:

```python
# Create a date range
dates = pd.date_range('20230101', periods=6)

# Create a DataFrame with a DateTimeIndex
df = pd.DataFrame(np.random.randn(6, 4), index=dates, columns=list('ABCD'))

# Resample time series data
df.resample('M').mean()  # Monthly average

# Shift data
df.shift(1)  # Shift values by 1 period
```

## Best Practices

1. **Use Vectorized Operations**: Avoid loops in favor of vectorized operations for better performance:
   ```python
   # Good (vectorized)
   df['A'] = df['B'] * 2
   
   # Bad (loop)
   for i in range(len(df)):
       df.loc[i, 'A'] = df.loc[i, 'B'] * 2
   ```

2. **Chain Methods**: Use method chaining for cleaner code:
   ```python
   # Chain methods
   result = (df
             .groupby('A')
             .filter(lambda x: len(x) > 2)
             .sort_values('B')
             .reset_index(drop=True))
   ```

3. **Use Proper Data Types**: Set appropriate data types to improve performance and memory usage:
   ```python
   # Convert to categorical for memory efficiency
   df['category_column'] = df['category_column'].astype('category')
   
   # Convert to datetime for time series functionality
   df['date_column'] = pd.to_datetime(df['date_column'])
   ```

4. **Handle Missing Data Appropriately**: Choose missing data handling techniques based on the specific needs:
   ```python
   # Consider the implications of each approach
   df_dropped = df.dropna()  # Removes data
   df_filled = df.fillna(df.mean())  # May introduce bias
   ```

5. **Use MultiIndex for Hierarchical Data**: MultiIndex is useful for representing hierarchical data:
   ```python
   # Create a MultiIndex DataFrame
   arrays = [[1, 1, 2, 2], ['a', 'b', 'a', 'b']]
   df = pd.DataFrame(np.random.randn(4, 2), index=pd.MultiIndex.from_arrays(arrays))
   ```

## Project-Specific Usage

In projects based on this template, pandas is typically used for:

1. **Data Import/Export**: Reading data from and writing data to various file formats
2. **Data Cleaning**: Handling missing values, duplicates, and inconsistencies
3. **Data Transformation**: Restructuring and preparing data for analysis
4. **Exploratory Data Analysis**: Summarizing and visualizing data patterns
5. **Feature Engineering**: Creating new features from existing data

## References

- [Pandas Official Documentation](https://pandas.pydata.org/docs/)
- [Pandas User Guide](https://pandas.pydata.org/docs/user_guide/index.html)
- [10 Minutes to Pandas](https://pandas.pydata.org/docs/user_guide/10min.html)
