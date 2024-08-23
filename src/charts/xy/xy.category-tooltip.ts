import { Chart as CJ, ChartEvent as CJChartEvent, LabelItem, Plugin, Scale } from 'chart.js/auto';
import { DomElement } from '../../helpers';
import { ChartData, ChartOptions, ChartType, HitBox, HitBoxSizes, Position } from '../../types';
import { Chart } from '../.internal';
import { getPositionDirection, initTooltip, setPosition } from '../tooltip/tooltip.helper';
import { ScaleKeys, XYChartOptions } from './xy.types';

export class CategoryLabelTooltip<TChart extends Chart<ChartData, ChartOptions>> {
  private hitBoxes: HitBox[] = [];
  private labelSizes: HitBoxSizes = {
    widths: [],
    heights: [],
  };
  private tooltipElement: DomElement | null = null;
  constructor(public chart: TChart) {}

  toCJPlugin(): Plugin {
    return {
      id: 'categoryLabelTooltip',
      start: () => {},
      beforeInit: () => {},
      afterRender: (chart: CJ<ChartType.Bar | ChartType.Line>) => {
        this.initHitBoxes(chart);
      },
      afterEvent: (
        chart: CJ<ChartType.Bar | ChartType.Line>,
        event: {
          event: CJChartEvent;
          replay: boolean;
          changed?: boolean | undefined;
          cancelable: false;
          inChartArea: boolean;
        },
      ) => {
        const { type, x, y } = event.event;
        if (type == 'mousemove' && typeof x === 'number' && typeof y === 'number') {
          const categoryScale = Object.values(chart.scales).find((scale) => scale.id === ScaleKeys.CategoryAxis);
          if (!categoryScale) {
            return;
          }
          const hitBox = this.getHitBoxByXY(x, y);
          if (!hitBox) {
            return;
          }
          this.hoverLabel(categoryScale.position as Position, hitBox);
        } else if (type == 'mouseout') {
          this.leaveLabel();
        }
      },
    };
  }

  private getLabelHitBoxes(scales: Scale): HitBox[] {
    const hitBoxes: HitBox[] = [];
    scales.getLabelItems().forEach((labelItem: LabelItem, i) => {
      const translation = labelItem.options.translation ?? [0, 0];
      const hitBox = {
        left: translation[0],
        top: translation[1],
        text: labelItem.label,
        index: i,
      } as HitBox;
      if (scales.position === Position.Left) {
        hitBox.rect = {
          x: translation[0] - this.labelSizes.widths[i],
          x2: translation[0],
          y: translation[1] - this.labelSizes.heights[i] / 2,
          y2: translation[1] + this.labelSizes.heights[i] / 2,
        };
      } else if (scales.position === Position.Right) {
        hitBox.rect = {
          x: translation[0],
          x2: translation[0] + this.labelSizes.widths[i],
          y: translation[1] - this.labelSizes.heights[i] / 2,
          y2: translation[1] + this.labelSizes.heights[i] / 2,
        };
      } else if (scales.position === Position.Top) {
        hitBox.rect = {
          x: translation[0] - this.labelSizes.widths[i] / 2,
          x2: translation[0] + this.labelSizes.widths[i] / 2,
          y: translation[1] - this.labelSizes.heights[i],
          y2: translation[1],
        };
      } else if (scales.position === Position.Bottom) {
        hitBox.rect = {
          x: translation[0] - this.labelSizes.widths[i] / 2,
          x2: translation[0] + this.labelSizes.widths[i] / 2,
          y: translation[1],
          y2: translation[1] + this.labelSizes.heights[i],
        };
      }
      hitBoxes.push(hitBox);
    });

    return hitBoxes;
  }
  private hoverLabel(position: Position, hitBox: HitBox): void {
    const chart = this.chart.api;
    const parentElement = chart?.canvas.parentElement;
    const tooltipOptions = (this.chart.options as XYChartOptions).categoryAxis?.labelTooltip;
    if (tooltipOptions && parentElement) {
      const tooltipEl = initTooltip(tooltipOptions, this.chart.getCurrentTheme(), chart, hitBox);
      setPosition(
        getPositionDirection(position as Position),
        tooltipEl,
        hitBox.left,
        hitBox.top,
        this.chart.getCurrentTheme(),
      );
      this.tooltipElement = tooltipEl;
    }
  }

  private leaveLabel(): void {
    this.tooltipElement?.setStyle('opacity', 0);
  }

  private initHitBoxes(chart: CJ<ChartType.Bar | ChartType.Line>): void {
    if (chart.scales && this.hitBoxes.length === 0) {
      const categoryScale = Object.values(chart.scales).find((scale) => scale.id === ScaleKeys.CategoryAxis);
      if (categoryScale) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.labelSizes = (categoryScale as any)._getLabelSizes() as HitBoxSizes;
        this.hitBoxes = this.getLabelHitBoxes(categoryScale);
      }
    }
  }

  private getHitBoxByXY(x: number, y: number): HitBox | null {
    let res: HitBox | null = null;
    this.hitBoxes.forEach((hitBox) => {
      const rect = hitBox.rect;
      if (x > rect.x && x < rect.x2 && y > rect.y && y < rect.y2) {
        res = hitBox;
      }
    });
    return res;
  }
}
