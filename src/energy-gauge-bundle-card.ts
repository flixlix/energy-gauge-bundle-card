/* eslint-disable @typescript-eslint/no-explicit-any */
import { css, CSSResultGroup, html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators';
import { HomeAssistant } from './type/home-assistant';
import { LovelaceCard } from './type/lovelace-card';
import { EnergyGaugeBundleCardConfig } from './energy-gauge-bundle-card-config';
import { registerCustomCard } from './utils/register-custom-card';
import { localize } from './localize/localize';
import { logError } from './logging';
import { styles } from './style';
import { fireEvent } from './utils/fire-event';
import { SubscribeMixin } from './energy/subscribe-mixin';
import { EnergyData, energySourcesByType, getEnergyDataCollection } from './energy';
import { UnsubscribeFunc } from 'home-assistant-js-websocket';
import { calculateStatisticsSumGrowth } from './energy/recorder';
import { mdiInformation } from '@mdi/js';
import { styleMap } from 'lit/directives/style-map';
import { formatNumber } from 'custom-card-helpers';

export const severityMap = {
  red: 'var(--error-color)',
  green: 'var(--success-color)',
  yellow: 'var(--warning-color)',
  normal: 'var(--info-color)',
};

registerCustomCard({
  type: 'energy-gauge-bundle-card',
  name: 'Energy Gauge Bundle Card',
  description: 'A collection of gauges for energy monitoring',
});
@customElement('energy-gauge-bundle-card')
export class EnergyGaugeBundleCard extends SubscribeMixin(LitElement) implements LovelaceCard {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private _config?: EnergyGaugeBundleCardConfig;

  @state() private _data?: EnergyData;

  protected hassSubscribeRequiredHostProps = ['_config'];

  public hassSubscribe(): UnsubscribeFunc[] {
    return [
      getEnergyDataCollection(this.hass!, {
        key: this._config?.collection_key,
      }).subscribe(data => {
        this._data = data;
      }),
    ];
  }

  public getCardSize(): number {
    return 4;
  }

  public setConfig(config: EnergyGaugeBundleCardConfig): void {
    this._config = config;
  }

  protected render() {
    if (!this._config || !this.hass) {
      return nothing;
    }

    if (!this._data) {
      return html`${this.hass.localize('ui.panel.lovelace.cards.energy.loading')}`;
    }

    const prefs = this._data.prefs;
    const types = energySourcesByType(prefs);

    if (!types.solar) {
      return nothing;
    }

    const totalSolarProduction =
      calculateStatisticsSumGrowth(
        this._data.stats,
        types.solar.map(source => source.stat_energy_from),
      ) ?? 0;

    const productionReturnedToGrid =
      calculateStatisticsSumGrowth(
        this._data.stats,
        types.grid![0].flow_to.map(flow => flow.stat_energy_to),
      ) ?? 0;

    const consumptionFromBattery =
      calculateStatisticsSumGrowth(
        this._data.stats,
        types.battery!.map(source => source.stat_energy_from),
      ) ?? 0;

    const productionToBattery =
      calculateStatisticsSumGrowth(
        this._data.stats,
        types.battery!.map(source => source.stat_energy_to),
      ) ?? 0;

    const consumptionFromGrid =
      calculateStatisticsSumGrowth(
        this._data.stats,
        types.grid![0].flow_from.map(flow => flow.stat_energy_from),
      ) ?? 0;

    const totalConsumption: number =
      consumptionFromBattery + consumptionFromGrid + totalSolarProduction - productionReturnedToGrid - productionToBattery;

    const selfConsumption = totalConsumption - consumptionFromGrid;

    const autarky = totalConsumption > 0 ? (selfConsumption / totalConsumption) * 100 : 0;

    const value = formatNumber(autarky, this.hass.locale);

    const tooltip = html`
      ${this.hass.localize('ui.panel.lovelace.cards.energy.solar_consumed_gauge.card_indicates_solar_energy_used')}
      <br /><br />
      ${this.hass.localize('ui.panel.lovelace.cards.energy.solar_consumed_gauge.card_indicates_solar_energy_used_charge_home_bat')}
    `;

    const autarkyCard = this._config?.autarky_card;

    return html`
      <ha-card>
        ${value !== undefined
          ? html`
              <ha-svg-icon id="info" .path=${mdiInformation}></ha-svg-icon>
              <simple-tooltip animation-delay="0" for="info" position="left"> <span>${tooltip}</span> </simple-tooltip>
              <ha-gauge
                min=${autarkyCard?.min || '0'}
                max=${autarkyCard?.max || '100'}
                .value=${autarky}
                .locale=${this.hass.locale}
                .needle=${this._config.needle || autarkyCard?.needle || false}
                .levels=${this._config!.needle ? this._severityLevels() : undefined}
                label=${this._config.unit || autarkyCard?.label || ''}
                style=${styleMap({
                  '--gauge-color': this._computeSeverity(autarky),
                })}
              ></ha-gauge>
              <div class="name">${'Autarky'}</div>
            `
          : totalSolarProduction === 0
          ? this.hass.localize('ui.panel.lovelace.cards.energy.solar_consumed_gauge.not_produced_solar_energy')
          : this.hass.localize('ui.panel.lovelace.cards.energy.solar_consumed_gauge.self_consumed_solar_could_not_calc')}
      </ha-card>
    `;
  }

  private _severityLevels() {
    // new format
    const segments = this._config!.segments;
    if (segments) {
      return segments.map(segment => ({
        level: segment?.from,
        stroke: segment?.color,
        label: segment?.label,
      }));
    }

    // old format
    const sections = this._config!.severity;

    if (!sections) {
      return [{ level: 0, stroke: severityMap.normal }];
    }

    const sectionsArray = Object.keys(sections);
    return sectionsArray.map(severity => ({
      level: sections[severity],
      stroke: severityMap[severity],
    }));
  }

  private _computeSeverity(numberValue: number): string | undefined {
    if (this._config!.needle) {
      return undefined;
    }

    // new format
    let segments = this._config!.segments;
    if (segments) {
      segments = [...segments].sort((a, b) => a.from - b.from);

      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        if (segment && numberValue >= segment.from && (i + 1 === segments.length || numberValue < segments[i + 1]?.from)) {
          return segment.color;
        }
      }
      return severityMap.normal;
    }

    // old format
    const sections = this._config!.severity;

    if (!sections) {
      return severityMap.normal;
    }

    const sectionsArray = Object.keys(sections);
    const sortable = sectionsArray.map(severity => [severity, sections[severity]]);

    for (const severity of sortable) {
      if (severityMap[severity[0]] == null || isNaN(severity[1])) {
        return severityMap.normal;
      }
    }
    sortable.sort((a, b) => a[1] - b[1]);

    if (numberValue >= sortable[0][1] && numberValue < sortable[1][1]) {
      return severityMap[sortable[0][0]];
    }
    if (numberValue >= sortable[1][1] && numberValue < sortable[2][1]) {
      return severityMap[sortable[1][0]];
    }
    if (numberValue >= sortable[2][1]) {
      return severityMap[sortable[2][0]];
    }
    return severityMap.normal;
  }

  static get styles(): CSSResultGroup {
    return css`
      ha-card {
        height: 100%;
        overflow: hidden;
        padding: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        box-sizing: border-box;
      }

      ha-gauge {
        width: 100%;
        max-width: 250px;
        direction: ltr;
      }

      .name {
        text-align: center;
        line-height: initial;
        color: var(--primary-text-color);
        width: 100%;
        font-size: 15px;
        margin-top: 8px;
      }

      ha-svg-icon {
        position: absolute;
        right: 4px;
        top: 4px;
        color: var(--secondary-text-color);
      }
      simple-tooltip > span {
        font-size: 12px;
        line-height: 12px;
      }
      simple-tooltip {
        width: 80%;
        max-width: 250px;
        top: 8px !important;
      }
    `;
  }
}
declare global {
  interface HTMLElementTagNameMap {
    'energy-gauge-bundle-card': EnergyGaugeBundleCard;
  }
}
