import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [ReactiveFormsModule, MatCardModule, MatInputModule, MatButtonModule],
  templateUrl: './my-profile.html',
  styleUrls: ['./my-profile.scss'],
})
export class MyProfile {
  isEditMode = false;
  private fb = inject(FormBuilder);

  profileForm = this.fb.nonNullable.group({
    name: [{ value: 'John doe', disabled: true }, Validators.required],
    email: [
      { value: 'john.doe@example.com', disabled: true },
      [Validators.required, Validators.email],
    ],
  });

  imagePreview = 'user-default.png';

  enableEdit() {
    this.isEditMode = true;
    this.profileForm.enable();
  }

  cancelEdit() {
    this.isEditMode = false;
    this.profileForm.disable();
    this.profileForm.reset({
      name: 'John doe',
      email: 'john.doe@example.com',
    });
  }

  onImageChange(event: Event) {
    if (!this.isEditMode) return;

    const file = (event.target as HTMLInputElement)?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => (this.imagePreview = reader.result as string);
    reader.readAsDataURL(file);
  }

  save() {
    if (this.profileForm.invalid) return;

    console.log('Saved profile:', this.profileForm.getRawValue());
    this.isEditMode = false;
    this.profileForm.disable();
  }
}
