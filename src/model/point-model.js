import { createPoint } from '../mock/mock';

const POINT_COUNT = 3;

export default class PointModel {
  points = Array.from({length: POINT_COUNT}, createPoint);

  getPoints() {
    return this.points;
  }
}
