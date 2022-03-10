import { AfterViewInit, Directive, ElementRef, Input, OnChanges } from '@angular/core';
import { Voting } from '@common/models';
import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Colors } from '../../shared/util/colors';

@Directive({ selector: 'canvas[ppDoughnut]' })
export class DoughnutDirective implements AfterViewInit, OnChanges {
  @Input() voting?: Voting<true>;
  @Input() groupedVotes?: [number, number][];
  chart?: Chart;

  constructor(private chartEl: ElementRef) {
  }

  get sortedGroupedVotes() {
    return this.groupedVotes?.sort(([a], [b]) => a - b).map(v => v[1]);
  }

  ngOnChanges() {
    if (this.chart && this.sortedGroupedVotes) {
      this.chart.config.data.datasets[0].data = this.sortedGroupedVotes;
      this.chart.update();
    }
  }

  ngAfterViewInit() {
    this.chart = new Chart(this.chartEl.nativeElement.getContext('2d'), {
      type: 'doughnut',
      plugins: [ChartDataLabels],
      data: {

        datasets: [{
          data: this.sortedGroupedVotes || [],
          borderWidth: 1,
          backgroundColor: Colors,
          hoverBackgroundColor: Colors,
          hoverBorderColor: 'white',
          hoverOffset: 20,
        }],
      },
      options: {
        layout: {
          padding: 20,
        },
        // events: [],
        plugins: {
          datalabels: {
            formatter: (votesCount, { dataIndex }) => this.groupedVotes?.[dataIndex][0],
            color: 'white',
            font: { size: 14, weight: 'bold' },
          },
        },
      },
    });
  }
}
