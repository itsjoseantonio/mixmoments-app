export type StatusType = 'idle' | 'loading' | 'done' | 'error';

export interface ExportStatus {
  type: StatusType;
  message: string;
}
