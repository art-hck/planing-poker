import { ActivatedRoute } from '@angular/router';

export const activatedRouteFirstChild = (route: ActivatedRoute | null | undefined): ActivatedRoute | null | undefined =>
  route?.firstChild ? activatedRouteFirstChild(route?.firstChild) : route;

