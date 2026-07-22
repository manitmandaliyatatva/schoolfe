export interface IMenuPermission {
  pageDtos: PageDto[]
  rolePermissionDtos: RolePermissionDto[]
}

export interface PageDto {
  pageId: string
  pageName: string
  pageCode: string
  url: string
  parentPageId: string
  sortOrder: number
  userTypeId: string
}

export interface RolePermissionDto {
  rolePermissionId: string
  roleId: string
  pageId: string
  parentPageId: string
  mnemonic: string
  isAllowed: boolean
}
