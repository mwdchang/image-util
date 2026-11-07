import { z } from 'zod';

/* Mutual recursion between the form builders makes definition order awkward. */
/* eslint-disable @typescript-eslint/no-use-before-define */

type JSONSchema = {
  type?: string;
  title?: string;
  description?: string;
  default?: unknown;
  minimum?: number;
  maximum?: number;
  multipleOf?: number;
  enum?: unknown[];
  properties?: Record<string, JSONSchema>;
  items?: JSONSchema;
};

export type OptionValues = Record<string, unknown>;

/**
 * Build an initial option object straight from the Zod schema. Defaults are
 * preferred; missing values fall back to sensible values derived from the
 * JSON Schema representation.
 */
export function initialValues(schema: z.ZodType): OptionValues {
  try {
    return schema.parse({}) as OptionValues;
  } catch {
    const json = z.toJSONSchema(schema, { io: 'input' }) as JSONSchema;
    return defaultsForProperties(json.properties ?? {});
  }
}

/**
 * Turn a Zod object schema into a form. Number fields are rendered as a
 * slider paired with a numeric input; enums become selects, booleans become
 * checkboxes, and object arrays get a repeatable sub-form.
 */
export function buildForm(
  schema: z.ZodType,
  values: OptionValues,
  onChange: () => void
): HTMLFormElement {
  const json = z.toJSONSchema(schema, { io: 'input' }) as JSONSchema;

  const form = document.createElement('form');
  form.className = 'effect-controls';
  form.addEventListener('submit', (event) => event.preventDefault());

  form.append(...fieldsFor(json.properties ?? {}, values, onChange));
  return form;
}

function fieldsFor(
  properties: Record<string, JSONSchema>,
  target: OptionValues,
  onChange: () => void
): HTMLElement[] {
  return Object.entries(properties).map(([key, prop]) => {
    const field = document.createElement('div');
    field.className = 'field';

    const caption = document.createElement('span');
    caption.className = 'field-label';
    caption.textContent = labelFor(key, prop);

    const control = controlFor(
      prop,
      () => target[key],
      (value) => {
        target[key] = value;
      },
      onChange
    );

    field.append(caption, control);
    return field;
  });
}

function controlFor(
  prop: JSONSchema,
  getValue: () => unknown,
  setValue: (value: unknown) => void,
  onChange: () => void
): HTMLElement {
  if (prop.enum) {
    return selectControl(prop, getValue, setValue, onChange);
  }

  if (prop.type === 'boolean') {
    return booleanControl(getValue, setValue, onChange);
  }

  if (prop.type === 'number' || prop.type === 'integer') {
    return numberControl(prop, getValue, setValue, onChange);
  }

  if (prop.type === 'array') {
    return arrayControl(prop, getValue, setValue, onChange);
  }

  if (prop.type === 'object') {
    return objectControl(prop, getValue, setValue, onChange);
  }

  return textControl(prop, getValue, setValue, onChange);
}

function numberControl(
  prop: JSONSchema,
  getValue: () => unknown,
  setValue: (value: unknown) => void,
  onChange: () => void
): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'number-control';

  const current = asNumber(getValue() ?? prop.default ?? prop.minimum ?? 0);
  const step = prop.multipleOf ?? (prop.type === 'integer' ? 1 : 0.01);
  const lower = prop.minimum ?? Math.min(0, current);
  const upper = prop.maximum ?? (current !== 0 ? Math.abs(current) * 4 : 100);

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = String(lower);
  slider.max = String(upper);
  slider.step = String(step);
  slider.value = String(current);

  const number = document.createElement('input');
  number.type = 'number';
  number.step = String(step);
  if (prop.minimum !== undefined) number.min = String(prop.minimum);
  if (prop.maximum !== undefined) number.max = String(prop.maximum);
  number.value = String(current);

  const commit = (value: number) => {
    if (!Number.isFinite(value)) return;
    slider.value = String(value);
    number.value = String(value);
    setValue(value);
    onChange();
  };

  slider.addEventListener('input', () => commit(Number(slider.value)));
  number.addEventListener('input', () => {
    if (number.value === '') return;
    const value = Number(number.value);
    if (!Number.isFinite(value)) return;
    slider.value = String(value);
    setValue(value);
    onChange();
  });

  wrap.append(slider, number);
  return wrap;
}

function booleanControl(
  getValue: () => unknown,
  setValue: (value: unknown) => void,
  onChange: () => void
): HTMLElement {
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'checkbox';
  checkbox.checked = Boolean(getValue());
  checkbox.addEventListener('input', () => {
    setValue(checkbox.checked);
    onChange();
  });
  return checkbox;
}

function selectControl(
  prop: JSONSchema,
  getValue: () => unknown,
  setValue: (value: unknown) => void,
  onChange: () => void
): HTMLSelectElement {
  const options = prop.enum ?? [];
  const current = getValue() ?? prop.default ?? options[0];

  const select = document.createElement('select');
  for (const option of options) {
    const element = document.createElement('option');
    element.value = String(option);
    element.textContent = String(option);
    if (String(option) === String(current)) element.selected = true;
    select.append(element);
  }

  select.addEventListener('input', () => {
    // Preserve the original enum value type instead of always using a string.
    const selected = options.find((option) => String(option) === select.value);
    setValue(selected ?? select.value);
    onChange();
  });
  return select;
}

function textControl(
  prop: JSONSchema,
  getValue: () => unknown,
  setValue: (value: unknown) => void,
  onChange: () => void
): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'text';
  input.value = String(getValue() ?? prop.default ?? '');
  input.addEventListener('input', () => {
    setValue(input.value);
    onChange();
  });
  return input;
}

function objectControl(
  prop: JSONSchema,
  getValue: () => unknown,
  setValue: (value: unknown) => void,
  onChange: () => void
): HTMLElement {
  const properties = prop.properties ?? {};
  let object = getValue() as OptionValues | undefined;
  if (!object || typeof object !== 'object') {
    object = defaultsForProperties(properties);
    setValue(object);
  }

  const wrap = document.createElement('div');
  wrap.className = 'object-control';
  wrap.append(...fieldsFor(properties, object, onChange));
  return wrap;
}

function arrayControl(
  prop: JSONSchema,
  getValue: () => unknown,
  setValue: (value: unknown) => void,
  onChange: () => void
): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'array-control';

  if (!Array.isArray(getValue())) {
    setValue([]);
  }

  const itemSchema = prop.items ?? {};

  const render = () => {
    wrap.replaceChildren();

    const items = getValue() as unknown[];
    items.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'array-item';

      const header = document.createElement('div');
      header.className = 'array-item-header';

      const title = document.createElement('span');
      title.textContent = `${labelFor('item', itemSchema)} ${index + 1}`;

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'remove-item';
      remove.textContent = 'Remove';
      remove.addEventListener('click', () => {
        const next = getValue() as unknown[];
        next.splice(index, 1);
        onChange();
        render();
      });

      header.append(title, remove);
      row.append(header);

      if (itemSchema.type === 'object' && itemSchema.properties) {
        let object = item as OptionValues | undefined;
        if (!object || typeof object !== 'object') {
          object = defaultsForProperties(itemSchema.properties);
          (getValue() as unknown[])[index] = object;
        }
        row.append(...fieldsFor(itemSchema.properties, object, onChange));
      } else {
        row.append(controlFor(
          itemSchema,
          () => (getValue() as unknown[])[index],
          (value) => {
            (getValue() as unknown[])[index] = value;
          },
          onChange
        ));
      }

      wrap.append(row);
    });

    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'add-item';
    add.textContent = 'Add';
    add.addEventListener('click', () => {
      (getValue() as unknown[]).push(defaultFor(itemSchema));
      onChange();
      render();
    });
    wrap.append(add);
  };

  render();
  return wrap;
}

function defaultFor(prop: JSONSchema): unknown {
  if (prop.default !== undefined) return prop.default;
  if (prop.enum?.length) return prop.enum[0];

  switch (prop.type) {
    case 'boolean':
      return false;
    case 'number':
    case 'integer':
      return prop.minimum ?? 0;
    case 'string':
      return '';
    case 'array':
      return [];
    case 'object':
      return defaultsForProperties(prop.properties ?? {});
    default:
      return undefined;
  }
}

function defaultsForProperties(
  properties: Record<string, JSONSchema>
): OptionValues {
  const values: OptionValues = {};
  for (const [key, prop] of Object.entries(properties)) {
    values[key] = defaultFor(prop);
  }
  return values;
}

function labelFor(key: string, prop: JSONSchema): string {
  if (prop.title) return prop.title;
  if (prop.description) return prop.description;

  const words = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim();

  return words.charAt(0).toUpperCase() + words.slice(1);
}

function asNumber(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}
