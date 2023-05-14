import { css } from 'lit';

export const styles = css`
  ha-card {
    cursor: pointer;
    padding: 1rem;
  }
  h1 {
    padding: 0;
    padding-bottom: 1rem;
  }
`;

export const stylesBase = css`
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
