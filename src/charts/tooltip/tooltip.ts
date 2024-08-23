/* eslint-disable @typescript-eslint/no-explicit-any */
import { CoreInteractionOptions as CJCoreInteractionOptions, TooltipModel as CJTooltipModel } from 'chart.js/auto';
import { formatNumber, isNullOrUndefined, mergeObjects } from '../../helpers';
import { DomElement } from '../../helpers/dom';
import { ChartData, ChartOptions, ChartType, CJUnknownChartType } from '../../types';
import { Chart } from '../.internal';
import {
  defaultTooltipOptions,
  getTooltipContainer,
  getTooltipElement,
  setPosition,
  TOOLTIP_CLASS,
} from './tooltip.helper';
import { PositionDirection, TooltipItem, TooltipOptions } from './tooltip.types';

export class Tooltip<TChart extends Chart<ChartData, ChartOptions>> {
  private options: TooltipOptions;
  private chartOptions: ChartOptions;

  constructor(public chart: TChart, options?: TooltipOptions) {
    this.chartOptions = this.chart.options;
    this.options = mergeObjects(defaultTooltipOptions, options || {});
  }

  toCJPlugin(): any {
    const plugin: any = {
      enabled: this.options?.useNative,
      position: 'nearest',
      usePointStyle: true,
      callbacks: {},
    };

    if (!this.options?.useNative) {
      plugin.external = this.generateTooltipHtml.bind(this);
    }

    return plugin;
  }

  toCJInteraction(isHorizontal?: boolean): CJCoreInteractionOptions {
    const interaction = {
      intersect: false,
      axis: isHorizontal ? 'y' : 'x',
      mode: 'nearest',
    };
    if (this.options.combineItems) {
      interaction.mode = 'index';
    }
    return interaction as CJCoreInteractionOptions;
  }

  generateTooltipHtml(context: any) {
    // Tooltip Element
    const { chart, tooltip } = context;
    const tooltipEl = getTooltipElement(this.options, chart.canvas.parentElement);
    const chartType = chart.config.type;

    // Hide if no tooltip
    if (tooltip.opacity === 0) {
      tooltipEl.setStyle('opacity', 0);
      return;
    }

    const tooltipContainer = getTooltipContainer(this.options, this.chart.getCurrentTheme());
    // title
    let titles: string[] = [];
    if (this.options?.title) {
      if (typeof this.options.title === 'string') {
        titles = [this.options.title];
      } else if (Array.isArray(this.options.title)) {
        titles = this.options.title;
      } else if (typeof this.options.title === 'function') {
        const titleFnResult = this.options.title(chart, tooltip);
        if (typeof titleFnResult === 'string') {
          titles = [titleFnResult];
        } else if (Array.isArray(titleFnResult)) {
          titles = titleFnResult;
        }
      }
    }

    // items
    let tooltipItems: TooltipItem[] = [];
    if (typeof this.options.items === 'function') {
      tooltipItems = this.options.items(tooltip);
    } else {
      tooltipItems = this.options.items as TooltipItem[];
    }
    if (typeof this.options.sortItems === 'function') {
      tooltipItems = this.options.sortItems(tooltipItems);
    }
    const reverse = chart?.config?.options?.plugins?.legend?.reverse ?? false;
    if (reverse) {
      tooltipItems.reverse();
    }
    const datasetLength = chart.data.datasets.length;
    const tooltipItemsLength = tooltipItems.length;

    let titleExists = false;
    const hideTitleConditionWithoutTotal =
      !this.options.showTotal &&
      JSON.stringify(tooltip.title) === JSON.stringify(titles) &&
      tooltipItemsLength === 1 &&
      datasetLength === 1;
    const hideTitleConditionWithTotal =
      this.options.showTotal && JSON.stringify(tooltip.title) === JSON.stringify(titles);
    const hideTitleOnlyForPie = this.options.showTotal && chartType === ChartType.Pie && tooltipItemsLength > 1;
    if (
      titles.length > 0 &&
      ((!hideTitleConditionWithoutTotal && !hideTitleConditionWithTotal && !hideTitleOnlyForPie) ||
        this.options.beforeBody ||
        (this.options.showTotal && this.options.totalLabel))
    ) {
      titles.forEach((title: string) => {
        tooltipContainer
          ?.newChild('div')
          .addClass(`${TOOLTIP_CLASS}-title`)
          .setStyle('font-weight', 'bold')
          .setText(this.options.formatTitle ? this.options.formatTitle(title) : title);
      });
      titleExists = true;
    }
    // beforeBody
    if (this.options.beforeBody) {
      let beforeBody = '';
      if (typeof this.options.beforeBody === 'string') {
        beforeBody = this.options.beforeBody;
      } else if (typeof this.options.beforeBody === 'function') {
        beforeBody = this.options.beforeBody(tooltip);
      }
      tooltipContainer.newChild('div').addClass(`${TOOLTIP_CLASS}-before-body`).setHtml(beforeBody);
    }
    this.addTotalElement(tooltipContainer, titles, tooltipItems, titleExists, tooltip, chart);

    tooltipItems.forEach((tooltipItem: TooltipItem) => {
      const itemEl = tooltipContainer
        ?.newChild('div')
        .addClass(`${TOOLTIP_CLASS}-item`)
        .setStyle('display', 'flex')
        .setStyle('align-items', 'center');

      if (tooltipItem.active && tooltipItemsLength > 1) {
        itemEl?.addClass('active');
      }

      // icon
      itemEl?.addChild(this.generateHtmlForIcon(tooltipItem));

      // label
      if (datasetLength === 1 && tooltipItemsLength === 1 && chartType === ChartType.Bar) {
        itemEl?.addChild(
          new DomElement('span')
            .addClass(`${TOOLTIP_CLASS}-label`)
            .setStyle('white-space', 'nowrap')
            .setHtml(this.options.formatTitle ? this.options.formatTitle(tooltip.title) : tooltip.title),
        );
      } else if (tooltipItem.label) {
        itemEl?.addChild(this.generateHtmlForLabel(tooltipItem));
      }

      // values
      itemEl?.addChild(this.generateHtmlForValues(tooltipItem, tooltip));
    });

    // AfterBody
    if (this.options.afterBody) {
      let afterBody = '';
      if (typeof this.options.afterBody === 'string') {
        afterBody = this.options.afterBody;
      } else if (typeof this.options.afterBody === 'function') {
        afterBody = this.options.afterBody(tooltip);
      }
      tooltipContainer.newChild('div').addClass(`${TOOLTIP_CLASS}-after-body`).setHtml(afterBody);
    }

    // footer
    if (this.options?.footer) {
      let footers: string[] = [];
      if (typeof this.options.footer === 'string') {
        footers = [this.options.footer];
      } else if (Array.isArray(this.options.footer)) {
        footers = this.options.footer;
      } else if (typeof this.options.footer === 'function') {
        const footerFnResult = this.options.footer(chart, tooltip);
        if (typeof footerFnResult === 'string') {
          footers = [footerFnResult];
        } else if (Array.isArray(footerFnResult)) {
          footers = footerFnResult;
        }
      }

      const footerEl = tooltipContainer
        .newChild('div')
        .addClass(`${TOOLTIP_CLASS}-footer`)
        .setStyle('text-align', 'center');
      footers.forEach((text: string) => {
        footerEl.newChild('div').setHtml(text);
      });
    }
    tooltipEl.addChild(tooltipContainer);
    this.setPosition(context, tooltip, tooltipEl);
  }

  // set the position of the tooltip dynamically
  private setPosition(context: any, tooltip: any, tooltipEl: DomElement): void {
    let left = 0;
    let top = 0;
    if (this.options.appendToBody) {
      const position = context.chart.canvas.getBoundingClientRect();
      left = position.left + window.scrollX;
      top = position.top + window.scrollY;
    }
    const styles = getComputedStyle(context.chart.canvas.parentElement);
    const parentElementPaddingTop = styles.paddingTop;
    const parentElementPaddingLeft = styles.paddingLeft;
    left += tooltip.caretX + parseFloat(parentElementPaddingLeft);
    top += tooltip.caretY + parseFloat(parentElementPaddingTop);
    // display, position, and set styles
    tooltipEl.setStyle('z-index', this.options.zIndex);
    tooltipEl.setStyle('line-height', '1.5');
    const alignKey = `${tooltip.xAlign}-${tooltip.yAlign}` as PositionDirection;
    setPosition(alignKey, tooltipEl, left, top, this.chart.getCurrentTheme());
  }

  private generateHtmlForIcon(tooltipItem: TooltipItem): DomElement {
    return new DomElement('span')
      .addClass(`${TOOLTIP_CLASS}-icon`)
      .setStyle('display', 'inline-block')
      .setStyle('margin-right', '0.25rem')
      .setStyle('width', '1em')
      .setStyle('height', '1em')
      .setStyle('background', tooltipItem.colors.backgroundColor)
      .setStyle('border-radius', '4px')
      .setStyle('border-style', 'solid')
      .setStyle(
        'border-color',
        tooltipItem.colors.backgroundColor === tooltipItem.colors.backgroundColor
          ? '#dedede66'
          : tooltipItem.colors.borderColor,
      )
      .setStyle('border-width', '1px');
  }

  // label
  private generateHtmlForLabel(tooltipItem: TooltipItem): DomElement {
    const labelText =
      typeof this.options.formatLabel === 'function' ? this.options.formatLabel(tooltipItem.label) : tooltipItem.label;
    return new DomElement('span')
      .addClass(`${TOOLTIP_CLASS}-label`)
      .setStyle('white-space', 'nowrap')
      .setHtml(labelText);
  }

  private generateHtmlForValues(tooltipItem: TooltipItem, tooltip?: CJTooltipModel<CJUnknownChartType>): DomElement {
    const valuesEl = new DomElement('span')
      .addClass(`${TOOLTIP_CLASS}-values`)
      .setStyle('flex', '1')
      .setStyle('text-align', 'right')
      .setStyle('margin-left', '0.5rem');

    // value
    if (!isNullOrUndefined(tooltipItem.value)) {
      if (typeof this.options.formatValue === 'function') {
        valuesEl.setHtml(this.options.formatValue(tooltipItem.value as number, tooltip));
      } else {
        const valueText = `<span>${formatNumber(tooltipItem.value!, this.chartOptions.valuePrecision!)}</span>${
          this.options.showUnit ? ` ` + this.chartOptions.valueUnit || '' : ''
        }`;
        valuesEl.setHtml(valueText);
        // percentage
        if (this.options.showPercentage) {
          const percentageEl = valuesEl.newChild('span').setStyle('margin-left', '0.25rem');
          if (typeof tooltipItem.percent !== 'undefined') {
            percentageEl.setText('(' + formatNumber(tooltipItem.percent, this.chartOptions.valuePrecision!) + '%)');
          }
        }
      }
    }

    return valuesEl;
  }

  private generateHtmlForTotalValue(
    tooltipItems: TooltipItem[],
    tooltip?: CJTooltipModel<CJUnknownChartType>,
  ): DomElement {
    let total = 0;
    tooltipItems.forEach((tooltipItem: TooltipItem) => {
      total = total + (tooltipItem?.value ?? 0);
    });
    const valuesEl = new DomElement('span')
      .addClass(`${TOOLTIP_CLASS}-values`)
      .setStyle('flex', '1')
      .setStyle('text-align', 'right')
      .setStyle('margin-left', '0.5rem');

    // value
    if (typeof this.options.formatValue === 'function') {
      valuesEl.setHtml(this.options.formatValue(total, tooltip));
    } else {
      const valueText = `<span>${formatNumber(total, this.chartOptions.valuePrecision!)}</span>${
        this.options.showUnit ? ` ` + this.chartOptions.valueUnit || '' : ''
      }`;
      valuesEl.setHtml(valueText);
      // percentage
      if (this.options.showPercentage) {
        valuesEl
          .newChild('span')
          .setStyle('margin-left', '0.25rem')
          .setText('(' + formatNumber(100, this.chartOptions.valuePrecision!) + '%)');
      }
    }

    return valuesEl;
  }

  private addTotalElement(
    tooltipContainer: DomElement,
    titles: string[],
    tooltipItems: TooltipItem[],
    titleExists: boolean,
    tooltip: any,
    chart: any,
  ): void {
    if (this.options.showTotal && tooltipItems.length > 1) {
      const chartType = chart.config.type;
      let titleText = '';
      // Use "," to join multiple titles together.
      if (this.options.totalLabel) {
        titleText = this.options.totalLabel;
      } else if (chartType === ChartType.Pie) {
        titleText = titles && JSON.stringify(tooltip.title) !== JSON.stringify(titles) ? titles.toString() : '';
      } else {
        titleText = tooltip.title ? tooltip.title.toString() : '';
      }
      const totalEl = new DomElement('div')
        .addClass(`${TOOLTIP_CLASS}-total`)
        .setStyle('display', 'flex')
        .setStyle('align-items', 'center');

      totalEl?.addChild(
        new DomElement('span')
          .addClass(`${TOOLTIP_CLASS}-label`)
          .setStyle('white-space', 'nowrap')
          .setStyle('font-weight', `${titleExists ? 'normal' : 'bold'}`)
          .setHtml(this.options.formatTitle ? this.options.formatTitle(titleText) : titleText),
      );

      totalEl?.addChild(this.generateHtmlForTotalValue(tooltipItems, tooltip));
      tooltipContainer.addChild(totalEl);
    }
  }
}
