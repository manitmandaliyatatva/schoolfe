import { createGenericStore } from "../../../../../core/store/resource.store";

export interface Classroom {
  classSectionId: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  classSectionName: string;
  roomNo: number | null;
  roomCapacity: number | null;
  isActive: boolean;
}

export const CLASSROOM_CONST = {
  CLASSROOM_ID: 'Classroom ID',
  SECTION_NAME: 'Section',
  ROOM_NO: 'Room No',
  ROOM_CAPACITY: 'Room Capacity',
};

export const classroomStore = createGenericStore<Classroom>();
