/* eslint-disable @typescript-eslint/no-explicit-any */

// Hack to load ha-components needed for editor
// Credits to @piitaya in lovelace-mushroom
export const loadHaComponents = async () => {
  if (!customElements.get('ha-gauge')) {
    const cardHelpers = await (window as any).loadCardHelpers();
    cardHelpers.createCardElement({ type: 'gauge' });
  }
};
