import { Component, Input } from '@angular/core';

export type IconName =
  | 'whatsapp' | 'facebook' | 'instagram'
  | 'mail' | 'phone' | 'map-pin' | 'login' | 'cart'
  | 'user' | 'chevron-down'
  | 'lock' | 'eye' | 'eye-off';

@Component({
  selector: 'app-icon',
  standalone: true,
  templateUrl: './icon.html'
})
export class Icon {
  @Input({ required: true }) name!: IconName;
  @Input() size = 18;
}