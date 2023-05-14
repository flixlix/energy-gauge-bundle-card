import { css } from 'lit';

export const styles = css`
  :host {
    --cursor-type: 'default';
  }
  ha-card {
    height: 100%;
    overflow: hidden;
    padding: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    box-sizing: border-box;
  }
  ha-gauge {
    cursor: var(--cursor-type);
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
    right: 1rem;
    top: 1rem;
    color: var(--secondary-text-color);
  }
  simple-tooltip > span {
    font-size: 12px;
    line-height: 12px;
  }
  simple-tooltip {
    width: 80%;
    max-width: 250px;
    top: 1rem !important;
  }
`;
