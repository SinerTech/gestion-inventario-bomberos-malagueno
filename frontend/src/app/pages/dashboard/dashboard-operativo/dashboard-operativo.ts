import { Component } from '@angular/core';
import { RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';

@Component({
  imports: [RouterLink, RouterOutlet, RouterLinkActive],
  selector: 'app-dashboard-operativo',
  styleUrl: './dashboard-operativo.css',
  templateUrl: './dashboard-operativo.html',
})
export class DashboardOperativo {}
