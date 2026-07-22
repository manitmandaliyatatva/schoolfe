export interface ValidationDictionary {
  [key: string]: Record<string, string> | { [fieldName: string]: Record<string, string> };
}