import { COMPONENT_PREFIX } from '../../core';
import { DomElement, findDomElement, mergeObjects } from '../../helpers';
import { ChartData, ChartOptions } from '../../types';
import { Chart } from '../.internal';
import { TooltipBasic } from './tooltip-basic';
import { TooltipOptions } from './tooltip.types';

const TOOLTIP_ID = `${COMPONENT_PREFIX}-tooltip`;
const TOOLTIP_CLASS = TOOLTIP_ID;
export class TooltipLegend<TChart extends Chart<ChartData, ChartOptions>> extends TooltipBasic {
  private options: TooltipOptions;
  private chartOptions: ChartOptions;

  constructor(public chart: TChart, options?: TooltipOptions) {
    super();
    this.chartOptions = this.chart.options;
    this.options = mergeObjects(TooltipLegend.defaults, options || {});
  }

  getLegendTooltip(): DomElement {
    let tooltipEl = findDomElement(`.${TOOLTIP_CLASS}-legend`);
    if (tooltipEl) {
      return tooltipEl;
    }
    const tooltipLabel = this.chartOptions.legend?.tooltip?.title as string;

    tooltipEl = new DomElement('div')
      .addClass(`${TOOLTIP_CLASS}-legend`)
      .setStyle('border-radius', this.options.borderRadius)
      .setStyle('padding', this.options.padding)
      .setStyle('font-size', this.options.fontSize)
      .setStyle('background-color', this.chart.getCurrentTheme()?.tooltipBackgroundColor)
      .setStyle('color', this.chart.getCurrentTheme()?.tooltipTextColor)
      .setStyle('position', 'absolute')
      .setStyle('display', 'none')
      .setHtml(tooltipLabel);
    document.body.appendChild(tooltipEl.nativeElement);
    return tooltipEl;
  }
}
