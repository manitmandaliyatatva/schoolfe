import { Component, computed, inject, OnInit, signal, effect, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { teacherStore, teacherQualificationsStore } from '../../../../admin/user/teacher/models/teacher.model';
import { teacherOtherDetailsStore } from '../../../../admin/user/teacher/models/teacher-other-details.model';
import { teacherDocumentStore, TeacherDocument, teacherDocumentBase64Store } from '../../../../admin/user/teacher/models/teacher-document.model';
import { API } from '../../../../../shared/constants/api-url';
import { TITLES } from '../../../../../shared/constants/title.constant';
import { CommonDateFormat } from '../../../../../core/constants/date-format.constant';
import { CommonHelperService } from '../../../../../core/services/common-helper.service';
import FileHelper from '../../../../../shared/helpers/file.helper';
import { UserView } from '../../../../../shared/components/user-view/user-view';
import { UserViewData } from '../../../../../shared/components/user-view/model/user-view.model';
import { SYSTEM_CONST } from '../../../../../core/constants/system.constant';
import { AuthStore } from '../../../../../core/store/auth.store';
import { GenericDialogService } from '../../../../../shared/services/generic-dialog.service';
import { Base64Document } from '../../../../../shared/models/document.model';
import CommonHelper from '../../../../../core/helpers/common-helper';

@Component({
  selector: 'common-teacher-view',
  standalone: true,
  imports: [CommonModule, UserView],
  providers: [teacherStore, teacherOtherDetailsStore, teacherDocumentStore, teacherDocumentBase64Store, teacherQualificationsStore],
  templateUrl: './teacher-view.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherView implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly teacherStore = inject(teacherStore);
  readonly otherDetailsStore = inject(teacherOtherDetailsStore);
  readonly documentStore = inject(teacherDocumentStore);
  readonly documentBase64Store = inject(teacherDocumentBase64Store);
  readonly qualificationsStore = inject(teacherQualificationsStore);
  readonly commonHelperService = inject(CommonHelperService);
  private readonly authStore = inject(AuthStore);
  private readonly genericDialogService = inject(GenericDialogService);
  permission = computed(() => this.commonHelperService.getPermissionByPage());

  readonly teacher = computed(() => this.teacherStore.data());
  readonly otherDetails = computed(() => this.otherDetailsStore.data());
  readonly documents = computed(() => this.documentStore.data());
  readonly qualifications = computed(() => this.qualificationsStore.data());
  readonly screenTitle = signal(TITLES.USER.VIEW_TEACHER);
  readonly dateFormat = CommonDateFormat.DDMMYYYY_WithSlash;
  private readonly pendingDocumentAction = signal<{ row: TeacherDocument; mode: 'download' | 'view' } | null>(null);
  private readonly isMyProfilePage = computed(
    () => !!this.route.snapshot.data['myProfile'] || !this.route.snapshot.paramMap.get('teacherId')
  );

  readonly userViewData = computed<UserViewData | null>(() => {
    const teacher = this.teacher();
    const otherDetails = this.otherDetails();
    const docs = this.documents();
    const qualifications = this.qualifications();

    if (!teacher) return null;

    return {
      title: this.screenTitle(),
      photo: teacher.photo,
      fullName: teacher.fullName || `${teacher.firstName} ${teacher.lastName}`,
      code: teacher.teacherCode,
      codeLabel: SYSTEM_CONST.LABELS.ACADEMIC.TEACHER_ID,
      statusChips: [
        {
          value: () => !!teacher.isActive
        }
      ],
      personalInfo: [
        { label: SYSTEM_CONST.LABELS.COMMON.DOB, value: teacher.dob, isDate: true },
        { label: SYSTEM_CONST.LABELS.COMMON.GENDER, value: teacher.genderName },
        { label: SYSTEM_CONST.LABELS.COMMON.PHONE_NUMBER, value: teacher.phoneNumber, isPhone: true },
        { label: SYSTEM_CONST.LABELS.COMMON.EMAIL, value: teacher.email }
      ],
      academicInfoTitle: SYSTEM_CONST.SECTIONS.PROFESSIONAL,
      academicInfo: [
        { label: SYSTEM_CONST.LABELS.ACADEMIC.SUBJECT, value: teacher.classSubjectName },
        { label: SYSTEM_CONST.LABELS.ACADEMIC.CONTRACT, value: teacher.contractTypeName },
        { label: SYSTEM_CONST.LABELS.ACADEMIC.SHIFT, value: teacher.shiftName },
        { label: SYSTEM_CONST.LABELS.ACADEMIC.LOCATION, value: teacher.workLocation },
        { label: SYSTEM_CONST.LABELS.ACADEMIC.JOINING_DATE, value: teacher.joiningDate, isDate: true },
        { label: SYSTEM_CONST.LABELS.ACADEMIC.EXPERIENCE, value: teacher.experienceYears ? teacher.experienceYears + ' Years' : null }
      ],
      addressInfo: [
        { label: SYSTEM_CONST.LABELS.ADDRESS.CURRENT, value: teacher.currentAddress },
        { label: SYSTEM_CONST.LABELS.ADDRESS.PERMANENT, value: teacher.permanentAddress }
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
          { label: SYSTEM_CONST.LABELS.BANK.NATIONAL_ID, value: otherDetails.nationalIdentificationNumber }
        ],
        bank: [
          { label: SYSTEM_CONST.LABELS.BANK.ACCOUNT_NUMBER, value: otherDetails.bankAccountNumber },
          { label: SYSTEM_CONST.LABELS.BANK.BANK_NAME, value: otherDetails.bankName },
          { label: SYSTEM_CONST.LABELS.BANK.IFSC_CODE, value: otherDetails.ifscCode }
        ]
      } : null,
      additionalTabs: qualifications && qualifications.length > 0 ? [
        {
          label: SYSTEM_CONST.SECTIONS.QUALIFICATIONS,
          cards: qualifications
            .filter(q => q.isActive !== false)
            .map(q => ({
              title: q.qualification,
              details: [
                { label: SYSTEM_CONST.LABELS.QUALIFICATION.PASSING_YEAR, value: q.passingYear },
                { label: SYSTEM_CONST.LABELS.QUALIFICATION.MARKS, value: q.marks != null ? `${q.marks}${q.isPercentage ? '%' : ' CGPA'}` : '-' },
                { label: SYSTEM_CONST.LABELS.QUALIFICATION.INSTITUTION, value: q.institutionName },
                { label: SYSTEM_CONST.LABELS.QUALIFICATION.UNIVERSITY, value: q.universityName }
              ]
            }))
        }
      ] : [],
      documents: docs ? docs.map(d => ({ id: d.teacherDocumentId, typeName: d.documentTypeName, fileName: d.documentName })) : [],
      actionButtons: [
        {
          label: SYSTEM_CONST.ACTION_BUTTONS.EDIT,
          icon: 'edit',
          callback: () => this.onEdit(),
          cssClass: 'edit-action-btn',
          isHidden: !this.permission().canUpdate || this.isMyProfilePage()
        }
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
    const teacherIdFromRoute = this.route.snapshot.paramMap.get('teacherId');
    const userId = this.authStore.userId();
    const resolvedId = teacherIdFromRoute || userId;

    if (!CommonHelper.isEmpty(resolvedId)) {
      const idParam = this.isMyProfilePage() ? { teacherId: this.authStore.entityid() } : { teacherId: resolvedId };
      this.teacherStore.getById({
        endpoint: API.ADMIN.USER.TEACHER.GET,
        params: idParam
      });
      this.otherDetailsStore.getById({
        endpoint: API.ADMIN.USER.TEACHER.OtherDetails,
        params: idParam
      });
      this.documentStore.getById({
        endpoint: API.ADMIN.USER.TEACHER.GETTEACHERDOCUMENT,
        params: idParam
      });
      this.qualificationsStore.getById({
        endpoint: API.ADMIN.USER.TEACHER.GET_QUALIFICATIONS,
        params: idParam
      });
    }
  }
  
  onDownload = (docId: string): void => {
    const doc = this.documents()?.find(d => d.teacherDocumentId === docId);
    if (!doc) return;
    this.requestDocumentAction(doc, 'download');
  }

  onView = (docId: string): void => {
    const doc = this.documents()?.find(d => d.teacherDocumentId === docId);
    if (!doc) return;
    this.requestDocumentAction(doc, 'view');
  }

  private requestDocumentAction = (row: TeacherDocument, mode: 'download' | 'view'): void => {
    if (CommonHelper.isEmpty(row.teacherDocumentId)) return;

    this.pendingDocumentAction.set({ row, mode });
    this.documentBase64Store.resetState();
    this.documentBase64Store.getById({
      endpoint: API.ADMIN.USER.TEACHER.GETTEACHERDOCUMENTBASE64,
      params: { teacherDocumentId: row.teacherDocumentId }
    });
  }

  private handleDocumentAction = (
    row: TeacherDocument,
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
    const teacher = this.teacher();
    if (teacher) {
      this.router.navigate(['admin', 'user', 'teachers', 'edit', teacher.teacherId]);
    }
  }

  onBack = (): void => {
    if (this.isMyProfilePage()) {
      const role = this.authStore.usertype()?.toLowerCase();
      this.router.navigate([`/${role}/dashboard`]);
      return;
    }
    this.router.navigate(['admin', 'user', 'teachers']);
  }

  ngOnDestroy(): void {
    this.teacherStore.resetState();
    this.otherDetailsStore.resetState();
    this.documentStore.resetState();
    this.documentBase64Store.resetState();
    this.qualificationsStore.resetState();
  }
}
