import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { Chart } from "chart.js";
import { Colors } from "../../util/colors";
import { Voting } from "@common/models";
import ChartDataLabels from 'chartjs-plugin-datalabels';

@Component({
  selector: 'pp-doughnut',
  templateUrl: './doughnut.component.html',
  styleUrls: ['./doughnut.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DoughnutComponent implements AfterViewInit {
  @ViewChild('chart') chartEl?: ElementRef<HTMLCanvasElement>;
  @Input() voting?: Voting<true>;
  @Input() groupedVotes?: [number, number][];
  chart?: Chart;

  ngOnChanges() {
    if(this.chart) {
      this.chart.config.data.datasets[0].data = this.groupedVotes!.map(v => v[1]);
      this.chart.update();
    }
  }

  ngAfterViewInit() {
    this.chart = new Chart(this.chartEl!.nativeElement.getContext('2d')!, {
      type: 'doughnut',
      plugins: [ChartDataLabels],
      data: {
        datasets: [{
          data: this.groupedVotes!.map(v => v[1]),
          borderWidth: 1,
          backgroundColor: Colors,
        }]
      },
      options: {
        events: [],
        plugins: {
          datalabels: {
            color: 'white',
            font: { size: 14, weight: 'bold' },
          }
        },
      }
    });
  }
}
