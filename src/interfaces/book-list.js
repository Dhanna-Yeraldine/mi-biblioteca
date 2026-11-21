/**
 * Interfaz: la lista de libros (READ) con sus botones Editar y Eliminar.
 * Pinta con una <template> y textContent, así el texto del usuario nunca se
 * interpreta como HTML.
 */

import { READING_STATUS, STATUS_LABELS } from '../domain/book.js';

const STATUS_ICONS = Object.freeze({
  [READING_STATUS.TO_READ]: '🔖',
  [READING_STATUS.READING]: '📖',
  [READING_STATUS.FINISHED]: '✓',
});

// Fechas en formato colombiano y meses en minúscula: "20 nov 2026" (skill cards §6)
const dateFormatter = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });

function formatDate(isoDate) {
  // Se arma con las partes para no depender de los "de" y puntos que pone cada navegador.
  const parts = Object.fromEntries(
    dateFormatter.formatToParts(new Date(isoDate)).map(({ type, value }) => [type, value]),
  );
  return `${parts.day} ${parts.month.replace('.', '')} ${parts.year}`;
}

function pluralize(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export class BookList {
  #list;
  #template;
  #count;
  #emptyState;
  #emptyMessage;

  constructor({ onEdit, onDelete, onFilterChange }) {
    this.#list = document.querySelector('#book-list');
    this.#template = document.querySelector('#book-card-template');
    this.#count = document.querySelector('#book-count');
    this.#emptyState = document.querySelector('#empty-state');
    this.#emptyMessage = document.querySelector('#empty-message');

    this.#renderStatusFilter();

    // Un solo listener para todas las cards (delegación de eventos).
    this.#list.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-action]');
      if (!button) return;
      const { id } = button.closest('.book-card').dataset;
      if (button.dataset.action === 'edit') onEdit(id);
      if (button.dataset.action === 'delete') onDelete(id);
    });

    const search = document.querySelector('#search');
    const filter = document.querySelector('#status-filter');
    const emitFilters = () =>
      onFilterChange({
        search: search.value,
        status: filter.querySelector('input:checked')?.value ?? '',
      });
    search.addEventListener('input', emitFilters);
    filter.addEventListener('change', emitFilters);
  }

  /**
   * @param books libros a mostrar (ya filtrados)
   * @param total cuántos hay en total, para el contador y el mensaje vacío
   * @param editingId card a resaltar mientras se edita
   */
  render(books, { total, editingId = null }) {
    this.#list.replaceChildren(...books.map((book) => this.#createCard(book, book.id === editingId)));

    this.#count.textContent =
      books.length === total
        ? pluralize(total, 'libro', 'libros')
        : `${books.length} de ${pluralize(total, 'libro', 'libros')}`;

    this.#emptyState.hidden = books.length > 0;
    this.#emptyMessage.textContent =
      total === 0
        ? 'Aún no tienes libros. Agrega el primero con el formulario.'
        : 'Ningún libro coincide con la búsqueda o el filtro.';
  }

  focusCard(id) {
    this.#list.querySelector(`.book-card[data-id="${CSS.escape(id)}"] [data-action="edit"]`)?.focus();
  }

  #createCard(book, isEditing) {
    const card = this.#template.content.firstElementChild.cloneNode(true);
    card.dataset.id = book.id;
    card.dataset.status = book.status;
    card.classList.toggle('is-editing', isEditing);

    card.querySelector('.book-title').textContent = book.title;
    card.querySelector('.book-title').title = book.title;
    const rating = card.querySelector('.book-rating');
    if (book.rating) {
      rating.textContent = `★ ${book.rating}`;
      rating.setAttribute('aria-label', `${book.rating} de 5 estrellas`);
    } else {
      rating.remove();
    }
    card.querySelector('.book-meta').textContent = `${book.author} · ${book.genre}`;
    card.querySelector('.status-icon').textContent = STATUS_ICONS[book.status];
    card.querySelector('.status-text').textContent = STATUS_LABELS[book.status];
    card.querySelector('.book-date').textContent = `Agregado el ${formatDate(book.createdAt)}`;

    // Los botones dicen a qué libro afectan para los lectores de pantalla.
    card.querySelector('[data-action="edit"]').setAttribute('aria-label', `Editar «${book.title}»`);
    card.querySelector('[data-action="delete"]').setAttribute('aria-label', `Eliminar «${book.title}»`);
    return card;
  }

  #renderStatusFilter() {
    const container = document.querySelector('#status-filter');
    const options = [['', 'Todos'], ...Object.values(READING_STATUS).map((s) => [s, STATUS_LABELS[s]])];
    options.forEach(([value, label], index) => {
      const id = `filter-${value || 'all'}`;
      container.append(
        Object.assign(document.createElement('input'), {
          type: 'radio', name: 'status-filter', id, value, checked: index === 0,
        }),
        Object.assign(document.createElement('label'), { htmlFor: id, textContent: label }),
      );
    });
  }
}
