import {humanizeDate} from '../utils/utils.js';
import {DATE_FORMAT} from '../const.js';

const createInfoTemplate = (travelPoints, smallPoints, userPrice) => {
  const {destinations, points} = travelPoints;

  if(!smallPoints) {
    destinations.splice(1, 1);
  }

  const titlePoints = destinations.length ?
    destinations.map((item, index) => {
      if (destinations.length === 3 && index !== destinations.length - 1) {
        return `${item.name} &mdash; `;
      }

      if (index === 0 && smallPoints && destinations.length === 2) {
        return `${item.name} &mdash; `;
      }

      if(index !== destinations.length - 1 && !smallPoints && destinations.length === 2) {
        return `${item.name} &mdash; ... &mdash; `;
      }

      return `${item.name}`;

    }).join('')
    : '';

  const getDateInfo = () => {
    if(points.length === 3) {
      points.splice(1, 1);
    }

    if (points.length === 1) {
      const dateA = humanizeDate(points[0].dateFrom, DATE_FORMAT.MONTH_DAY);
      const dateB = humanizeDate(points[0].dateTo, DATE_FORMAT.MONTH_DAY);

      return `${dateA} &mdash; ${dateB}`;
    }

    const datesPoints = points.length ?
      points.map((item, index) => {
        if(index === points.length - 1) {
          return `${humanizeDate(item.dateTo, DATE_FORMAT.MONTH_DAY)}`;
        }
        return `${humanizeDate(item.dateFrom, DATE_FORMAT.MONTH_DAY)} &mdash; `;
      }).join('')
      : '';

    return datesPoints;
  };

  return `
    <section class="trip-main__trip-info  trip-info">
      <div class="trip-info__main">
        <h1 class="trip-info__title">${titlePoints}</h1>
          <p class="trip-info__dates">${getDateInfo()}</p>
      </div>
      ${userPrice ?
    `<p class="trip-info__cost">
        Total: &euro;&nbsp;
        <span class="trip-info__cost-value"> ${userPrice}</span>
      </p>`
    : ''}
    </section>
  `;
};

export {createInfoTemplate};
