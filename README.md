# Energy Gauge Bundle Card

![GitHub release (latest by date)](https://img.shields.io/github/v/release/flixlix/energy-gauge-bundle-card?style=flat-square)
[![ko-fi support](https://img.shields.io/badge/support-me-ff5e5b?style=flat-square&logo=ko-fi)](https://ko-fi.com/flixlix)
![commit_activity](https://img.shields.io/github/commit-activity/y/flixlix/energy-gauge-bundle-card?color=brightgreen&label=Commits&style=flat-square)

![Hero Image](https://github.com/flixlix/energy-gauge-bundle-card/assets/61006057/f18357b2-e42e-4a98-b429-ad44f18399ab)

## Goal

This card aims to offer a customizable gauge visualization for Home Assistant that displays various types of information, such as "autarky" or "self-consumption". If you have a new idea on a new `gauge type` feel free to submit a Feature Request, explaining the new type, or even better, a Pull Request, implementing this type.

> What's the difference from this card to the official Gauge Card?

Compared to the original Gauge Card, the main advantages of this card are its customizability and the ability to sync with the energy date selection, ensuring dynamic information updates over different periods of time. Most important of all, this card shows different types of information, that are otherwise simply not accessible from the official cards.

## Recommendation

If you would like to customize the Energy period selector and its dates, I recommend using this card: [Energy Period Selector Plus](https://github.com/flixlix/energy-period-selector-plus)

## Install

### HACS (recommended)

This card is not direclty available in [HACS](https://hacs.xyz/) (Home Assistant Community Store), but can be added using "Custom Repositories".
_HACS is a third party community store and is not included in Home Assistant out of the box._
To install this:

- Go to HACS
- Click on `Frontend`
- Click on the overflow Menu (three vertical dots)
- Click on `Custom Repositories`
- Type this URL [https://github.com/flixlix/energy-gauge-bundle-card](https://github.com/flixlix/energy-gauge-bundle-card)
- In "Category", select `lovelace`
- Install via UI

<details>  <summary>Manual Install</summary>

1. Download and copy `energy-gauge-bundle-card.js` from the [latest release](https://github.com/flixlix/energy-gauge-bundle-card/releases/latest) into your `config/www` directory.

2. Add the resource reference as decribed below.

### Add resource reference

If you configure Dashboards via YAML, add a reference to `energy-gauge-bundle-card.js` inside your `configuration.yaml`:

```yaml
resources:
  - url: /local/energy-gauge-bundle-card.js
    type: module
```

Else, if you prefer the graphical editor, use the menu to add the resource:

1. Make sure, advanced mode is enabled in your user profile (click on your user name to get there)
2. Navigate to Settings -> Dashboards
3. Click three dot icon
4. Select Resources
5. Hit (+ ADD RESOURCE) icon
6. Enter URL `/local/energy-gauge-bundle-card.js` and select type "JavaScript Module".
   (Use `/hacsfiles/energy-gauge-bundle-card/energy-gauge-bundle-card.js` and select "JavaScript Module" for HACS install if HACS didn't do it already)
 
</details>
   
## Using the card

To configure this card, only the type is required, making it very easy to get started.

🥳 This card also features a built-in ui editor, making it even easier to configure the card. 🥳


### Options

#### Card options

| Name                | Type      |   Default    | Description                                                                                                                                                                  |
|---------------------| --------- |:------------:|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| type                | `string`  | **required** | `custom:energy-gauge-bundle-card`. |
| title               | `string`  | undefined    | The title of the card. |
| entity     | `string`  | undefined | Any entity in your HA. Note that this will only be used for to open the more info dialog on a tap. |
| clickable | `boolean` | false | If set to `true`, the card will be clickable and open the more info dialog on a tap. |
| min | `number` | 0 | The minimum value of the gauge. |
| max | `number` | 100 | The maximum value of the gauge. |
| unit_of_measurement | `string` | undefined | The unit of measurement of the gauge. |
| needle | `boolean` | false | If set to `true`, a needle will be displayed. |
| severity | `object` | undefined | An object containing the severity levels of the gauge. Check [Severity Configuration](#severity) for more info. |
| decimals | `number` | 1 | The number of decimals to display. |
| name | `string` | undefined | The name of the gauge. Will be displayed below the value. |
| tooltip | `string` | auto | The text for thetooltip of the gauge. Will be displayed on hover. |
| show | `object` | undefined | An object containing the configuration for the gauge. Check [Show Configuration](#show) for more info. |

#### Severity

| Name                | Type      |   Default    | Description                                                                                                                                                                  |
|---------------------| --------- |:------------:|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| red                 | `number`  | undefined    | The value at which the gauge will be red. |
| yellow              | `number`  | undefined    | The value at which the gauge will be yellow. |
| green               | `number`  | undefined    | The value at which the gauge will be green. |
| normal              | `number`  | undefined    | The value at which the gauge will be normal. |

#### Show

| Name                | Type      |   Default    | Description                                                                                                                                                                  |
|---------------------| --------- |:------------:|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| name               | `boolean` | true         | If set to `true`, the name will be displayed. |
| tooltip            | `boolean` | true         | If set to `true`, the tooltip and the icon for the tooltip will be displayed. |



### Example Configurations

<img width="1322" alt="Basic Configuration" src="https://github.com/flixlix/energy-gauge-bundle-card/assets/61006057/1fabb3c5-75bd-4255-8d7c-df1681f8c2f5">

```yaml
type: custom:energy-gauge-bundle-card
```
<hr/>
<img width="1322" alt="Self Consumption Without Severity (All Values at Max)" src="https://github.com/flixlix/energy-gauge-bundle-card/assets/61006057/1d5b0dc7-76a0-464d-ae26-6e06715a9f92">

```yaml
type: custom:energy-gauge-bundle-card
gauge_type: self_consumption
needle: true
min: 0
max: 100
decimals: 1
show:
  name: true
  tooltip: false
severity:
  green: 100
  yellow: 100
  red: 100
```

