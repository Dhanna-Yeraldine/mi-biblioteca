/**
 * Interfaz: el formulario para agregar (CREATE) y editar (UPDATE) libros.
 * Solo maneja el DOM; las reglas vienen del dominio y el guardado lo decide main.js.
 */

import {
  GENRES,
  READING_STATUS,
  STATUS_LABELS,
  MAX_RATING,
  normalizeBookData,
  validateBookData,
} from '../domain/book.js';

const TEXT_FIELDS = ['title', 'author', 'genre'];
const FIELD_ORDER = ['title', 'author', 'genre', 'status', 'rating'];

export class BookForm {
  #form;
  #title;
  #submitButton;
  #cancelButton;
  #currentRating = '';

  constructor(form, { onSubmit, onCancel }) {
    this.#form = form;
    this.#title = document.querySelector('#form-title');
    this.#submitButton = form.querySelector('#submit-button');
    this.#cancelButton = form.querySelector('#cancel-edit');

    this.#renderGenres();
    this.#renderStatusOptions();
    this.#renderRatingOptions();
    this.#bindValidation();

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      onSubmit(this.#readValues(), this.editingId);
    });
    this.#cancelButton.addEventListener('click', onCancel);
    form.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.editingId) onCancel();
    });
  }

  /** id del libro en edición, o null si se está agregando uno nuevo. */
  get editingId() {
    return this.#form.elements.id.value || null;
  }

  /** Pasa a modo edición con los datos del libro. */
  fill(book) {
    this.#clearAllErrors();
    const { elements } = this.#form;
    elements.id.value = book.id;
    elements.title.value = book.title;
    elements.author.value = book.author;
    elements.genre.value = book.genre;
    this.#form.querySelector(`input[name="status"][value="${book.status}"]`).checked = true;
    this.#setRating(book.rating ?? '');

    this.#title.textContent = 'Editar libro';
    this.#submitButton.textContent = 'Guardar cambios';
    this.#cancelButton.hidden = false;
    elements.title.focus();
  }

  /** Vuelve al modo "Agregar" con el formulario limpio. */
  reset() {
    this.#form.reset();
    this.#form.elements.id.value = '';
    this.#setRating('');
    this.#clearAllErrors();
    this.#title.textContent = 'Agregar libro';
    this.#submitButton.textContent = 'Agregar libro';
    this.#cancelButton.hidden = true;
  }

  focusFirstField() {
    this.#form.elements.title.focus();
  }

  /** Muestra los errores junto a cada campo y lleva el foco al primero. */
  showErrors(fieldErrors) {
    FIELD_ORDER.forEach((field) => this.#setFieldError(field, fieldErrors[field]));
    const firstInvalid = FIELD_ORDER.find((field) => fieldErrors[field]);
    if (firstInvalid) this.#focusField(firstInvalid);
  }

  // ---------- Construcción de opciones ----------

  #renderGenres() {
    const select = this.#form.elements.genre;
    GENRES.forEach((genre) => select.add(new Option(genre, genre)));
  }

  #renderStatusOptions() {
    const container = this.#form.querySelector('#status-options');
    Object.values(READING_STATUS).forEach((status, index) => {
      const id = `status-${status}`;
      container.append(
        Object.assign(document.createElement('input'), {
          type: 'radio', name: 'status', id, value: status, checked: index === 0,
        }),
        Object.assign(document.createElement('label'), { htmlFor: id, textContent: STATUS_LABELS[status] }),
      );
    });
  }

  #renderRatingOptions() {
    const container = this.#form.querySelector('#rating-options');
    for (let value = 1; value <= MAX_RATING; value++) {
      const id = `rating-${value}`;
      const input = Object.assign(document.createElement('input'), {
        type: 'radio', name: 'rating', id, value: String(value),
      });
      const label = Object.assign(document.createElement('label'), { htmlFor: id, textContent: '★' });
      label.title = `${value} de ${MAX_RATING}`;
      label.setAttribute('aria-label', `${value} ${value === 1 ? 'estrella' : 'estrellas'}`);
      container.append(input, label);
    }

    // Un radio no se puede desmarcar con clic; aquí se permite para quitar la calificación.
    container.addEventListener('click', (event) => {
      if (event.target.name !== 'rating') return;
      const clicked = event.target.value;
      this.#setRating(clicked === this.#currentRating ? '' : clicked);
    });
  }

  #setRating(value) {
    this.#currentRating = String(value);
    this.#form.querySelectorAll('input[name="rating"]').forEach((input) => {
      input.checked = input.value === this.#currentRating;
      const filled = this.#currentRating !== '' && Number(input.value) <= Number(this.#currentRating);
      input.nextElementSibling.classList.toggle('is-filled', filled);
    });
  }

  // ---------- Lectura y validación ----------

  #readValues() {
    const { elements } = this.#form;
    return {
      title: elements.title.value,
      author: elements.author.value,
      genre: elements.genre.value,
      status: this.#form.querySelector('input[name="status"]:checked')?.value ?? '',
      rating: this.#currentRating,
    };
  }

  /** Valida un campo al salir de él y, si ya tenía error, en cada cambio (skill forms §5). */
  #bindValidation() {
    TEXT_FIELDS.forEach((field) => {
      const input = this.#form.elements[field];
      input.addEventListener('blur', () => this.#validateField(field));
      input.addEventListener('input', () => {
        if (input.getAttribute('aria-invalid') === 'true') this.#validateField(field);
      });
    });
  }

  #validateField(field) {
    const errors = validateBookData(normalizeBookData(this.#readValues()));
    this.#setFieldError(field, errors[field]);
  }

  #setFieldError(field, message) {
    const errorElement = this.#form.querySelector(`#${field}-error`);
    errorElement.textContent = message ?? '';
    errorElement.hidden = !message;
    const input = this.#form.elements[field];
    // Los grupos de radios (estado, calificación) no tienen un solo input que marcar.
    if (!(input instanceof HTMLElement)) return;
    if (message) {
      input.setAttribute('aria-invalid', 'true');
    } else {
      input.removeAttribute('aria-invalid');
    }
  }

  #clearAllErrors() {
    FIELD_ORDER.forEach((field) => this.#setFieldError(field, null));
  }

  #focusField(field) {
    const target =
      this.#form.elements[field] instanceof HTMLElement
        ? this.#form.elements[field]
        : this.#form.querySelector(`input[name="${field}"]`);
    target?.focus();
  }
}
