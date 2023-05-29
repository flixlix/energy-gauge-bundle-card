/* eslint-disable @typescript-eslint/no-explicit-any */

// Hack to load ha-components needed for editor
// Credits to @piitaya in lovelace-mushroom
export const loadHaComponents = () => {
  (customElements.get('hui-gauge-card') as any)?.getConfigElement();
};
