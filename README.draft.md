# Clever Monokai

A fixed Monokai with richer syntax semantics.

VS Code's built-in Monokai looks like Monokai from a distance, but too much of the actual highlighting is wrong or noisy. It loses useful Sublime Text distinctions, pushes green and red into places where they do not help, underlines normal syntax, and treats too many modern language details as if they were the same thing.

Clever Monokai is a repair job, not a new personality for Monokai. It keeps the old shape, restores stronger call/definition/type distinctions, removes pointless decoration, and adds semantic detail where it makes code faster to read.

## What "fixed" means

The target is not a new palette. The target is a Monokai that behaves better in real files.

- Function and method calls are blue.
- Function and method definitions are green.
- Classes, types, namespaces, and constructors stay visually related without the default underline spam.
- Keywords, strings, comments, numbers, and plain text keep the familiar Monokai roles.
- Built-ins and default-library symbols can be italicized or separated without taking over the file.
- Invalid syntax is still loud. Normal syntax is not.

This is the main correction: syntax highlighting should show structure, not decorate every token that a grammar happened to expose.

## What "richer semantics" means

Clever Monokai adds more distinctions, but tries not to turn the editor into a rainbow.

The theme separates small things that matter when scanning code:

- A call is not a declaration.
- A property is not a local variable.
- A type hint is not a runtime value.
- A namespace separator is not just random punctuation.
- A Vue component is not a native HTML tag.
- A CSS property is not a selector, a unit, or a pseudo-class.
- A Markdown link title is not its URL.
- A regex character class, group, assertion, and quantifier are different pieces of syntax.

The point is not to color everything. The point is to make repeated code shapes easier to recognize without abandoning Monokai.

## What changes

### General code

Clever Monokai restores the useful Sublime-style split between green definitions and blue calls. It also tunes semantic tokens so language servers do not overwrite that distinction with broader, less useful categories.

Properties get a pale orange treatment where VS Code exposes them. Access punctuation such as `.`, `->`, `::`, namespace separators, template braces, and type-parameter brackets get quieter but more deliberate colors. Parameters, declarations, enum members, built-ins, `this`/`self`, and default-library names are treated as separate cases instead of being collapsed into generic variables.

### PHP, docs, and attributes

PHP gets a lot of cleanup: `$` prefixes, `->` and `::`, class names after `new`, constants, parameters, nullable types, built-ins, `self`/`static`/`parent`, heredoc/nowdoc markers, SQL-in-string cases, and named arguments are all tuned separately.

Docblocks are not treated like plain comments. Tags, types, variables, strings, links, escapes, and placeholders get their own treatment, with lower contrast than code. Attributes and decorators also get separate colors for the marker, name, strings, and keywords.

### JavaScript, TypeScript, and Vue

JS and TS get clearer object keys, accessor punctuation, declarations, primitive/built-in types, import/export keywords, type-parameter brackets, optional markers, constructors, and property access.

Vue gets separate handling for native tags, components, `<script>`, `<style>`, top-level and nested `<template>`, `setup`, directives, refs, slots, static props, shorthand attributes, and Nuxt-style `to` values. Embedded template markup is intentionally softer than surrounding code so it does not dominate the file.

### HTML and CSS

HTML is softened. Tags, attributes, attribute values, unrecognized tags, unrecognized attributes, TSX attribute strings, and embedded JavaScript are separated without making every angle bracket scream.

CSS gets its own treatment for tag selectors, class selectors, selector dots, at-rules and combinators, arithmetic operators, properties, known values, units, hex colors, pseudo-classes, pseudo-elements, and custom properties.

### Markdown, config, regex, and shell

Markdown is treated as a real editing format, not an afterthought. Headings, heading markers, emphasis markers, quotes, links, image links, inline code, strikethrough, separators, fenced code markers, and embedded code blocks are tuned separately.

JSON, YAML, TOML, INI, dotenv, TextMate grammar files, regexes, shell, Batch, PowerShell, Ruby, Rust, and Python get smaller fixes where the default Monokai behavior is especially weak.

## Non-goals

Clever Monokai is not a full redesign, a pastel variant, or a different dark theme wearing the Monokai name. It keeps the palette recognizable and spends its complexity on syntax.

It is also not a perfect clone of Sublime Text. VS Code uses different grammars and semantic tokens, and every language exposes different information. The theme uses the useful information when it is available and stays close to Monokai when it is not.

## Development

Regenerate the publishable theme after changing the local VS Code Monokai overrides:

```sh
npm run build
```

The generator starts from the checked-in Monokai base theme and applies only settings blocks that target `Monokai`. The current `workbench.colorTheme` does not affect the build.

The generator reads:

- `sources/monokai-color-theme.base.json`
- `%APPDATA%/Code/User/settings.json`

It writes:

- `themes/clever-monokai-color-theme.json`

Use another settings file if needed:

```sh
npm run build -- --settings "path/to/settings.json"
```

Theme-specific VS Code settings selectors are treated as a list. Both adjacent selectors and comma-separated selectors are supported:

```jsonc
"[Monokai][Clever Monokai]": {
  // Applies when the settings theme is either Monokai or Clever Monokai.
},
"[Monokai],[Clever Monokai]": {
  // Also supported.
}
```

To read overrides from another settings selector, pass its theme name:

```sh
npm run build -- --settings-theme "Clever Monokai"
```

To build from another base theme file, pass both the base file and the matching settings selector name:

```sh
npm run build -- --base "path/to/theme.json" --settings-theme "Theme Name"
```

Run local checks and create a VSIX:

```sh
npm run check
npm run package
```

## Attribution

The base theme snapshot is derived from VS Code's built-in Monokai theme. The design target is the older Sublime Text Monokai behavior where its syntax distinctions were clearer.
