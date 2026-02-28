# AGENTS.md - Repository Guidelines

## Project Overview

Simple todo list web application using vanilla HTML/CSS/JavaScript with no framework dependencies.
Data persistence via localStorage, with import/export functionality.

## Build / Run / Test Commands

### Running the Application
```bash
# No build step required - open directly in browser
open todo-list/index.html          # macOS
xdg-open todo-list/index.html      # Linux
start todo-list/index.html         # Windows
```

### Testing
- **No automated test suite exists** - manual testing only
- Test by interacting with the UI in browser
- Verify localStorage persistence by refreshing page

### Development
```bash
# No dev server - edit files directly and refresh browser
# Optional: use any static file server
npx serve .                         # Start static server at project root
python -m http.server 8000          # Python built-in server
```

## Code Style Guidelines

### JavaScript (app.js)

**Naming Conventions:**
- camelCase for variables and functions: `taskInput`, `renderTasks()`
- PascalCase for constructors/classes (none currently)
- Constants in UPPER_SNAKE_CASE (none currently)

**Code Structure:**
- Functions declared before usage
- DOM element queries at top of file
- Event listeners attached after function declarations
- IIFE pattern not used - global scope acceptable for this simple app

**Formatting:**
- 4-space indentation (no tabs)
- Spaces around operators: `a + b`, `x === y`
- Semicolons required
- Single quotes for strings (consistent with existing code)

**Comments:**
- Minimal comments - code should be self-documenting
- JSDoc not required for this project size

**Error Handling:**
- Use try/catch for JSON parsing (see importFile handler)
- Validate user input before processing
- Graceful degradation - no crashing on invalid input

**DOM Manipulation:**
- Use native DOM APIs (document.getElementById, createElement, etc.)
- Event delegation not required - direct listener attachment OK
- Clean up event listeners if removing elements dynamically

### CSS (style.css)

**Naming:**
- kebab-case for class names: `.task-item`, `.progress-bar`
- ID selectors allowed sparingly: `#taskInput`, `#addBtn`
- BEM pattern not enforced

**Organization:**
- Reset/universal rules first (`* { }`)
- Body/base styles
- Component styles in order of HTML appearance
- Related pseudo-classes grouped together

**Formatting:**
- 4-space indentation
- Opening brace on same line
- One property per line
- Semicolons required

**Values:**
- Use hex colors: `#1e3a8a`, `#3b82f6`
- Use px for fixed sizes, em/rem not currently used
- Use CSS variables if adding theme support (none currently)

### HTML (index.html)

**Structure:**
- Semantic HTML5 elements where possible
- Chinese language content (lang="zh-CN")
- Inline SVG for icons (no icon library)

**Attributes:**
- Double quotes for attribute values
- Boolean attributes without value: `disabled`, `checked`
- Self-closing tags for void elements: `<link />`, `<input />`

## Architecture Patterns

**State Management:**
- Single source of truth: `tasks` array
- State persisted to localStorage immediately on change
- UI always re-rendered from state (no partial updates)

**Event Flow:**
1. User action triggers event listener
2. Handler updates state
3. `saveTasks()` called
4. `renderTasks()` re-renders entire list

**Data Model:**
```javascript
{
  text: string,
  completed: boolean,
  important: boolean,
  createdAt: string (formatted date),
  deadline: ISO string | null,
  deadlineSetAt: formatted date string | null
}
```

## Existing Rules

No Cursor rules (.cursor/rules/, .cursorrules) or Copilot rules (.github/copilot-instructions.md) exist in this repository.

## Notes for Agents

- This is a simple project - avoid over-engineering
- No npm, no bundler, no framework - keep it that way unless asked
- Changes should be minimal and focused
- Test manually in browser after changes
- Preserve existing code style and patterns
- No test automation to run - verify behavior visually
