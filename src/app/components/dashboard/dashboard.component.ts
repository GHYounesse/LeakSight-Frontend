import { Component } from "@angular/core";
import { OtxPulseDashboardComponent } from "./otx-charts/otx-pulse-dashboard.component";
import { ThreatChartsComponent } from "./threat-charts/threat-charts.component";

@Component({
    selector: "app-dashboard",
    imports: [OtxPulseDashboardComponent,ThreatChartsComponent],
    templateUrl: "./dashboard.component.html",
    styleUrls: ["./dashboard.component.scss"]
})
export class DashboardComponent {
    // Component logic goes here
}