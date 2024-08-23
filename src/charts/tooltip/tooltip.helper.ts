/* eslint-disable @typescript-eslint/no-explicit-any */
import { COMPONENT_PREFIX, Theme } from '../../core';
import { DomElement, findDomElement, mergeObjects } from '../../helpers';
import { Position } from '../../types';
import { TooltipPositions } from './tooltip.style';
import { PositionDirection, TooltipOptions } from './tooltip.types';

export const TOOLTIP_ID = `${COMPONENT_PREFIX}-tooltip`;
export const TOOLTIP_CLASS = TOOLTIP_ID;
export const defaultTooltipOptions: TooltipOptions = {
  fontSize: '13px',
  borderRadius: '4px',
  padding: '0.5rem 0.75rem',
  showTotal: false,
  appendToBody: false,
  zIndex: 888,
};

export function initTooltip(options: TooltipOptions, theme: Theme, chart: any, target: any): DomElement {
  const tooltip = getTooltipElement(options, chart.canvas.parentElement);
  const tooltipContainer = getTooltipContainer(mergeObjects(defaultTooltipOptions, options || {}), theme);
  if (options?.title) {
    let titles: string[] = [];
    if (typeof options.title === 'string') {
      titles = [options.title];
    } else if (Array.isArray(options.title)) {
      titles = options.title;
    } else if (typeof options.title === 'function') {
      const titleFnResult = options.title(chart, target);
      if (typeof titleFnResult === 'string') {
        titles = [titleFnResult];
      } else if (Array.isArray(titleFnResult)) {
        titles = titleFnResult;
      }
    }
    titles.forEach((title: string) => {
      tooltipContainer
        ?.newChild('div')
        .addClass(`${TOOLTIP_CLASS}-title`)
        .setStyle('font-weight', 'bold')
        .setText(options.formatTitle ? options.formatTitle(title) : title);
    });
  }

  if (options.body) {
    let body = '';
    if (typeof options.body === 'string') {
      body = options.body;
    } else if (typeof options.body === 'function') {
      body = options.body(chart, target);
    }
    tooltipContainer.newChild('div').addClass(`${TOOLTIP_CLASS}-body`).setHtml(body);
  }

  if (options?.footer) {
    let footers: string[] = [];
    if (typeof options.footer === 'string') {
      footers = [options.footer];
    } else if (Array.isArray(options.footer)) {
      footers = options.footer;
    } else if (typeof options.footer === 'function') {
      const footerFnResult = options.footer(chart, target);
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
  tooltip.addChild(tooltipContainer);
  return tooltip;
}

export function getTooltipElement(options: TooltipOptions, parentElement: HTMLElement): DomElement {
  let tooltipEl: DomElement | null;
  if (options?.appendToBody) {
    tooltipEl = findDomElement(`#${TOOLTIP_ID}`);
  } else {
    tooltipEl = findDomElement(`.${TOOLTIP_ID}`, parentElement);
  }

  // Create element on first render
  if (!tooltipEl) {
    tooltipEl = new DomElement('div')
      .addClass(`${TOOLTIP_CLASS}`)
      .setStyle('opacity', 0)
      .setStyle('pointer-events', 'none')
      .setStyle('position', 'absolute')
      .setStyle('transition', 'all .1s ease');
    if (options?.appendToBody) {
      tooltipEl.setAttribute('id', TOOLTIP_ID).appendToBody();
    } else {
      tooltipEl.appendTo(parentElement);
    }
    if (options?.maxWidth) {
      tooltipEl.setStyle('max-width', options.maxWidth);
    }
    if (options?.minWidth) {
      tooltipEl.setStyle('min-width', options.minWidth);
    }
    tooltipEl.setStyle('z-index', options.zIndex);
  }

  tooltipEl.clearChildren();
  tooltipEl.setStyle('opacity', 0);
  tooltipEl.addChild(
    new DomElement('div')
      .addClass(`${TOOLTIP_CLASS}-arrow`)
      .setStyle('position', 'absolute')
      .setStyle('border-style', 'solid')
      .setStyle('border-color', 'transparent')
      .setStyle('border-width', '6px'),
  );
  tooltipEl.setStyle('line-height', '1.5');
  return tooltipEl;
}

export function getTooltipContainer(options: TooltipOptions, theme: Theme): DomElement {
  return new DomElement('div')
    .addClass(`${TOOLTIP_CLASS}-container`)
    .setStyle('border-radius', options.borderRadius)
    .setStyle('padding', options.padding)
    .setStyle('font-size', options.fontSize)
    .setStyle('background-color', theme?.tooltipBackgroundColor)
    .setStyle('color', theme?.tooltipTextColor);
}

export function getTooltipBody(options: TooltipOptions, chart: any, item?: any): DomElement {
  const bodyEle = new DomElement('div').addClass(`${TOOLTIP_CLASS}-body`);
  let bodyList: string[] = [];
  if (typeof options.body === 'string') {
    bodyList = [options.body];
  } else if (Array.isArray(options.body)) {
    bodyList = options.body;
  } else if (typeof options.body === 'function') {
    const bodyFnResult = options.body(chart, item);
    if (typeof bodyFnResult === 'string') {
      bodyList = [bodyFnResult];
    } else if (Array.isArray(bodyFnResult)) {
      bodyList = bodyFnResult;
    }
  }

  bodyList.forEach((text: string) => {
    bodyEle.newChild('div').setHtml(text);
  });
  return bodyEle;
}

export function setPosition(
  alignKey: PositionDirection,
  tooltipEl: DomElement,
  left: number,
  top: number,
  theme: Theme,
): void {
  const arrowEl = findDomElement(`.${TOOLTIP_CLASS}-arrow`, tooltipEl.nativeElement);
  const currentPosition = TooltipPositions[alignKey];
  // Remove caret position
  Object.values(PositionDirection).forEach((direction) => {
    tooltipEl.removeClass(direction);
  });
  if (currentPosition) {
    // Set caret position
    tooltipEl.addClass(alignKey);
    if (arrowEl && currentPosition.arrow) {
      Object.entries(TooltipPositions[alignKey].arrow as { [key: string]: string }).forEach(([key, value]) => {
        if (key === 'borderDirection') {
          arrowEl.setStyle('border-' + value + '-color', theme?.tooltipBackgroundColor);
        } else {
          arrowEl.setStyle(key, value);
        }
      });
    }
    tooltipEl.setStyle('transform', currentPosition.transform);
  } else {
    tooltipEl.addClass('no-transform');
  }
  tooltipEl.setStyle('left', left + 'px');
  tooltipEl.setStyle('top', top + 'px');
  tooltipEl.setStyle('opacity', '1');
}

export function getPositionDirection(position?: Position): PositionDirection {
  if (position === Position.Right) {
    return PositionDirection.RightCenter;
  } else if (position === Position.Left) {
    return PositionDirection.LeftCenter;
  } else if (position === Position.Top) {
    return PositionDirection.CenterTop;
  } else {
    return PositionDirection.CenterBottom;
  }
}
