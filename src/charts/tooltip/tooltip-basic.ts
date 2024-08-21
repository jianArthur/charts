/* eslint-disable @typescript-eslint/no-explicit-any */
import { TooltipOptions } from './tooltip.types';

export class TooltipBasic {
  static defaults: TooltipOptions = {
    fontSize: '13px',
    borderRadius: '4px',
    padding: '0.5rem 0.75rem',
    showTotal: false,
    appendToBody: false,
    zIndex: 888,
  };
}
