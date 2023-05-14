import { LovelaceCardConfig } from 'custom-card-helpers';
import { EnergyCardBaseConfig } from './type/energy-card-base-config';

export interface EnergyGaugeBundleCardConfig extends LovelaceCardConfig, EnergyCardBaseConfig {
  entity: string;
  needle?: boolean;
}
