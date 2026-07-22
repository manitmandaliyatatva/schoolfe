import { CommonModule } from '@angular/common';
import { Component, EventEmitter, input, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-file-input',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, MatInputModule, MatIconModule],
  templateUrl: './file-input.html',
  styleUrls: ['./file-input.scss'],
})
export class FileInput {
  control = input.required<FormControl>();
  label = input<string>('');
  controlName = input.required<string>();
  fileName = input<string>('');
  accept = input<string>('');

  @Output() fileSelected = new EventEmitter<{
    event: Event;
    controlName: string;
  }>();

  onFileChange(event: Event) {
    this.fileSelected.emit({
      event,
      controlName: this.controlName(),
    });
  }
}
