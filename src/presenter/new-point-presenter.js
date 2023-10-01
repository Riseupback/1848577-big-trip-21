import {remove, render, RenderPosition} from '../framework/render.js';
import PointEditView from '../view/point-edit-view.js';
import {UserAction, UpdateType} from '../const.js';

export default class NewPointPresenter {
  #pointDestinations = null;
  #pointOffers = null;

  #pointListContainer = null;
  #handleDataChange = null;
  #handleDestroy = null;

  #editPointComponent = null;

  constructor({pointDestinations, pointOffers, pointListContainer, onDataChange, onDestroy}) {
    this.#pointDestinations = pointDestinations;
    this.#pointOffers = pointOffers;
    this.#pointListContainer = pointListContainer;
    this.#handleDataChange = onDataChange;
    this.#handleDestroy = onDestroy;
  }

  init() {
    if (this.#editPointComponent !== null) {
      return;
    }

    this.#editPointComponent = new PointEditView({
      pointDestinations: this.#pointDestinations.destinations,
      pointOffers: this.#pointOffers.offers,
      onFormSubmit: this.#handleFormSubmit,
      onResetClick: this.#handleResetClick,
      isNew: true,
    });

    render(this.#editPointComponent, this.#pointListContainer.element, RenderPosition.AFTERBEGIN);

    document.addEventListener('keydown', this.#escKeyDownHandler);
  }

  destroy = () => {
    if (this.#editPointComponent === null) {
      return;
    }

    remove(this.#editPointComponent);
    this.#editPointComponent = null;
    document.removeEventListener('keydown', this.#escKeyDownHandler);

    this.#handleDestroy();
  };

  setSaving() {
    this.#editPointComponent.updateElement({
      isDisabled: true,
      isSaving: true,
    });
  }

  setAborting() {
    const resetFormState = () => {
      this.#editPointComponent.updateElement({
        isDisabled: false,
        isSaving: false,
        isDeleting: false,
      });
    };

    this.#editPointComponent.shake(resetFormState);
  }

  #handleFormSubmit = (point) => {
    this.#handleDataChange(
      UserAction.ADD_POINT,
      UpdateType.MINOR,
      point
    );
    this.destroy();
  };

  #handleResetClick = () => {
    this.destroy();
  };

  #escKeyDownHandler = (evt) => {
    if (evt.key === 'Escape' || evt.key === 'Esc') {
      evt.preventDefault();
      this.destroy();
    }
  };
}
