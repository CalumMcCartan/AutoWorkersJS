# AutoWorkersJS

Improve performance by semi-automatically introducing Parallel.js workers into JavaScript code fragments.
This extension is a work in progress.

## Usage

Open a JS file, and find the auto-workers-js menu under the Explorer tab. Then just hit the refresh button to find candidate loops, and hit the refactor button to transform them.

The refactored code uses the Parallel.js library, follow the simple installation instructions here https://parallel.js.org/

![Demo gif](./demo.gif)


## Limitations

Must be used on a loop which modifies an array.
In some cases the refactored code may not work correctly.
