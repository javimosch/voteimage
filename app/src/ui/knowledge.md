
- Files under ui folder will be merged and computed into a single html send by server if the user browses /v2 endpoint (new UI)
- The new approach allow us to split the UI in small files
- Order can be customized using an order file (order.json) located here at src/ui
- If no order is specified, we assume "top.html is first, "bottom.html" is last, all other .html files are in between (alphabetical order) and .js files are appended at the end of <body> (alphabetical order)
- folders under /ui folder can be used to group different virtual files to serve i.g /v2/superadmin could serve /ui/superadmin (all files in /ui/superadmin folder) and /v2 could serve /ui (all files in /ui folder). A function to compile the virtual file should be added in src/utils/virtualFile.js

## Example of order.json
```json
[
    "top.html",
    "script1.js"
    "bottom.html"
]