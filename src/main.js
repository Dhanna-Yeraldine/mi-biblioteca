/**
 * Punto de entrada: arma las piezas (composition root) y conecta las acciones
 * de la interfaz con los casos de uso.
 */

import { BookService, BookNotFoundError } from './application/book-service.js';
import { LocalStorageBookRepository } from './infrastructure/local-storage-book-repository.js';
import { ValidationError } from './domain/book.js';
import { BookForm } from './interfaces/book-form.js';
import { BookList } from './interfaces/book-list.js';
import { Toast, confirmDeletion } from './interfaces/feedback.js';

const service = new BookService({
  repository: new LocalStorageBookRepository(window.localStorage),
  generateId: () => crypto.randomUUID(),
});

const toast = new Toast();
let filters = { search: '', status: '' };

const form = new BookForm(document.querySelector('#book-form'), {
  onSubmit: handleSubmit,
  onCancel: cancelEdit,
});

const list = new BookList({
  onEdit: startEdit,
  onDelete: handleDelete,
  onFilterChange: (newFilters) => {
    filters = newFilters;
    refresh();
  },
});

/** READ: vuelve a pintar la lista con los filtros actuales. */
function refresh() {
  list.render(service.listBooks(filters), {
    total: service.listBooks().length,
    editingId: form.editingId,
  });
}

/** CREATE o UPDATE según si el formulario tiene un id. */
function handleSubmit(values, editingId) {
  try {
    if (editingId) {
      const book = service.editBook(editingId, values);
      toast.show(`Guardaste los cambios de «${book.title}»`);
      form.reset();
      refresh();
      list.focusCard(book.id);
    } else {
      const book = service.addBook(values);
      toast.show(`Agregaste «${book.title}»`);
      form.reset();
      refresh();
      form.focusFirstField();
    }
  } catch (error) {
    handleError(error);
  }
}

function startEdit(id) {
  try {
    form.fill(service.getBook(id));
    refresh();
    document.querySelector('.form-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    handleError(error);
  }
}

function cancelEdit() {
  const id = form.editingId;
  form.reset();
  refresh();
  if (id) list.focusCard(id);
}

/** DELETE con confirmación y opción de deshacer. */
async function handleDelete(id) {
  try {
    const { title } = service.getBook(id);
    if (!(await confirmDeletion(title))) return;

    const removed = service.removeBook(id);
    if (form.editingId === id) form.reset();
    refresh();
    toast.show(`Eliminaste «${removed.title}»`, {
      actionLabel: 'Deshacer',
      onAction: () => {
        service.restoreBook(removed);
        refresh();
        toast.show(`Recuperaste «${removed.title}»`);
      },
    });
  } catch (error) {
    handleError(error);
  }
}

function handleError(error) {
  if (error instanceof ValidationError) {
    form.showErrors(error.fieldErrors);
    return;
  }
  if (error instanceof BookNotFoundError) {
    form.reset();
    refresh();
    toast.show(error.message);
    return;
  }
  // Error inesperado: se informa al usuario y se deja en consola para depurar.
  console.error(error);
  toast.show('Algo salió mal y no se guardó el cambio. Intenta de nuevo.');
}

// Si se edita la biblioteca en otra pestaña, esta se actualiza sola.
window.addEventListener('storage', refresh);

refresh();
