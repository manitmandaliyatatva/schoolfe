import { Component } from '@angular/core';
import { StudentFeeForm } from '../../../admin/fee/student-fee/form/student-fee-form';

@Component({
  selector: 'app-student-fee',
  standalone: true,
  imports: [StudentFeeForm],
  template: `<app-student-fee-form></app-student-fee-form>`,
})
export class StudentFee {}
