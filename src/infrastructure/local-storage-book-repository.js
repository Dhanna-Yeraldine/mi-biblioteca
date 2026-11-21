/**
 * Infraestructura: guarda los libros en localStorage como un arreglo JSON.
 * El storage se inyecta para poder usar uno falso en los tests.
 */

export const DEFAULT_STORAGE_KEY = 'mi-biblioteca:books';

export class LocalStorageBookRepository {
  constructor(storage, key = DEFAULT_STORAGE_KEY) {
    this.storage = storage;
    this.key = key;
  }

  findAll() {
    const raw = this.storage.getItem(this.key);
    if (!raw) return [];
    try {
      const books = JSON.parse(raw);
      return Array.isArray(books) ? books : [];
    } catch {
      // Datos corruptos (editados a mano, por ejemplo): se avisa y se empieza de cero
      // en vez de romper toda la app.
      console.warn(`Los datos guardados en "${this.key}" no son JSON válido; se ignoran.`);
      return [];
    }
  }

  findById(id) {
    return this.findAll().find((book) => book.id === id) ?? null;
  }

  save(book) {
    const books = this.findAll();
    const index = books.findIndex((item) => item.id === book.id);
    if (index === -1) {
      books.push(book);
    } else {
      books[index] = book;
    }
    this.#write(books);
  }

  delete(id) {
    const books = this.findAll();
    const remaining = books.filter((book) => book.id !== id);
    this.#write(remaining);
    return remaining.length !== books.length;
  }

  #write(books) {
    this.storage.setItem(this.key, JSON.stringify(books));
  }
}
