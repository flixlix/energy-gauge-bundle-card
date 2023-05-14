/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-use-before-define */

import { LitElement, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { fireEvent, HomeAssistant, LovelaceCardEditor } from 'custom-card-helpers';
import { EnergyCardBaseConfig } from '../type/energy-card-base-config';
import { any, assert, assign, boolean, integer, number, object, optional, string } from 'superstruct';
import { localize } from '../localize/localize';
import memoizeOne from 'memoize-one';
import { EnergyGaugeBundleCardConfig } from '../energy-gauge-bundle-card-config';
import { SchemaUnion } from './types/schema-union';

export const loadHaForm = async () => {
  if (customElements.get('ha-form')) return;

  const helpers = await (window as any).loadCardHelpers?.();
  if (!helpers) return;
  const card = await helpers.createCardElement({ type: 'entity' });
  if (!card) return;
  await card.getConfigElement();
};

@customElement('energy-gauge-bundle-card-editor')
export class EnergyGaugeBundleCardEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private _config?: EnergyGaugeBundleCardConfig;
  @state() private showOther = false;

  public async setConfig(config: EnergyGaugeBundleCardConfig): Promise<void> {
    assert(
      config,
      assign(
        object({
          type: string(),
          view_layout: optional(string()),
        }),
        object({
          entity: optional(string()),
          gauge_type: optional(string()),
          min: optional(number()),
          max: optional(number()),
          unit_of_measurement: optional(string()),
          needle: optional(boolean()),
          severity: optional(
            object({
              green: optional(number()),
              yellow: optional(number()),
              red: optional(number()),
              normal: optional(number()),
            }),
          ),
          decimals: optional(integer()),
          show: optional(
            object({
              tooltip: optional(boolean()),
              name: optional(boolean()),
            }),
          ),
          name: optional(string()),
          tooltip: optional(string()),
          clickable: optional(boolean()),
        }),
      ),
    );
    this._config = config;
    config.gauge_type = this._config?.gauge_type || 'autarky';
    config.needle = this._config?.needle || true;
    config.min = this._config?.min || 0;
    config.max = this._config?.max || 100;
    config.severity = this._config?.severity || {
      green: 70,
      yellow: 30,
      red: 0,
    };
    config.decimals = this._config?.decimals || 1;
    config.show ? (config.show.name = this._config?.show?.name) : (config.show = { name: true });
  }

  connectedCallback(): void {
    super.connectedCallback();
    loadHaForm();
  }

  private _schema = memoizeOne(
    (showSeverity: boolean) =>
      [
        {
          name: 'gauge_type',
          selector: {
            select: {
              options: (['autarky', 'self_consumption'] as const).map(type => ({
                value: type,
                label: localize(`gauge_name.${type}`),
              })),
              custom_value: true,
            },
          },
        },
        {
          name: 'entity',
          label: `${this.hass.localize('ui.panel.lovelace.editor.card.generic.entity')} (${localize('ui_editor.only_for_tap_action')})`,
          selector: {
            entity: {
              domain: ['counter', 'input_number', 'number', 'sensor'],
            },
          },
        },
        {
          name: '',
          type: 'grid',
          schema: [
            { name: 'name', selector: { text: {} } },
            { name: 'unit_of_measurement', selector: { text: {} } },
          ],
        },
        {
          name: 'show',
          type: 'grid',
          schema: [
            { name: 'tooltip', label: 'show_tooltip', selector: { boolean: {} } },
            { name: 'name', label: 'show_name', selector: { boolean: {} } },
          ],
        },
        {
          name: 'tooltip',
          selector: { text: {} },
        },
        {
          name: '',
          type: 'grid',
          schema: [
            {
              name: 'min',
              default: 0,
              selector: { number: { mode: 'box' } },
            },
            {
              name: 'max',
              default: 100,
              selector: { number: { mode: 'box' } },
            },
          ],
        },
        {
          name: '',
          type: 'grid',
          schema: [
            { name: 'needle', selector: { boolean: {} } },
            { name: 'show_severity', selector: { boolean: {} } },
          ],
        },
        ...(showSeverity
          ? ([
              {
                name: 'severity',
                type: 'grid',
                schema: [
                  {
                    name: 'green',
                    selector: { number: { mode: 'box' } },
                  },
                  {
                    name: 'yellow',
                    selector: { number: { mode: 'box' } },
                  },
                  {
                    name: 'red',
                    selector: { number: { mode: 'box' } },
                  },
                ],
              },
            ] as const)
          : []),
      ] as const,
  );

  protected render() {
    if (!this.hass || !this._config) {
      return nothing;
    }

    const data = {
      show_severity: this._config!.severity !== undefined,
      ...this._config,
    };

    const schema = this._schema(this._config!.severity !== undefined);
    return html`
      <ha-form
        .hass=${this.hass}
        .data=${data}
        .schema=${schema}
        .computeLabel=${this._computeLabelCallback}
        @value-changed=${this._valueChanged}
      ></ha-form>
    `;
  }

  private _valueChanged(ev: CustomEvent): void {
    let config = ev.detail.value;

    if (config.show_severity) {
      config = {
        ...config,
        severity: {
          green: config.green || config.severity?.green || 0,
          yellow: config.yellow || config.severity?.yellow || 0,
          red: config.red || config.severity?.red || 0,
        },
      };
    } else if (!config.show_severity && config.severity) {
      delete config.severity;
    }

    delete config.show_severity;
    delete config.green;
    delete config.yellow;
    delete config.red;

    fireEvent(this, 'config-changed', { config });
  }

  private _computeLabelCallback = (schema: SchemaUnion<ReturnType<typeof this._schema>>) => {
    switch (schema.name) {
      case 'name':
        return this.hass!.localize('ui.panel.lovelace.editor.card.generic.name');
      case 'entity':
        return `${this.hass!.localize('ui.panel.lovelace.editor.card.generic.entity')}`;
      case 'max':
        return this.hass!.localize('ui.panel.lovelace.editor.card.generic.maximum');
      case 'min':
        return this.hass!.localize('ui.panel.lovelace.editor.card.generic.minimum');
      case 'show_severity':
        return this.hass!.localize('ui.panel.lovelace.editor.card.gauge.severity.define');
      case 'needle':
        return this.hass!.localize('ui.panel.lovelace.editor.card.gauge.needle_gauge');
      case 'unit_of_measurement':
        return this.hass!.localize('ui.panel.lovelace.editor.card.generic.unit');
      case 'green':
        return this.hass!.localize(`ui.panel.lovelace.editor.card.gauge.severity.${schema.name}`);
      case 'yellow':
        return this.hass!.localize(`ui.panel.lovelace.editor.card.gauge.severity.${schema.name}`);
      case 'red':
        return this.hass!.localize(`ui.panel.lovelace.editor.card.gauge.severity.${schema.name}`);
      default:
        // "green" | "yellow" | "red"
        return localize(`ui_editor.${schema.name}`);
    }
  };

  static get styles() {
    return css`
      ha-form {
        width: 100%;
      }

      ha-icon-button {
        align-self: center;
      }

      .entities-section * {
        background-color: #f00;
      }

      .card-config {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }

      .config-header {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        width: 100%;
      }

      .config-header.sub-header {
        margin-top: 24px;
      }

      ha-icon {
        padding-bottom: 2px;
        position: relative;
        top: -4px;
        right: 1px;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'energy-gauge-bundle-card-editor': EnergyGaugeBundleCardEditor;
  }
}
