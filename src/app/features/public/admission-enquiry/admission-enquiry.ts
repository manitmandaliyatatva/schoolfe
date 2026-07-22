import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admission-enquiry',
  imports: [CommonModule],
  templateUrl: './admission-enquiry.html',
  styleUrl: './admission-enquiry.scss',
})
export class AdmissionEnquiry {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  closeModal() {
    this.close.emit();
  }
}
