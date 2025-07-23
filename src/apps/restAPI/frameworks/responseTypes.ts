export class SuccessResponse<T> {
  data: T;

  constructor(data: T) {
    this.data = data;
  }
}
