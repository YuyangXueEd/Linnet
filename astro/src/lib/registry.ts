/**
 * Extension registry generated from extensions/<name>/meta.json.
 *
 * Used by:
 * - SectionBlock.astro for dispatch + layout
 * - Setup wizard for the picker + config form
 * - Future agent/search surfaces
 *
 * Component references live in SectionBlock.astro.
 */

import { GENERATED_EXTENSION_REGISTRY } from './generatedExtensionRegistry';

export type LayoutMode =
  | 'editorial'
  | 'columns-2'
  | 'columns-3'
  | 'stack'
  | 'single';

export type IconName =
  | 'paper' | 'flame' | 'repo' | 'post' | 'cloud'
  | 'feather' | 'book' | 'search' | 'arrow' | 'sun' | 'moon';

export type ExtensionCategory =
  | 'research'
  | 'tech'
  | 'career'
  | 'local'
  | 'custom';

export type ExtensionLocale = 'general' | 'en' | 'zh';

export type FieldType =
  | 'text'
  | 'number'
  | 'slider'
  | 'toggle'
  | 'select'
  | 'multiselect'
  | 'tags'
  | 'urls';

export interface FieldOption {
  value: string;
  label: string;
  description?: string;
}

export interface SetupField {
  key: string;
  label: string;
  labelZh?: string;
  type: FieldType;
  required?: boolean;
  default?: unknown;
  options?: FieldOption[];
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  hint?: string;
  hintZh?: string;
  autocomplete?: string;
}

export interface ExtensionMeta {
  key: string;
  title: string;
  subtitle: string;
  icon: IconName;
  defaultOrder: number;
  layout: LayoutMode;
  displayName: string;
  displayNameZh?: string;
  description: string;
  descriptionZh?: string;
  category: ExtensionCategory;
  tags: string[];
  locale?: ExtensionLocale;
  setupFields: SetupField[];
  weeklyDefault?: boolean;
  monthlyDefault?: boolean;
  weeklyTopN?: number;
  monthlyTopN?: number;
}

export const REGISTRY = GENERATED_EXTENSION_REGISTRY as unknown as Record<string, ExtensionMeta>;

export const EXTENSION_LIST: ExtensionMeta[] = Object.values(REGISTRY).sort(
  (a, b) => a.defaultOrder - b.defaultOrder,
);

export function getExtension(key: string): ExtensionMeta | undefined {
  return REGISTRY[key];
}

export function getExtensionsForLocale(locale: 'en' | 'zh'): ExtensionMeta[] {
  return EXTENSION_LIST.filter(
    (ext) => !ext.locale || ext.locale === 'general' || ext.locale === locale,
  );
}

export const EXTENSIONS_BY_CATEGORY: Record<ExtensionCategory, ExtensionMeta[]> = {
  research: [],
  tech: [],
  career: [],
  local: [],
  custom: [],
};

for (const ext of EXTENSION_LIST) {
  EXTENSIONS_BY_CATEGORY[ext.category].push(ext);
}
