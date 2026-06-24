# UNFINISHED DRAFT

# Clever Monokai

A fixed Monokai with richer semantics.

### "Fixed":
VS Code's Monokai is awful. Sublime Text Monokai was pretty.
This theme starts with fixing all issues intruduced by VSCode Monokai, such as eye-bleeding green all over the place where it wasn't found in Sublime (for certain languages), green, green and red everywhere, countless underlines everywhere, and buch of other nasty design decisions.

### "Richer semantics":
What does it means?

Many themes add minor tweaks to , but there's no theme combining all such minor tweaks. For example,


## Theme idea

### Differences from original Sublime Monokai, most VSCode themes, and what does the "Rechier semantics" means:

We try to follow initial Sublime Text's Monokai theme general idea, extending it without confusing by fully replacing or swapping colors:
- No underlines (well, except invalid syntax)
- Functions, class, structures, methods names DEFINITIONS - green
- Function/method calls - blue
- ...
- Keywords, string, comments, plain text, - all preserves the initial colors

What significantly differs from Sublime but necessary for the said richier semantics:
- Accessed properties are in pale orange color where possible
- Paler colors for HTML
- Special colors for CSS and derivatives
- Even paler colors for embed HTML like in Vue, React, other. To keep HTML markup language more distinct from the programming language since token colors overlap badly
- Markdown (almost completely)
- Many changes to minor punctuation for many language, like access token (`.`, `->`, `::` etc), namespace separators, brackets
- Meta like pragmas, attributes, decorators

# Chatgpt draft:
# [Theme Name]

A fixed and slightly expanded Monokai for VS Code.

VS Code's built-in Monokai always felt weird to me, especially if you came from Sublime Text. The colors are close enough at first glance, but the actual highlighting is all over the place: function calls stop being blue, definitions and calls get mixed together, some languages feel random, and a lot of the original Sublime Monokai logic just disappears.

So I rebuilt it around the Sublime version first, then kept polishing it for years. The goal is simple: keep the old Monokai feeling, but make it more consistent, more useful, and a bit smarter for modern languages.

## What this keeps from Sublime Monokai

The core idea is still the same. This theme is not trying to reinvent Monokai or turn it into a completely different theme.

Some of the rules it tries to preserve:

* Function and method calls stay blue.
* Function and method definitions stay green.
* Class names stay green.
* Language keywords like `function`, `fn`, `func`, etc. keep their own light-blue-ish color.
* Standard library / built-in symbols can use italic styling where it helps.
* Similar concepts should look similar across different languages.

<!-- TODO: add screenshots/examples here -->

## What "extended semantics" means

Over time I noticed that a lot of other good themes highlight small details that original Monokai either ignored or did not really distinguish. I liked some of those ideas, but I still wanted the theme to feel like Monokai.

So this theme adds a lot of tiny semantic improvements without blowing up the original palette.

For example:

* Property access can be slightly different from a plain variable.
* Property-access operators can get a subtle color instead of being just neutral punctuation.
* Namespace separators and similar syntax can be easier to scan.
* Different kinds of modifiers can be slightly separated instead of all screaming in the same bright red.
* Built-ins, standard library names, user-defined symbols, calls, definitions, and declarations try to stay visually distinct.
* The theme uses more nuance, but still keeps the Monokai mood.

<!-- TODO: add concrete before/after examples here -->

## Things that changed more noticeably

Most changes are small, but a few areas are more heavily cleaned up.

CSS was one of them. Original Monokai feels like it was made before modern CSS became what it is now, so a lot of CSS-specific syntax did not get the attention it deserves.

HTML also got softened. The original Monokai colors work great for programming languages, but HTML can become too loud very quickly: red tags everywhere, bright attributes everywhere, and suddenly the whole file is shouting at you. This version keeps the same general color logic, but makes HTML easier on the eyes.

Embedded HTML, like in Vue files, is also tuned to sit better inside the surrounding code.

<!-- TODO: add CSS / HTML / Vue examples here -->

## Why?

Because I still like Monokai.

I just wanted the Sublime version back, with years of small fixes layered on top.




# Development

Regenerate the publishable theme after changing your local VS Code Monokai overrides:

```sh
npm run build
```

By default, the generator always starts from the checked-in Monokai base theme and applies only settings blocks that target `Monokai`. Your current `workbench.colorTheme` does not affect the build.

The generator reads:

- `sources/monokai-color-theme.base.json`
- `%APPDATA%/Code/User/settings.json`

It writes:

- `themes/clever-monokai-color-theme.json`

You can point at another settings file if needed:

```sh
npm run build -- --settings "path/to/settings.json"
```

Theme-specific VS Code settings selectors are treated as a list. Both documented adjacent selectors and comma-separated selectors are supported:

```jsonc
"[Monokai][Clever Monokai]": {
  // Applies when the settings theme is either Monokai or Clever Monokai.
},
"[Monokai],[Clever Monokai]": {
  // Also supported.
}
```

To read overrides from a different settings selector, pass its theme name:

```sh
npm run build -- --settings-theme "Clever Monokai"
```

To build from a different base theme file, pass both the base file and the matching settings selector name:

```sh
npm run build -- --base "path/to/theme.json" --settings-theme "Theme Name"
```

Run the local checks and create a VSIX:

```sh
npm run check
npm run package
```

## Attribution

The base theme snapshot is derived from VS Code's built-in Monokai theme.
