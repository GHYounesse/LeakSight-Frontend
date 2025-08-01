import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeAgo',
  standalone: true  // optional if using standalone pipes
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: any): string {
    const date = new Date(value);
    const now = new Date();
    const seconds = Math.floor((+now - +date) / 1000);

    if (isNaN(seconds)) return 'Invalid date';

    const intervals: [number, string][] = [
      [60, 'second'],
      [60, 'minute'],
      [24, 'hour'],
      [7, 'day'],
      [4.345, 'week'],
      [12, 'month'],
      [Number.POSITIVE_INFINITY, 'year']
    ];

    let counter = seconds;
    for (let i = 0; i < intervals.length; i++) {
      if (counter < intervals[i][0]) {
        const unit = intervals[i][1];
        const value = Math.floor(counter);
        return `${value} ${unit}${value !== 1 ? 's' : ''} ago`;
      }
      counter = counter / intervals[i][0];
    }

    return 'some time ago';
  }
}