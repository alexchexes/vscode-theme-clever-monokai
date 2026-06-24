import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import * as jsonc from "jsonc-parser";

type JsonObject = Record<string, unknown>;

type ThemeFile = JsonObject & {
  $schema?: string;
  name?: string;
  type?: string;
  colors?: JsonObject;
  tokenColors?: unknown[];
  semanticHighlighting?: boolean;
  semanticTokenColors?: JsonObject;
};

type BuildOptions = {
  settings: string;
  base: string;
  output: string;
  settingsTheme: string;
  themeName: string;
};

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");

const defaultSettingsPath = path.join(
  process.env.APPDATA ?? "",
  "Code",
  "User",
  "settings.json",
);

const shortcutScopes: Record<string, string | string[]> = {
  comments: "comment",
  strings: "string",
  keywords: "keyword",
  numbers: "constant.numeric",
  types: ["entity.name.type", "entity.name.class", "support.type", "support.class"],
  functions: ["entity.name.function", "support.function"],
  variables: "variable",
};

const options = parseArgs(process.argv.slice(2));
const settings = parseJsoncFile<JsonObject>(options.settings);
const baseTheme = parseJsoncFile<ThemeFile>(options.base);
const theme = buildTheme(baseTheme, settings, options.settingsTheme, options.themeName);
const outputText = `${JSON.stringify(theme, null, 2)}\n`;
const previousOutput = existsSync(options.output) ? readFileSync(options.output, "utf8") : undefined;

mkdirSync(path.dirname(options.output), { recursive: true });
writeFileSync(options.output, outputText, "utf8");

const status = previousOutput === outputText ? "Unchanged" : "Updated";
console.log(`${status} ${path.relative(repoRoot, options.output)} from ${options.settingsTheme} settings.`);
console.log(`Semantic token rules: ${Object.keys(theme.semanticTokenColors ?? {}).length}`);

function buildTheme(
  baseThemeFile: ThemeFile,
  settingsFile: JsonObject,
  sourceThemeName: string,
  outputThemeName: string,
): ThemeFile {
  const {
    $schema: _baseSchema,
    name: _baseName,
    type: _baseType,
    colors: _baseColors,
    tokenColors: _baseTokenColors,
    semanticHighlighting: _baseSemanticHighlighting,
    semanticTokenColors: _baseSemanticTokenColors,
    ...baseExtras
  } = deepClone(baseThemeFile);

  const output: ThemeFile = {
    $schema: "vscode://schemas/color-theme",
    name: outputThemeName,
    type: stringValue(baseThemeFile.type) ?? "dark",
    ...baseExtras,
    colors: {
      ...objectValue(baseThemeFile.colors),
    },
    tokenColors: Array.isArray(baseThemeFile.tokenColors) ? [...baseThemeFile.tokenColors] : [],
    semanticHighlighting: booleanValue(baseThemeFile.semanticHighlighting) ?? true,
    semanticTokenColors: {
      ...objectValue(baseThemeFile.semanticTokenColors),
    },
  };

  const workbenchCustomizations = splitThemeCustomization(
    objectValue(settingsFile["workbench.colorCustomizations"]),
    sourceThemeName,
  );

  applyProperties(output.colors ?? {}, workbenchCustomizations.global);
  applyProperties(output.colors ?? {}, workbenchCustomizations.themed);

  const tokenCustomizations = splitThemeCustomization(
    objectValue(settingsFile["editor.tokenColorCustomizations"]),
    sourceThemeName,
  );

  const tokenColors = output.tokenColors ?? [];
  tokenColors.push(...tokenRulesFromCustomization(tokenCustomizations.global));
  tokenColors.push(...tokenRulesFromCustomization(tokenCustomizations.themed));
  output.tokenColors = tokenColors;

  const tokenSemanticHighlighting =
    booleanValue(tokenCustomizations.themed.semanticHighlighting) ??
    booleanValue(tokenCustomizations.global.semanticHighlighting);

  const semanticCustomizations = splitThemeCustomization(
    objectValue(settingsFile["editor.semanticTokenColorCustomizations"]),
    sourceThemeName,
  );

  const semanticTokenColors = output.semanticTokenColors ?? {};
  applyProperties(semanticTokenColors, objectValue(semanticCustomizations.global.rules));
  applyProperties(semanticTokenColors, objectValue(semanticCustomizations.themed.rules));

  output.semanticTokenColors = semanticTokenColors;

  const semanticEnabled =
    booleanValue(semanticCustomizations.themed.enabled) ??
    booleanValue(semanticCustomizations.global.enabled) ??
    tokenSemanticHighlighting;

  output.semanticHighlighting =
    semanticEnabled ?? (Object.keys(semanticTokenColors).length > 0 || output.semanticHighlighting === true);

  return output;
}

function parseArgs(args: string[]): BuildOptions {
  const parsed: BuildOptions = {
    settings: defaultSettingsPath,
    base: path.join(repoRoot, "sources", "monokai-color-theme.base.json"),
    output: path.join(repoRoot, "themes", "clever-monokai-color-theme.json"),
    settingsTheme: "Monokai",
    themeName: "Clever Monokai",
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];

    switch (arg) {
      case "--settings":
        parsed.settings = requireValue(arg, next);
        index += 1;
        break;
      case "--base":
        parsed.base = requireValue(arg, next);
        index += 1;
        break;
      case "--output":
        parsed.output = requireValue(arg, next);
        index += 1;
        break;
      case "--settings-theme":
        parsed.settingsTheme = requireValue(arg, next);
        index += 1;
        break;
      case "--name":
        parsed.themeName = requireValue(arg, next);
        index += 1;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  parsed.settings = path.resolve(parsed.settings);
  parsed.base = path.resolve(parsed.base);
  parsed.output = path.resolve(parsed.output);

  return parsed;
}

function requireValue(arg: string, value: string | undefined): string {
  if (!value || value.startsWith("--")) {
    throw new Error(`${arg} requires a value.`);
  }

  return value;
}

function parseJsoncFile<T>(filePath: string): T {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const text = readFileSync(filePath, "utf8");
  const errors: jsonc.ParseError[] = [];
  const parsed = jsonc.parse(text, errors, {
    allowTrailingComma: true,
    disallowComments: false,
  });

  if (errors.length > 0) {
    const details = errors.map((error) => describeParseError(text, error)).join("\n");
    throw new Error(`Unable to parse ${filePath}:\n${details}`);
  }

  return parsed as T;
}

function describeParseError(text: string, error: jsonc.ParseError): string {
  const position = lineAndColumnAt(text, error.offset);
  return `${position.line}:${position.column} ${jsonc.printParseErrorCode(error.error)}`;
}

function lineAndColumnAt(text: string, offset: number): { line: number; column: number } {
  const beforeOffset = text.slice(0, offset);
  const lines = beforeOffset.split(/\r\n|\r|\n/);

  return {
    line: lines.length,
    column: (lines.at(-1)?.length ?? 0) + 1,
  };
}

function splitThemeCustomization(
  customization: JsonObject | undefined,
  themeName: string,
): { global: JsonObject; themed: JsonObject } {
  const global: JsonObject = {};
  const themed: JsonObject = {};

  if (!customization) {
    return { global, themed };
  }

  for (const [key, value] of Object.entries(customization)) {
    if (isThemeSelector(key)) {
      if (themeSelectorMatches(key, themeName)) {
        mergeObject(themed, objectValue(value));
      }
    } else {
      global[key] = value;
    }
  }

  return { global, themed };
}

function isThemeSelector(key: string): boolean {
  const selectors = parseThemeSelectors(key);
  const remainder = key.replace(/\[[^\]]+\]/g, "");

  return selectors.length > 0 && /^[\s,]*$/.test(remainder);
}

function themeSelectorMatches(selector: string, themeName: string): boolean {
  return parseThemeSelectors(selector).some((themeSelector) => themeNameMatches(themeSelector, themeName));
}

function parseThemeSelectors(selector: string): string[] {
  return [...selector.matchAll(/\[([^\]]+)\]/g)]
    .map((match) => match[1].trim())
    .filter((themeSelector) => themeSelector.length > 0);
}

function themeNameMatches(selector: string, themeName: string): boolean {
  if (!selector.includes("*")) {
    return selector === themeName;
  }

  const pattern = `^${selector.split("*").map(escapeRegExp).join(".*")}$`;
  return new RegExp(pattern).test(themeName);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function tokenRulesFromCustomization(customization: JsonObject): unknown[] {
  const rules: unknown[] = [];

  for (const [shortcut, scope] of Object.entries(shortcutScopes)) {
    if (hasOwn(customization, shortcut)) {
      const settings = tokenSettingsFromShortcut(customization[shortcut]);

      if (settings) {
        rules.push({
          name: `User ${shortcut}`,
          scope,
          settings,
        });
      }
    }
  }

  if (Array.isArray(customization.textMateRules)) {
    rules.push(...customization.textMateRules);
  }

  return rules;
}

function tokenSettingsFromShortcut(value: unknown): JsonObject | undefined {
  if (typeof value === "string") {
    return { foreground: value };
  }

  return objectValue(value);
}

function applyProperties(target: JsonObject, source: JsonObject | undefined): void {
  if (!source) {
    return;
  }

  for (const [key, value] of Object.entries(source)) {
    if (value === null) {
      delete target[key];
    } else {
      target[key] = value;
    }
  }
}

function mergeObject(target: JsonObject, source: JsonObject | undefined): void {
  if (!source) {
    return;
  }

  for (const [key, value] of Object.entries(source)) {
    target[key] = value;
  }
}

function objectValue(value: unknown): JsonObject | undefined {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as JsonObject;
  }

  return undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function booleanValue(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function hasOwn(value: JsonObject, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}
