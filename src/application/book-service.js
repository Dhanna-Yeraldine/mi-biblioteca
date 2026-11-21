/**
 * Aplicación: los casos de uso del CRUD.
 * Recibe el repositorio por el constructor (inyección de dependencias), así que
 * no sabe si los libros viven en localStorage, en memoria o en un servidor.
 *
 * El repositorio debe cumplir este contrato (puerto):
 *   findAll(): Book[]
 *   findById(id): Book | null
 *   save(book): void      // crea o reemplaza
 *   delete(id): boolean   // true si existía
 */

import { createBook, updateBook } from '../domain/book.js';

export class BookNotFoundError extends Error {
  constructor(id) {
    super('Ese libro ya no existe. Puede que lo hayas eliminado en otra pestaña.');
    this.name = 'BookNotFoundError';
    this.bookId = id;
  }
}

/** Quita tildes y mayúsculas para que "garcia" encuentre "García". */
function toSearchable(text) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export class BookService {
  constructor({ repository, generateId, clock = () => new Date() }) {
    this.repository = repository;
    this.generateId = generateId;
    this.clock = clock;
  }

  /** CREATE */
  addBook(data) {
    const book = createBook(data, { id: this.generateId(), now: this.clock() });
    this.repository.save(book);
    return book;
  }

  /** READ: todos, con filtro opcional por texto y estado, del más reciente al más antiguo. */
  listBooks({ search = '', status = '' } = {}) {
    const query = toSearchable(search.trim());
    return this.repository
      .findAll()
      .filter((book) => !status || book.status === status)
      .filter((book) => !query || toSearchable(`${book.title} ${book.author}`).includes(query))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  /** READ: uno por id. */
  getBook(id) {
    const book = this.repository.findById(id);
    if (!book) throw new BookNotFoundError(id);
    return book;
  }

  /** UPDATE */
  editBook(id, data) {
    const updated = updateBook(this.getBook(id), data, { now: this.clock() });
    this.repository.save(updated);
    return updated;
  }

  /** DELETE: devuelve el libro borrado para poder mostrar su nombre o deshacer. */
  removeBook(id) {
    const book = this.getBook(id);
    this.repository.delete(id);
    return book;
  }

  /** Vuelve a guardar un libro borrado (botón "Deshacer"). */
  restoreBook(book) {
    this.repository.save(book);
    return book;
  }
}
