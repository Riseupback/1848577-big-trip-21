import {render, remove, RenderPosition} from '../framework/render.js';
import UiBlocker from '../framework/ui-blocker/ui-blocker.js';
import TripListView from '../view/trip-list-view.js';
import SortView from '../view/sort-view.js';
import PointListAbsenceView from '../view/point-list-absence-view.js';
import LoadingView from '../view/loading-view.js';
import PointPresenter from './point-presenter.js';
import NewPointPresenter from './new-point-presenter.js';
import {SortType, AvailableSortType, FilterType, UserAction, UpdateType} from '../const.js';
import {sort} from '../utils/sort.js';
import {filter} from '../utils//filter.js';

const TimeLimit = {
  LOWER_LIMIT: 350,
  UPPER_LIMIT: 1000
};

export default class BigTripPresenter {
  #pointContainer = null;

  #pointsModel = null;
  #offersModel = null;
  #destinationsModel = null;
  #filterModel = null;
  #newEventButtonModel = null;

  #tripListComponent = new TripListView();
  #loadingComponent = new LoadingView();
  #sortComponent = null;
  #pointListAbsenceComponent = null;

  #newPointPresenter = null;
  #pointPresenters = new Map();

  #currentSortType = SortType.DAY;
  #filterType = FilterType.EVERYTHING;
  #isLoading = true;
  #isCreating = false;
  #uiBlocker = new UiBlocker({
    lowerLimit: TimeLimit.LOWER_LIMIT,
    upperLimit: TimeLimit.UPPER_LIMIT
  });

  constructor({pointContainer, pointsModel, offersModel, destinationsModel, filterModel, newEventButtonModel}) {
    this.#pointContainer = pointContainer;
    this.#pointsModel = pointsModel;
    this.#offersModel = offersModel;
    this.#destinationsModel = destinationsModel;
    this.#filterModel = filterModel;
    this.#newEventButtonModel = newEventButtonModel;

    this.#newPointPresenter = new NewPointPresenter({
      pointDestinations: destinationsModel,
      pointOffers: offersModel,
      pointListContainer: this.#tripListComponent,
      onDataChange: this.#handleViewAction,
      onDestroy: this.#newPointDestroyHandler
    });

    this.#newEventButtonModel.addObserver(this.#handleModelNewEventButton);
    this.#pointsModel.addObserver(this.#handleModelEvent);
    this.#filterModel.addObserver(this.#handleModelEvent);
  }

  get points() {
    this.#filterType = this.#filterModel.filter;
    const points = this.#pointsModel.points;
    const filteredPoints = filter[this.#filterType](points);

    return sort[this.#currentSortType](filteredPoints);
  }

  init() {
    this.#renderBigTrip();
  }

  #createPoint () {
    this.#currentSortType = SortType.DAY;
    this.#filterModel.setFilter(UpdateType.MAJOR, FilterType.EVERYTHING);
    this.#newPointPresenter.init();
  }

  #handleModelNewEventButton = (creating) => {
    if (creating) {
      this.#isCreating = true;
      this.#createPoint();
    }
  };

  #renderBigTrip() {
    if (this.#isLoading) {
      this.#renderLoading();
      return;
    }

    if (this.points.length === 0 && !this.#isCreating) {
      this.#renderPointListAbsence();
      return;
    }

    this.#renderSort();
    render(this.#tripListComponent, this.#pointContainer);

    if (this.points.length) {
      this.#renderPointList();
    }
  }

  #handleViewAction = async (actionType, updateType, update) => {
    this.#uiBlocker.block();

    switch (actionType) {
      case UserAction.UPDATE_POINT:
        this.#pointPresenters.get(update.id).setSaving();
        try {
          await this.#pointsModel.updatePoint(updateType, update);
        } catch(err) {
          this.#pointPresenters.get(update.id).setAborting();
        }
        break;
      case UserAction.ADD_POINT:
        this.#newPointPresenter.setSaving();
        try {
          await this.#pointsModel.addPoint(updateType, update);
        } catch(err) {
          this.#newPointPresenter.setAborting();
        }
        break;
      case UserAction.DELETE_POINT:
        this.#pointPresenters.get(update.id).setDeleting();
        try {
          await this.#pointsModel.deletePoint(updateType, update);
        } catch(err) {
          this.#pointPresenters.get(update.id).setAborting();
        }
        break;
    }

    this.#uiBlocker.unblock();
  };

  #renderSort() {
    const sortTypes = Object.values(SortType)
      .map(
        (type) => ({
          type,
          isChecked: (type === this.#currentSortType),
          isDisabled: !AvailableSortType[type]
        }),
      );

    this.#sortComponent = new SortView({
      items: sortTypes,
      onSortTypeChange: this.#handleSortTypeChange
    });

    render(this.#sortComponent, this.#pointContainer);
  }

  #renderPointListAbsence() {
    this.#pointListAbsenceComponent = new PointListAbsenceView({
      filterType: this.#filterType
    });

    render(this.#pointListAbsenceComponent, this.#pointContainer);
  }

  #renderPointList() {
    this.points.forEach((point) => {
      this.#renderPoint(point);
    });
  }

  #newPointDestroyHandler = () => {
    this.#isCreating = false;
    this.#newEventButtonModel.startCreating(false);

    if (this.points.length === 0) {
      this.#clearBigTrip();
      this.#renderBigTrip();
    }
  };

  #clearBigTrip({resetSortType = false} = {}) {
    this.#newPointPresenter.destroy();
    this.#pointPresenters.forEach((presenter) => presenter.destroy());
    this.#pointPresenters.clear();

    remove(this.#sortComponent);
    remove(this.#pointListAbsenceComponent);

    if (resetSortType) {
      this.#currentSortType = SortType.DAY;
    }
  }

  #handleModelEvent = (updateType, data) => {
    switch (updateType) {
      case UpdateType.PATCH:
        this.#pointPresenters.get(data.id).init(data);
        break;
      case UpdateType.MINOR:
        this.#clearBigTrip();
        this.#renderBigTrip();
        break;
      case UpdateType.MAJOR:
        this.#clearBigTrip({resetSortType: true});
        this.#renderBigTrip();
        break;
      case UpdateType.INIT:
        this.#isLoading = false;
        remove(this.#loadingComponent);
        this.#renderBigTrip();
        break;
    }
  };

  #handleSortTypeChange = (sortType) => {
    if (this.#currentSortType === sortType) {
      return;
    }

    this.#currentSortType = sortType;
    this.#clearBigTrip();
    this.#renderBigTrip();
  };

  #handleModeChange = () => {
    this.#newPointPresenter.destroy();
    this.#pointPresenters.forEach((presenter) => presenter.resetView());
  };

  #renderLoading() {
    render(this.#loadingComponent, this.#pointContainer, RenderPosition.AFTERBEGIN);
  }

  #renderPoint(point) {
    const pointPresenter = new PointPresenter({
      tripListContainer: this.#tripListComponent,
      offersModel: this.#offersModel,
      destinationsModel: this.#destinationsModel,
      onDataChange: this.#handleViewAction,
      onModeChange: this.#handleModeChange,
    });

    pointPresenter.init(point);
    this.#pointPresenters.set(point.id, pointPresenter);
  }
}
