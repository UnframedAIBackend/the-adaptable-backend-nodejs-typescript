import {BaseEntity} from "@core/database/BaseEntity";

export class Note extends BaseEntity {
  content: string;
  timesSent: number;
}
