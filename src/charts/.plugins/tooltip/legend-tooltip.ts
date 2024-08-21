export class LegendTooltip {
  constructor(private tooltip: HTMLElement) {}
  public getLegendTooltipPlugin() {
    return {
      id: 'legend-tooltip',
      beforeEvent: (chart: any, args: any) => {
        const event = args.event;
        const { legend } = chart;
        const x = event.x;
        const y = event.y;

        const xAxis = chart.scales.categoryAxis;
        console.log('xAxis', chart.scales, xAxis);
        //const yAxis = chart.scales['y'];

        if (event.type === 'mousemove') {
          let found = false;

          // xAxis.ticks.forEach((tick: any, index: number) => {
          //   const tickPosition = xAxis.getPixelForTick(index);
          //   if (Math.abs(tickPosition - x) < 10) {
          //     // Adjust the sensitivity as needed
          //     found = true;
          //     if (this.tooltip) {
          //       found = true;
          //       this.tooltip.style.display = 'block';
          //       this.tooltip.style.left = event.native.clientX + 5 + 'px';
          //       this.tooltip.style.top = event.native.clientY + 5 + 'px';
          //     }
          //   }
          // });

          if (legend?.legendItems) {
            for (let i = 0; i < legend.legendItems.length; i++) {
              const hitBox = legend.legendHitBoxes[i];
              if (
                x >= hitBox.left &&
                x <= hitBox.left + hitBox.width &&
                y >= hitBox.top &&
                y <= hitBox.top + hitBox.height
              ) {
                found = true;
                this.tooltip.style.display = 'block';
                this.tooltip.style.left = event.native.clientX + 5 + 'px';
                this.tooltip.style.top = event.native.clientY + 5 + 'px';
                break;
              }
            }
          }

          if (!found) {
            this.tooltip.style.display = 'none';
          }
        } else {
          this.tooltip.style.display = 'none';
        }
      },
    };
  }
}
