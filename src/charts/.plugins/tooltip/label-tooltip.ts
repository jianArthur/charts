export class LabelTooltip {
  constructor(private tooltip: HTMLElement) {}
  public getLabelTooltipPlugin() {
    return {
      id: 'label-tooltip',
      beforeEvent: (chart: any, args: any) => {
        const event = args.event;
        const x = event.x;
        const y = event.y;

        const xAxis = chart.scales.categoryAxis;

        //const yAxis = chart.scales['y'];

        if (event.type === 'mousemove') {
          let found = false;

          let xLabel = null;
          xAxis.ticks.forEach((tick: any, index: number) => {
            const tickPosition = xAxis.getPixelForTick(index);
            console.log('tickPosition', tickPosition, x);
            if (Math.abs(tickPosition - y) < 10 && Math.abs(tickPosition - x) < 10) {
              // Adjust the sensitivity as needed
              xLabel = tick.label;
              found = true;
              console.log('xAxis====>>>>>', xAxis);
              if (this.tooltip && xLabel) {
                found = true;
                this.tooltip.style.display = 'block';
                this.tooltip.style.left = event.native.clientX + 5 + 'px';
                this.tooltip.style.top = event.native.clientY + 5 + 'px';
                this.tooltip.innerHTML = `Click here to selected`;
              }
            }
          });

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
