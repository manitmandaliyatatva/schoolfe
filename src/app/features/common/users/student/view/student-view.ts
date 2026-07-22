import { Component, computed, inject, OnInit, signal, effect, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { studentStore } from '../../../../admin/user/student/models/student.model';
import { studentOtherDetailsStore } from '../../../../admin/user/student/models/student-other-details.model';
import { studentDocumentStore, StudentDocument, studentDocumentBase64Store } from '../../../../admin/user/student/models/student-document.model';
import { guardianStore } from '../../../../admin/user/student/models/guardian.model';
import { API } from '../../../../../shared/constants/api-url';
import { TITLES } from '../../../../../shared/constants/title.constant';
import { CommonDateFormat } from '../../../../../core/constants/date-format.constant';
import { GuardianTypeConst } from '../../../../../shared/constants/guardian-type.constant';

import FileHelper from '../../../../../shared/helpers/file.helper';
import { UserView } from '../../../../../shared/components/user-view/user-view';
import { UserViewData } from '../../../../../shared/components/user-view/model/user-view.model';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import CommonHelper from '../../../../../core/helpers/common-helper';
import { CommonHelperService } from '../../../../../core/services/common-helper.service';
import { AuthStore } from '../../../../../core/store/auth.store';
import { GenericDialogService } from '../../../../../shared/services/generic-dialog.service';
import { Base64Document } from '../../../../../shared/models/document.model';

@Component({
  selector: 'common-student-view',
  standalone: true,
  imports: [CommonModule, UserView],
  providers: [studentStore, studentOtherDetailsStore, studentDocumentStore, studentDocumentBase64Store, guardianStore],
  templateUrl: './student-view.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentView implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly commonHelperService = inject(CommonHelperService);
  private readonly authStore = inject(AuthStore);
  private readonly genericDialogService = inject(GenericDialogService);
  readonly studentStore = inject(studentStore);
  readonly otherDetailsStore = inject(studentOtherDetailsStore);
  readonly documentStore = inject(studentDocumentStore);
  readonly documentBase64Store = inject(studentDocumentBase64Store);
  readonly guardianStore = inject(guardianStore);

  readonly student = computed(() => this.studentStore.data());
  readonly otherDetails = computed(() => this.otherDetailsStore.data());
  readonly documents = computed(() => this.documentStore.data());
  readonly guardians = computed(() => this.guardianStore.data());
  readonly screenTitle = signal(TITLES.USER.VIEW_STUDENT);
  readonly dateFormat = CommonDateFormat.DDMMYYYY_WithSlash;
  private readonly pendingDocumentAction = signal<{ row: StudentDocument; mode: 'download' | 'view' } | null>(null);
  private readonly isMyProfilePage = computed(
    () => !!this.route.snapshot.data['myProfile'] || !this.route.snapshot.paramMap.get('studentId')
  );
  permission = computed(() => this.commonHelperService.getPermissionByPage());

  readonly userViewData = computed<UserViewData | null>(() => {
    const student = this.student();
    const otherDetails = this.otherDetails();
    const docs = this.documents();
    const guardiansList = this.guardians();

    if (!student || this.guardianStore.isLoading() || this.otherDetailsStore.isLoading() || this.documentStore.isLoading()) return null;

    return {
      title: this.screenTitle(),
      photo: student.photo,
      fullName: student.fullName || `${student.firstName} ${student.lastName}`,
      code: student.admissionNumber,
      codeLabel: SYSTEM_CONST.LABELS.ACADEMIC.ADMISSION_NUMBER,
      statusChips: [
        {
          value: () => !!student.isActive
        },
        {
          value: () => !!student.isSuspended,
          inactiveText: SYSTEM_CONST.LABELS.ACADEMIC.SUSPENDED,
          isHidden: () => !student.isSuspended
        }
      ],
      personalInfo: [
        { label: SYSTEM_CONST.LABELS.COMMON.DOB, value: student.dob, isDate: true },
        { label: SYSTEM_CONST.LABELS.COMMON.GENDER, value: student.genderName },
        { label: SYSTEM_CONST.LABELS.COMMON.CATEGORY, value: student.categoryName },
        { label: SYSTEM_CONST.LABELS.COMMON.PHONE_NUMBER, value: student.phoneNumber, isPhone: true },
        { label: SYSTEM_CONST.LABELS.COMMON.EMAIL, value: student.email }
      ],
      academicInfoTitle: SYSTEM_CONST.SECTIONS.ACADEMIC,
      academicInfo: [
        { label: SYSTEM_CONST.LABELS.ACADEMIC.CLASS, value: student.classSectionName ? `${student.classSectionName}` : '-' },
        { label: SYSTEM_CONST.LABELS.ACADEMIC.ROLL_NUMBER, value: student.rollNumber },
        { label: SYSTEM_CONST.LABELS.ACADEMIC.ADMISSION_DATE, value: student.admissionDate, isDate: true },
      ],
      addressInfo: [
        { label: SYSTEM_CONST.LABELS.ADDRESS.CURRENT, value: student.currentAddress },
        { label: SYSTEM_CONST.LABELS.ADDRESS.PERMANENT, value: student.permanentAddress }
      ],
      otherDetails: otherDetails ? {
        previousSchool: [
          { label: SYSTEM_CONST.LABELS.SCHOOL.PREVIOUS_NAME, value: otherDetails.previousSchoolName },
          { label: SYSTEM_CONST.LABELS.SCHOOL.PREVIOUS_ADDRESS, value: otherDetails.previousSchoolAddress }
        ],
        profile: [
          { label: SYSTEM_CONST.LABELS.MEDICAL.BLOOD_GROUP, value: otherDetails.bloodGroup },
          { label: SYSTEM_CONST.LABELS.MEDICAL.HEIGHT, value: otherDetails.height ? otherDetails.height + ' cm' : null },
          { label: SYSTEM_CONST.LABELS.MEDICAL.WEIGHT, value: otherDetails.weight ? otherDetails.weight + ' kg' : null },
        ],
        bank: [
          { label: SYSTEM_CONST.LABELS.BANK.ACCOUNT_NUMBER, value: otherDetails.bankAccountNumber },
          { label: SYSTEM_CONST.LABELS.BANK.BANK_NAME, value: otherDetails.bankName },
          { label: SYSTEM_CONST.LABELS.BANK.IFSC_CODE, value: otherDetails.ifscCode },
          { label: SYSTEM_CONST.LABELS.BANK.NATIONAL_ID, value: otherDetails.nationalIdentificationNumber }
        ]
      } : null,
      guardians: guardiansList && guardiansList.length > 0 ? guardiansList.map(g => {
        const isOther = g.guardianType === GuardianTypeConst.Other;
        const typeName = isOther ? g.guardianSubTypeName : (g.guardianTypeName || g.guardianSubTypeName);

        return {
          title: `${g.fullName || (g.firstName + ' ' + (g.lastName || ''))}${typeName ? ' (' + typeName + ')' : ''}`.trim(),
          details: [
            { label: SYSTEM_CONST.LABELS.COMMON.EMAIL, value: g.email },
            { label: SYSTEM_CONST.LABELS.COMMON.PHONE_NUMBER, value: g.phoneNumber, isPhone: true },
            { label: SYSTEM_CONST.LABELS.COMMON.OCCUPATION, value: g.occupation },
            { label: SYSTEM_CONST.LABELS.COMMON.ADDRESS, value: g.address },
          ]
        };
      }) : [],
      documents: docs ? docs.map(d => ({ id: d.studentDocumentId, typeName: d.documentTypeName, fileName: d.documentName })) : [],
      actionButtons: [
        {
          label: student.isSuspended ? SYSTEM_CONST.ACTION_BUTTONS.UNSUSPEND : SYSTEM_CONST.ACTION_BUTTONS.SUSPEND,
          icon: student.isSuspended ? 'play_arrow' : 'block',
          callback: () => student.isSuspended ? this.onUnsuspend() : this.onSuspend(),
          cssClass: student.isSuspended ? 'unsuspend-action-btn' : 'suspend-action-btn',
          isHidden: !this.permission().canUpdate || this.isMyProfilePage()
        },
        {
          label: SYSTEM_CONST.ACTION_BUTTONS.EDIT,
          icon: 'edit',
          callback: () => this.onEdit(),
          cssClass: 'edit-action-btn',
          isHidden: !this.permission().canUpdate || this.isMyProfilePage()
        },
      ],
      onBack: () => this.onBack(),
      ...(this.permission().canDownload ? { onDownload: (id: string) => this.onDownload(id) } : {}),
      onView: (id: string) => this.onView(id),
    };
  });

  constructor() {
    effect(() => {
      const perm = this.permission();
      if (!this.isMyProfilePage() && !perm.canView) {
        this.onBack();
      }
    });
    effect(() => {
      const pendingAction = this.pendingDocumentAction();
      if (!pendingAction) return;
      if (this.documentBase64Store.isLoading()) return;

      const base64Data = this.documentBase64Store.data();
      this.pendingDocumentAction.set(null);
      if (!base64Data) return;

      this.handleDocumentAction(
        pendingAction.row,
        pendingAction.mode,
        base64Data.base64,
        base64Data.contentType,
        base64Data.fileName
      );
    });
  }

  ngOnInit(): void {
    const studentIdFromRoute = this.route.snapshot.paramMap.get('studentId');
    const userId = this.authStore.userId();
    const resolvedId = studentIdFromRoute || userId;

    if (!CommonHelper.isEmpty(resolvedId)) {
      const idParam = this.isMyProfilePage() ? { studentId: this.authStore.entityid() } : { studentId: resolvedId };
      this.studentStore.getById({
        endpoint: API.ADMIN.USER.STUDENT.Get,
        params: idParam
      });
      this.otherDetailsStore.getById({
        endpoint: API.ADMIN.USER.STUDENT.OTHERDETAILS,
        params: idParam
      });
      this.documentStore.getById({
        endpoint: API.ADMIN.USER.STUDENT.GETSTUDENTDOCUMENT,
        params: idParam
      });
      this.guardianStore.getById({
        endpoint: API.ADMIN.USER.GUARDIAN.GET,
        params: idParam
      });
    }
  }



  onDownload = (docId: string): void => {
    const doc = this.documents()?.find(d => d.studentDocumentId === docId);
    if (!doc) return;
    this.requestDocumentAction(doc, 'download');
  }

  onView = (docId: string): void => {
    const doc = this.documents()?.find(d => d.studentDocumentId === docId);
    if (!doc) return;
    this.requestDocumentAction(doc, 'view');
  }

  private requestDocumentAction = (row: StudentDocument, mode: 'download' | 'view'): void => {
    if (CommonHelper.isEmpty(row.studentDocumentId)) return;

    this.pendingDocumentAction.set({ row, mode });
    this.documentBase64Store.resetState();
    this.documentBase64Store.getById({
      endpoint: API.ADMIN.USER.STUDENT.GETSTUDENTDOCUMENTBASE64,
      params: { studentDocumentId: row.studentDocumentId }
    });
  }

  private handleDocumentAction = (
    row: StudentDocument,
    mode: 'download' | 'view',
    rawBase64: string | null | undefined,
    rawMimeType?: string | null,
    rawFileName?: string | null
  ): void => {
    const normalizedBase64 = FileHelper.normalizeBase64(rawBase64);
    if (!normalizedBase64) return;

    const fileName = rawFileName || row.documentName?.trim() || `${row.documentTypeName}.pdf`;
    const contentType = FileHelper.resolveContentType(rawMimeType, fileName, rawBase64);

    if (mode === 'download') {
      FileHelper.downloadBase64(normalizedBase64, fileName, contentType);
      return;
    }

    const viewerData: Base64Document = {
      base64: normalizedBase64,
      contentType,
      fileName,
    };
    this.genericDialogService.openDocumentViewer(viewerData, fileName);
  }

  onEdit = (): void => {
    if (this.isMyProfilePage()) return;
    const student = this.student();
    if (student) {
      this.router.navigate(['admin', 'user', 'students', 'edit', student.studentId]);
    }
  }

  onSuspend = (): void => {
    // TODO: Implement suspend logic using studentStore
  }

  onUnsuspend = (): void => {
    // TODO: Implement unsuspend logic using studentStore
  }

  onBack = (): void => {
    if (this.isMyProfilePage()) {
      this.router.navigate([`/${this.authStore.roleRoutePath()}/dashboard`]);
      return;
    }
    const userType = this.authStore.roleRoutePath();
    if (userType === 'teacher') {
      this.router.navigate(['teacher', 'class-students']);
      return;
    }
    this.router.navigate(['admin', 'user', 'students']);
  }

  ngOnDestroy(): void {
    this.studentStore.resetState();
    this.otherDetailsStore.resetState();
    this.documentStore.resetState();
    this.documentBase64Store.resetState();
    this.guardianStore.resetState();
  }
}
