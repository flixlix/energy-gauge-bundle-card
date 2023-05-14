/* eslint-disable @typescript-eslint/no-explicit-any */
import { css, CSSResultGroup, html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators';
import { HomeAssistant } from './type/home-assistant';
import { LovelaceCard } from './type/lovelace-card';
import { EnergyGaugeBundleCardConfig, Severities } from './energy-gauge-bundle-card-config';
import { registerCustomCard } from './utils/register-custom-card';
import { SubscribeMixin } from './energy/subscribe-mixin';
import { EnergyData, energySourcesByType, getEnergyDataCollection } from './energy';
import { UnsubscribeFunc } from 'home-assistant-js-websocket';
import { calculateStatisticsSumGrowth } from './energy/recorder';
import { mdiInformation } from '@mdi/js';
import { styleMap } from 'lit/directives/style-map';
import { formatNumber, LovelaceCardEditor } from 'custom-card-helpers';
import { fireEvent } from './utils/fire-event';
import { styles } from './style';
import { GaugeInfo } from './types';
import { localize } from './localize/localize';

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

  @state() private min = 0;
  @state() private max = 100;
  @state() private value?: number;
  @state() private needle = false;
  @state() private unit_of_measurement = '%'; // set default unit of measurement to %
  @state() private severity?: Severities;
  @state() private decimals = 1;
  @state() private name?: string;
  @state() private tooltip?: string;

  protected hassSubscribeRequiredHostProps = ['_config'];

  public connectedCallback() {
    super.connectedCallback();
  }

  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import('./ui-editor/ui-editor');
    return document.createElement('energy-gauge-bundle-card-editor');
  }

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

    if ((!types.solar && !types.battery) || !types.grid) {
      return nothing;
    }

    const totalSolarProduction =
      (types.solar &&
        calculateStatisticsSumGrowth(
          this._data.stats,
          types.solar.map(source => source.stat_energy_from),
        )) ??
      0;

    const productionReturnedToGrid =
      calculateStatisticsSumGrowth(
        this._data.stats,
        types.grid[0].flow_to.map(flow => flow.stat_energy_to),
      ) ?? 0;

    const consumptionFromBattery =
      (types.battery &&
        calculateStatisticsSumGrowth(
          this._data.stats,
          types.battery.map(source => source.stat_energy_from),
        )) ??
      0;

    const productionToBattery =
      (types.battery &&
        calculateStatisticsSumGrowth(
          this._data.stats,
          types.battery.map(source => source.stat_energy_to),
        )) ??
      0;

    const consumptionFromGrid =
      calculateStatisticsSumGrowth(
        this._data.stats,
        types.grid[0].flow_from.map(flow => flow.stat_energy_from),
      ) ?? 0;

    const totalConsumption: number =
      consumptionFromBattery + consumptionFromGrid + totalSolarProduction - productionReturnedToGrid - productionToBattery;

    const selfConsumption = totalConsumption - consumptionFromGrid;

    const autarky = totalConsumption > 0 ? (selfConsumption / totalConsumption) * 100 : 0;

    const consumedSolar = Math.max(0, totalSolarProduction - productionReturnedToGrid);

    const selfConsumptionPercentage = totalSolarProduction > 0 ? (consumedSolar / totalSolarProduction) * 100 : 0;

    const autarkyType = {
      value: autarky,
      name: localize('gauge_name.autarky'),
      tooltip: localize('tooltip.autarky'),
      needle: true,
      severity: {
        green: 70,
        yellow: 30,
        red: 0,
      },
    };

    const selfConsumptionType = {
      value: selfConsumptionPercentage,
      name: localize('gauge_name.self_consumption'),
      tooltip: localize('tooltip.self_consumption'),
      severity: {
        green: 70,
        yellow: 30,
        red: 0,
      },
    };

    switch (this._config.gauge_type) {
      case 'self_consumption':
        for (const i in selfConsumptionType) {
          this[i] = selfConsumptionType[i];
        }
        break;
      default: // default to autarky
        for (const i in autarkyType) {
          this[i] = autarkyType[i];
        }
    }

    let k: keyof EnergyGaugeBundleCardConfig;
    // Override defaults with possible config values
    for (k in this._config) {
      if (k in this) {
        this[k] = this._config[k];
      }
    }

    this.style.setProperty('--cursor-type', this._config.clickable ? 'pointer' : 'default');
    return html`
      <ha-card .header=${this._config.title}>
        ${this.value !== undefined
          ? html`
              ${this._config.show?.tooltip !== false
                ? html`
                    <ha-svg-icon id="info" .path=${mdiInformation}></ha-svg-icon>
                    <simple-tooltip animation-delay="0" for="info" position="left"> <span>${this.tooltip}</span> </simple-tooltip>
                  `
                : nothing}
              <ha-gauge
                @click=${this._handleClick}
                .locale=${this.hass.locale}
                min=${this.min}
                max=${this.max}
                .value=${this.value}
                label=${this.unit_of_measurement}
                .valueText=${formatNumber(this.value, this.hass.locale, {
                  maximumFractionDigits: this._config?.decimals ?? this?.decimals,
                })}
                .needle=${this.needle}
                .levels=${this.needle ? this._severityLevels(this.severity) : undefined}
                style=${styleMap({
                  '--gauge-color': this._computeSeverity(autarky, this.severity),
                })}
              ></ha-gauge>
              ${this._config.show?.name !== false ? html` <div class="name">${this.name}</div>` : nothing}
            `
          : totalSolarProduction === 0
          ? this.hass.localize('ui.panel.lovelace.cards.energy.solar_consumed_gauge.not_produced_solar_energy')
          : this.hass.localize('ui.panel.lovelace.cards.energy.solar_consumed_gauge.self_consumed_solar_could_not_calc')}
      </ha-card>
    `;
  }

  // in case user wants a clickable card, we need to handle the click
  private _handleClick(): void {
    if (this._config?.clickable && this._config.entity) fireEvent(this, 'hass-more-info', { entityId: this._config!.entity });
  }

  // used for the needle gauge
  private _severityLevels(defaultSeverity?: Severities) {
    const sections = this._config!.severity || defaultSeverity;

    if (!sections) {
      return [{ level: 0, stroke: severityMap.normal }];
    }

    const sectionsArray = Object.keys(sections);
    return sectionsArray.map(severity => ({
      level: sections[severity],
      stroke: severityMap[severity],
    }));
  }

  // used for the normal gauge
  private _computeSeverity(numberValue: number, defaultSeverity?: Severities): string | undefined {
    if (this._config!.needle) {
      return undefined;
    }

    const sections = this._config!.severity || defaultSeverity;

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

  static styles = styles;
}
declare global {
  interface HTMLElementTagNameMap {
    'energy-gauge-bundle-card': EnergyGaugeBundleCard;
  }
}
